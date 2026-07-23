/**
 * Server-owned constrained-rendering pipeline (Phase 7) — SERVER ONLY.
 *
 * Full trusted flow. It reconstructs the plan from TRUSTED production data (it
 * never trusts a client-supplied plan or `plan.validation.valid`), builds a
 * minimal RenderContract, invokes the configured provider at most once,
 * validates the candidate deterministically, compiles the trusted answer, and
 * validates the final output. Any failure falls back to the deterministic
 * preview. Reuses Phase 4–6 functions; duplicates none.
 */
import {
  answerRenderer,
  answerRequestToQuery,
  buildRenderContract,
  compileRenderedAnswer,
  planAnswer,
  validateAnswerPlan,
  validateCompositionCandidate,
  validateRenderedAnswer,
  type AnswerPlan,
  type AnswerRequest,
  type CompositionCandidate,
  type ModelCompositionProvider,
  type RenderContract,
  type RenderedAnswer,
  type RendererPreview,
} from "@/domain/answer";
import {
  retrieve,
  type EvidencePacket,
  type KnowledgeUnit,
} from "@/domain/knowledge";
import type { TranslationRecord } from "@/domain/translation";
import { knowledgeCorpus, knowledgeTranslations } from "@/data/knowledge-corpus";
import { makeDiagnostics, logDiagnostics, type RenderDiagnostics } from "./diagnostics";

export interface RenderDependencies {
  corpus?: readonly KnowledgeUnit[];
  translations?: readonly TranslationRecord[];
  provider?: ModelCompositionProvider;
  now?: Date;
}

export type RenderOutcome =
  | {
      status: "rendered";
      rendered: RenderedAnswer;
      contract: RenderContract;
      candidate: CompositionCandidate;
      plan: AnswerPlan;
      diagnostics: RenderDiagnostics;
    }
  | {
      status: "fallback";
      reason: string;
      plan: AnswerPlan;
      preview: RendererPreview;
      diagnostics: RenderDiagnostics;
      /** Validation error codes when a candidate/answer was rejected. */
      rejectionCodes?: string[];
    }
  | {
      status: "plan-invalid";
      reason: string;
      plan: AnswerPlan;
      diagnostics: RenderDiagnostics;
    };

/** Reconstruct + validate the plan from trusted production data. */
export function buildTrustedPlan(
  request: AnswerRequest,
  deps: RenderDependencies,
): { plan: AnswerPlan; packet: EvidencePacket } {
  const corpus = deps.corpus ?? knowledgeCorpus;
  const translations = deps.translations ?? knowledgeTranslations;
  const packet = retrieve(answerRequestToQuery(request), corpus, translations, 12, deps.now);
  const plan = planAnswer(request, packet, { now: deps.now });
  // Do NOT trust plan.validation from anywhere but our own function.
  plan.validation = validateAnswerPlan(plan, packet);
  return { plan, packet };
}

