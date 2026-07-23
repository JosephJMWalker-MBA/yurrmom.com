/**
 * RenderContract (Phase 7).
 *
 * The ONLY object a live model may see. Derived exclusively from a VALID
 * AnswerPlan. It contains what the model needs to make PRESENTATION choices —
 * exact propositions (which it may order, never rewrite), template ID menus,
 * mandatory content, and prohibitions. It deliberately excludes:
 *   - the raw EvidencePacket
 *   - retrieval scores
 *   - canonical creator objects / reference registry
 *   - retailer offers or affiliate metadata
 *   - hidden application state
 *
 * No framework imports. No SDK. No model instructions to "improve" evidence.
 */
import { fingerprint } from "./fingerprint";
import {
  CITATION_STYLE_IDS,
  CONCLUSION_TEMPLATE_IDS,
  DEPTH_OPTIONAL_CAP,
  INTRO_TEMPLATE_IDS,
  SECTION_TEMPLATE_IDS,
  STYLE_IDS,
  TITLE_TEMPLATE_IDS,
  type CitationStyleId,
  type ConclusionTemplateId,
  type IntroTemplateId,
  type SectionTemplateId,
  type StyleId,
  type TitleTemplateId,
} from "./templates";
import type { AnswerPlan, Disposition } from "./types";

export const RENDER_CONTRACT_SCHEMA = "render-contract/1";

export interface ContractPoint {
  id: string;
  /** Exact proposition — the model MAY order it, MAY NOT rewrite it. */
  proposition: string;
  role: string;
  supportClass: string;
  required: boolean;
  prescriptiveAllowed: boolean;
  citationLabels: string[];
  applicability?: string;
  warnings: string[];
}

export interface RenderContract {
  schemaVersion: string;
  planId: string;
  planFingerprint: string;
  policyVersion: string;
  userQuestion: string;
  requestedLocale: string;
  communicationDepth: string;
  disposition: Disposition;
  coverage: string;
  permittedPoints: ContractPoint[];
  mandatoryPointIds: string[];
  optionalPointIds: string[];
  prohibitedPointIds: string[];
  livedExperienceAvailable: boolean;
  authoritativePointAvailable: boolean;
  conflictsToDisclose: string[];
  mandatoryQualificationTexts: string[];
  requiredWarnings: string[];
  escalationType: string;
  escalationRequiredWording: string;
  prohibitedAssertionCodes: string[];
  optionalPointCap: number;
  allowedStyleIds: StyleId[];
  allowedTitleTemplateIds: TitleTemplateId[];
  allowedIntroTemplateIds: IntroTemplateId[];
  allowedSectionTemplateIds: SectionTemplateId[];
  allowedConclusionTemplateIds: ConclusionTemplateId[];
  allowedCitationStyleIds: CitationStyleId[];
  contractFingerprint: string;
}

const ABSTENTION_DISPOSITIONS: Disposition[] = [
  "abstain-insufficient-evidence",
  "abstain-authoritative-support-required",
  "escalate-to-qualified-professional",
];

/**
 * Allowed title/intro menus are constrained by disposition so the model cannot
 * choose a confident opening for an abstention or hide a conflict.
 */
function allowedTitles(d: Disposition): TitleTemplateId[] {
  if (d === "conflicted-guidance") return ["conflicting-evidence", "question-focused"];
  if (ABSTENTION_DISPOSITIONS.includes(d)) {
    return d === "abstain-insufficient-evidence"
      ? ["insufficient-evidence", "question-focused"]
      : ["professional-escalation", "insufficient-evidence", "question-focused"];
  }
  if (d === "supported-guidance") return ["qualified-guidance", "question-focused"];
  if (d === "qualified-household-exploration") return ["qualified-guidance", "household-exploration", "question-focused"];
  return ["household-exploration", "question-focused"];
}

function allowedIntros(d: Disposition): IntroTemplateId[] {
  if (d === "conflicted-guidance") return ["conflict-first", "scope-first"];
  if (ABSTENTION_DISPOSITIONS.includes(d)) return ["abstention-first", "scope-first"];
  if (d === "supported-guidance") return ["scope-first", "direct-opening"];
  return ["experience-framing", "direct-opening", "scope-first"];
}

/**
 * Build a RenderContract from a plan. THROWS if the plan is not valid — a live
 * renderer must never run on an unvalidated plan.
 */
export function buildRenderContract(plan: AnswerPlan): RenderContract {
  if (!plan.validation.valid) {
    throw new Error("Refusing to build a RenderContract from an invalid AnswerPlan.");
  }

  const permittedPoints: ContractPoint[] = plan.permittedAnswerPoints.map((p) => ({
    id: p.id,
    proposition: p.proposition,
    role: p.role,
    supportClass: p.supportClass,
    required: p.omission !== "optional",
    prescriptiveAllowed: p.prescriptiveAllowed,
    citationLabels: p.citationIds,
    applicability: p.applicability,
    warnings: p.warnings,
  }));

  const mandatoryPointIds = permittedPoints.filter((p) => p.required).map((p) => p.id);
  const optionalPointIds = permittedPoints.filter((p) => !p.required).map((p) => p.id);

  const draft: Omit<RenderContract, "contractFingerprint"> = {
    schemaVersion: RENDER_CONTRACT_SCHEMA,
    planId: plan.planId,
    planFingerprint: plan.planFingerprint,
    policyVersion: plan.policyVersion,
    userQuestion: plan.request.question,
    requestedLocale: plan.request.requestedLocale,
    communicationDepth: plan.request.depth,
    disposition: plan.disposition,
    coverage: plan.coverage,
    permittedPoints,
    mandatoryPointIds,
    optionalPointIds,
    prohibitedPointIds: [],
    livedExperienceAvailable:
      plan.livedExperienceExamples.length > 0 && plan.escalation.householdExamplesAllowed,
    authoritativePointAvailable: plan.authoritativePoints.length > 0,
    conflictsToDisclose: plan.conflicts,
    mandatoryQualificationTexts: plan.limitations,
    requiredWarnings: plan.requiredWarnings,
    escalationType: plan.escalation.type,
    escalationRequiredWording: plan.escalation.requiredWording,
    prohibitedAssertionCodes: plan.prohibitedAssertions.map((p) => p.code),
    optionalPointCap: DEPTH_OPTIONAL_CAP[plan.request.depth] ?? 4,
    allowedStyleIds: [...STYLE_IDS],
    allowedTitleTemplateIds: allowedTitles(plan.disposition),
    allowedIntroTemplateIds: allowedIntros(plan.disposition),
    allowedSectionTemplateIds: [...SECTION_TEMPLATE_IDS],
    allowedConclusionTemplateIds: [...CONCLUSION_TEMPLATE_IDS],
    allowedCitationStyleIds: [...CITATION_STYLE_IDS],
  };

  return { ...draft, contractFingerprint: fingerprint(draft) };
}
