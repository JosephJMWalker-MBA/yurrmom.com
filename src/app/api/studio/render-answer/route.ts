/**
 * Local-only constrained-rendering route (Phase 7). SERVER ONLY.
 *
 * GET  → feature status (safe: never the API key).
 * POST → accepts an AnswerRequest, runs the full trusted pipeline, returns a
 *        safe result. Disabled in production. One request per action. No retry.
 *
 * The browser controls NONE of: provider instructions, model, API key, JSON
 * schema, allowed templates, candidate validation policy, final compilation, or
 * provider URL. It supplies only the AnswerRequest.
 */
import { NextResponse } from "next/server";
import type { AnswerRequest, CommunicationDepth } from "@/domain/answer";
import type { GuidanceRisk, RepresentationPolicy } from "@/domain/knowledge";
import {
  getRenderFeatureStatus,
  isProduction,
  RENDER_LIMITS,
} from "@/server/render-config";
import { executeConstrainedRendering } from "@/server/render-pipeline";
import { OpenAICompositionProvider } from "@/server/openai-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RISKS: GuidanceRisk[] = [
  "ordinary-household", "medical", "developmental", "mental-health", "legal", "safety-critical",
];
const POLICIES: RepresentationPolicy[] = ["public-safe", "editorial-inspection"];
const DEPTHS: CommunicationDepth[] = ["brief", "standard", "detailed"];

export async function GET() {
  const status = getRenderFeatureStatus();
  return NextResponse.json({
    enabled: status.enabled,
    localOnly: true,
    provider: status.provider,
    model: status.model, // configured model string (name), not a secret
    credentialsPresent: status.credentialsPresent,
    reason: status.reason,
  });
}

export async function POST(request: Request) {
  if (isProduction()) {
    return json(403, { code: "disabled-in-production", message: "The live renderer is disabled in production." });
  }

  // Body-size guard.
  const raw = await request.text();
  if (raw.length > RENDER_LIMITS.requestBodyBytes) {
    return json(413, { code: "request-too-large", message: "Request body exceeds the allowed size." });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { code: "invalid-json", message: "Request body is not valid JSON." });
  }

  const parsed = parseAnswerRequest(body);
  if (!parsed.ok) {
    return json(400, { code: "invalid-request", message: parsed.reason });
  }

  const status = getRenderFeatureStatus();
  const provider =
    status.enabled && status.provider === "openai"
      ? new OpenAICompositionProvider({
          model: status.model,
          apiKey: process.env.OPENAI_API_KEY ?? "",
        })
      : undefined;

  try {
    const outcome = await executeConstrainedRendering(parsed.request, { provider });
    return json(200, safeOutcome(outcome, status));
  } catch {
    // Never return a stack trace.
    return json(500, { code: "render-failed", message: "Rendering failed. The deterministic preview remains available." });
  }
}

// ----------------------------------------------------------- helpers

function json(statusCode: number, payload: unknown) {
  return NextResponse.json(payload, { status: statusCode });
}

function parseAnswerRequest(body: unknown):
  | { ok: true; request: AnswerRequest }
  | { ok: false; reason: string } {
  if (!body || typeof body !== "object") return { ok: false, reason: "Body must be an object." };
  const b = body as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") as string[] : undefined);

  const question = str(b.question);
  if (!question || question.trim().length === 0) return { ok: false, reason: "question is required." };
  if (question.length > 2000) return { ok: false, reason: "question is too long." };
  const requestedLocale = str(b.requestedLocale) ?? "en";
  const representationPolicy = str(b.representationPolicy) as RepresentationPolicy | undefined;
  if (!representationPolicy || !POLICIES.includes(representationPolicy)) return { ok: false, reason: "representationPolicy is invalid." };
  const guidanceRisk = str(b.guidanceRisk) as GuidanceRisk | undefined;
  if (!guidanceRisk || !RISKS.includes(guidanceRisk)) return { ok: false, reason: "guidanceRisk is invalid." };
  const depth = (str(b.depth) as CommunicationDepth | undefined) ?? "standard";
  if (!DEPTHS.includes(depth)) return { ok: false, reason: "depth is invalid." };

  const req: AnswerRequest = {
    question,
    requestedLocale,
    representationPolicy,
    guidanceRisk,
    depth,
    householdCircumstances: arr(b.householdCircumstances),
    developmentalStage: str(b.developmentalStage),
    householdDomain: str(b.householdDomain),
    constraints: arr(b.constraints),
    taskOrSkill: str(b.taskOrSkill),
    jurisdiction: str(b.jurisdiction),
    systemScope: str(b.systemScope),
    creatorScope: str(b.creatorScope),
  };
  return { ok: true, request: req };
}

/** Shape the pipeline outcome into a browser-safe payload (no secrets, no prompts). */
function safeOutcome(
  outcome: Awaited<ReturnType<typeof executeConstrainedRendering>>,
  status: ReturnType<typeof getRenderFeatureStatus>,
) {
  const base = {
    provider: status.provider,
    model: status.model,
    planFingerprint: outcome.plan.planFingerprint,
    disposition: outcome.plan.disposition,
    diagnostics: outcome.diagnostics,
  };
  if (outcome.status === "rendered") {
    return { status: "rendered", ...base, rendered: outcome.rendered };
  }
  if (outcome.status === "plan-invalid") {
    return { status: "plan-invalid", ...base, reason: outcome.reason, planValidation: outcome.plan.validation };
  }
  return {
    status: "fallback",
    ...base,
    reason: outcome.reason,
    rejectionCodes: outcome.rejectionCodes ?? [],
    preview: outcome.preview,
  };
}
