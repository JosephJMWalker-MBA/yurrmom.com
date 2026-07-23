/**
 * Provider-independent model-composition boundary (Phase 7).
 *
 * The async seam a live provider implements. The domain layer defines the
 * interface and the versioned instruction; it imports NO vendor SDK. A live
 * provider receives ONLY a RenderContract — never a raw packet, plan, or
 * canonical objects — and returns a structured CompositionCandidate.
 */
import type { CompositionCandidate } from "./candidate";
import type { RenderContract } from "./render-contract";

export const PROVIDER_INSTRUCTION_VERSION = "render-instruction/2026-07-1";

export type ProviderCapability =
  | "not-configured"
  | "disabled"
  | "local-development-only"
  | "ready"
  | "in-progress"
  | "provider-refusal"
  | "invalid-structured-output"
  | "candidate-rejected"
  | "validated-candidate"
  | "provider-error"
  | "timeout";

export interface ProviderConfiguration {
  provider: string; // "openai" | "none" | ...
  /** The configured model string (safe to display; not a secret). */
  model: string;
  /** Whether credentials are present server-side. Never the key itself. */
  credentialsPresent: boolean;
  enabled: boolean;
  localOnly: boolean;
}

export interface ProviderSuccess {
  ok: true;
  candidate: CompositionCandidate;
  meta: {
    provider: string;
    model: string;
    requestId?: string;
    latencyMs?: number;
    tokenUsage?: { input?: number; output?: number };
  };
}

export interface ProviderFailure {
  ok: false;
  capability: Extract<
    ProviderCapability,
    | "not-configured"
    | "disabled"
    | "provider-refusal"
    | "invalid-structured-output"
    | "provider-error"
    | "timeout"
  >;
  /** Safe, non-sensitive reason. Never a stack trace or key. */
  reason: string;
  requestId?: string;
  latencyMs?: number;
}

export type ProviderResult = ProviderSuccess | ProviderFailure;

export interface ModelCompositionProvider {
  name: string;
  configuration(): ProviderConfiguration;
  /**
   * Compose from a RenderContract. Exactly ONE attempt; no retry, no streaming,
   * no tools, no conversation state.
   */
  compose(contract: RenderContract): Promise<ProviderResult>;
}

/**
 * The versioned instruction the provider is given. It receives the
 * RenderContract, not the raw plan or packet. The instruction forbids the model
 * from doing anything but selecting and ordering supplied IDs.
 */
export function buildProviderInstruction(contract: RenderContract): {
  version: string;
  system: string;
  developer: string;
} {
  const system = [
    "You are arranging pre-approved answer elements for a household-knowledge system.",
    "You are NOT answering the user's question independently.",
    "You may ONLY select and order the supplied point IDs, and select the supplied template IDs.",
    "You may NOT add factual language, sentences, or claims.",
    "You may NOT change the disposition.",
    "You may NOT change, add, or remove citations.",
    "You may NOT omit any mandatory point, warning, limitation, conflict, or escalation.",
    "You may NOT infer facts or fill gaps.",
    "You may NOT provide medical, legal, developmental, mental-health, or safety guidance.",
    "You have NO tools and must not request any.",
    "Return ONLY the required structured object. If you cannot comply, set refusal=true and return no sections.",
  ].join(" ");

  const developer = [
    `Instruction version: ${PROVIDER_INSTRUCTION_VERSION}.`,
    "Below is the RenderContract. Choose a style, title/intro/conclusion templates, a citation style,",
    "and order the permitted point IDs into the allowed sections. Include every mandatory section that",
    "the contract requires (conflicts, missing evidence, escalation, limits, sources). Do not place a",
    "point into an incompatible section. Do not exceed the optional-point cap.",
    "",
    "RENDER_CONTRACT:",
    JSON.stringify({
      schemaVersion: contract.schemaVersion,
      planId: contract.planId,
      planFingerprint: contract.planFingerprint,
      userQuestion: contract.userQuestion,
      requestedLocale: contract.requestedLocale,
      communicationDepth: contract.communicationDepth,
      disposition: contract.disposition,
      coverage: contract.coverage,
      permittedPoints: contract.permittedPoints.map((p) => ({
        id: p.id,
        proposition: p.proposition,
        role: p.role,
        required: p.required,
        citationLabels: p.citationLabels,
      })),
      mandatoryPointIds: contract.mandatoryPointIds,
      optionalPointIds: contract.optionalPointIds,
      optionalPointCap: contract.optionalPointCap,
      livedExperienceAvailable: contract.livedExperienceAvailable,
      authoritativePointAvailable: contract.authoritativePointAvailable,
      conflictsToDisclose: contract.conflictsToDisclose.length,
      escalationType: contract.escalationType,
      allowedStyleIds: contract.allowedStyleIds,
      allowedTitleTemplateIds: contract.allowedTitleTemplateIds,
      allowedIntroTemplateIds: contract.allowedIntroTemplateIds,
      allowedSectionTemplateIds: contract.allowedSectionTemplateIds,
      allowedConclusionTemplateIds: contract.allowedConclusionTemplateIds,
      allowedCitationStyleIds: contract.allowedCitationStyleIds,
    }),
  ].join("\n");

  return { version: PROVIDER_INSTRUCTION_VERSION, system, developer };
}