export async function executeConstrainedRendering(
  request: AnswerRequest,
  deps: RenderDependencies = {},
): Promise<RenderOutcome> {
  const { plan } = buildTrustedPlan(request, deps);
  const providerName = deps.provider?.name ?? "none";
  const model = deps.provider?.configuration().model ?? "";

  // Gate 1: the plan itself must pass deterministic validation.
  if (!plan.validation.valid) {
    const diagnostics = makeDiagnostics({
      provider: providerName,
      model,
      planFingerprint: plan.planFingerprint,
      status: "plan-invalid",
      validationErrorCodes: plan.validation.errors.map((e) => e.code),
    });
    logDiagnostics(diagnostics);
    return { status: "plan-invalid", reason: "Plan failed deterministic validation.", plan, diagnostics };
  }

  const preview = answerRenderer.renderPreview(plan);
  const fallbackPreview: RendererPreview =
    preview.ok ? preview.preview : { blocks: [], text: "" };

  // No provider → deterministic fallback (not an error).
  if (!deps.provider || !deps.provider.configuration().enabled) {
    const diagnostics = makeDiagnostics({ provider: providerName, model, planFingerprint: plan.planFingerprint, status: "fallback-no-provider" });
    logDiagnostics(diagnostics);
    return { status: "fallback", reason: "Live renderer not configured; showing the deterministic preview.", plan, preview: fallbackPreview, diagnostics };
  }

  // Gate 2: build the minimal contract (throws if plan invalid — already checked).
  const contract = buildRenderContract(plan);

  // Gate 3: exactly one provider attempt.
  const result = await deps.provider.compose(contract);
  if (!result.ok) {
    const diagnostics = makeDiagnostics({
      provider: providerName, model, planFingerprint: plan.planFingerprint,
      status: `fallback-${result.capability}`, latencyMs: result.latencyMs, requestId: result.requestId,
    });
    logDiagnostics(diagnostics);
    return { status: "fallback", reason: result.reason, plan, preview: fallbackPreview, diagnostics };
  }

  const candidate = result.candidate;

  // A structured refusal → deterministic fallback.
  if (candidate.refusal) {
    const diagnostics = makeDiagnostics({ provider: providerName, model, planFingerprint: plan.planFingerprint, status: "fallback-refusal", latencyMs: result.meta.latencyMs, requestId: result.meta.requestId });
    logDiagnostics(diagnostics);
    return { status: "fallback", reason: candidate.refusalReason || "Provider refused to compose.", plan, preview: fallbackPreview, diagnostics };
  }

  // Gate 4: deterministic candidate validation.
  const candValidation = validateCompositionCandidate(candidate, contract);
  if (!candValidation.valid) {
    const diagnostics = makeDiagnostics({
      provider: providerName, model, planFingerprint: plan.planFingerprint,
      status: "fallback-candidate-rejected", latencyMs: result.meta.latencyMs, requestId: result.meta.requestId,
      validationErrorCodes: candValidation.errors.map((e) => e.code),
    });
    logDiagnostics(diagnostics);
    return { status: "fallback", reason: "Model composition rejected by deterministic validation.", plan, preview: fallbackPreview, diagnostics, rejectionCodes: candValidation.errors.map((e) => e.code) };
  }

  // Gate 5: deterministic compilation from trusted fields.
  const rendered = compileRenderedAnswer(plan, candidate, {
    renderer: "constrained-model-composition",
    provider: result.meta.provider,
    model: result.meta.model,
    requestId: result.meta.requestId,
    latencyMs: result.meta.latencyMs,
    tokenUsage: result.meta.tokenUsage,
  });

  // Gate 6: final rendered-answer validation.
  const finalValidation = validateRenderedAnswer(rendered, plan, candidate);
  rendered.finalFingerprint = rendered.finalFingerprint; // unchanged; explicit for clarity
  if (!finalValidation.valid) {
    const diagnostics = makeDiagnostics({
      provider: providerName, model, planFingerprint: plan.planFingerprint,
      candidateFingerprint: rendered.candidateFingerprint, finalFingerprint: rendered.finalFingerprint,
      status: "fallback-final-rejected", latencyMs: result.meta.latencyMs, requestId: result.meta.requestId,
      validationErrorCodes: finalValidation.errors.map((e) => e.code),
    });
    logDiagnostics(diagnostics);
    return { status: "fallback", reason: "Compiled answer rejected by final validation.", plan, preview: fallbackPreview, diagnostics, rejectionCodes: finalValidation.errors.map((e) => e.code) };
  }

  const diagnostics = makeDiagnostics({
    provider: providerName, model, planFingerprint: plan.planFingerprint,
    candidateFingerprint: rendered.candidateFingerprint, finalFingerprint: rendered.finalFingerprint,
    status: "rendered", latencyMs: result.meta.latencyMs, tokenUsage: result.meta.tokenUsage, requestId: result.meta.requestId,
  });
  logDiagnostics(diagnostics);
  rendered.validation = finalValidation;
  return { status: "rendered", rendered, contract, candidate, plan, diagnostics };
}
