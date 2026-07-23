/**
 * Deterministic final compiler (Phase 7).
 *
 * Produces the trusted RenderedAnswer from the AnswerPlan and a VALIDATED
 * candidate. Every substantive sentence is the EXACT AnswerPoint.proposition
 * wrapped by a fixed template; citations come from AnswerPlan.citationMap, not
 * the candidate. The model chose ordering/grouping/templates only — it cannot
 * alter a proposition, a citation, a warning, a limitation, or escalation text.
 */
import { fingerprint } from "./fingerprint";
import type { CompositionCandidate } from "./candidate";
import { fingerprintCandidate } from "./candidate";
import {
  CONCLUSION_TEXT,
  SECTION_HEADING,
  type SectionTemplateId,
} from "./templates";
import type { AnswerPlan, AnswerPoint, CitationEntry, ValidationResult } from "./types";

export const RENDERED_ANSWER_SCHEMA = "rendered-answer/1";

export type RenderedItemKind =
  | "point"
  | "limitation"
  | "conflict"
  | "missing"
  | "escalation"
  | "citation";

export interface RenderedItem {
  kind: RenderedItemKind;
  pointId?: string;
  text: string;
  citationLabels: string[];
}

export interface RenderedSection {
  templateId: string;
  heading: string;
  items: RenderedItem[];
}

export interface RenderedCitation {
  label: string;
  attribution: string;
  sourceType: string;
  excerpt: string;
  locale: string;
  translationStatus: string;
  link?: string;
}

export interface ProviderDisplayMeta {
  renderer: string;
  provider: string;
  model: string;
  requestId?: string;
  latencyMs?: number;
  tokenUsage?: { input?: number; output?: number };
}

export interface RenderedAnswer {
  schemaVersion: string;
  answerId: string;
  planId: string;
  planFingerprint: string;
  candidateFingerprint: string;
  disposition: string;
  requestedLocale: string;
  title: string;
  intro: string;
  sections: RenderedSection[];
  conclusion: string;
  citations: RenderedCitation[];
  mandatoryQualifications: string[];
  escalationDisclosure: string;
  providerMeta: ProviderDisplayMeta;
  finalFingerprint: string;
  /** Set by the pipeline after final validation (excluded from the fingerprint). */
  validation?: ValidationResult;
}

// ---- deterministic wrappers (exact proposition, never altered) ----

/** Trusted wrapper for a single point — used by compiler AND final validator. */
export function wrapPointText(point: AnswerPoint): string {
  const cites = point.citationIds.map((l) => `[${l}]`).join("");
  const suffix = cites ? ` ${cites}` : "";
  switch (point.supportClass) {
    case "creator-original":
    case "creator-approved-translation":
    case "reviewed-translation":
      return `One household reports: ${point.proposition}${suffix}`;
    case "curated-authoritative":
      return `${point.proposition}${suffix}`;
    default:
      return `${point.proposition}${suffix}`;
  }
}

function titleText(plan: AnswerPlan, templateId: string): string {
  switch (templateId) {
    case "household-exploration":
      return "How one household approaches this";
    case "qualified-guidance":
      return "What the evidence supports — and its limits";
    case "insufficient-evidence":
      return "Not enough reviewed evidence to answer this";
    case "professional-escalation":
      return "This needs a qualified professional";
    case "conflicting-evidence":
      return "Reviewed sources disagree on this";
    case "question-focused":
    default:
      return plan.request.question.trim() || "Your question";
  }
}

function introText(plan: AnswerPlan, templateId: string): string {
  switch (templateId) {
    case "experience-framing":
      return "The following reflects one household's lived experience, not universal instruction.";
    case "scope-first":
      return "This applies only within the stated scope, audience, and dates.";
    case "abstention-first":
      return "There is not enough eligible authoritative evidence to give guidance here.";
    case "conflict-first":
      return "Reviewed sources disagree, so no single position is presented as settled.";
    case "direct-opening":
    default:
      return "";
  }
}

function compileSection(
  plan: AnswerPlan,
  templateId: SectionTemplateId,
  orderedPointIds: string[],
  pointById: Map<string, AnswerPoint>,
): RenderedSection {
  const heading = SECTION_HEADING[templateId];
  const items: RenderedItem[] = [];

  switch (templateId) {
    case "what-the-household-does":
    case "what-reviewed-guidance-supports":
      for (const pid of orderedPointIds) {
        const p = pointById.get(pid);
        if (!p) continue;
        items.push({ kind: "point", pointId: p.id, text: wrapPointText(p), citationLabels: p.citationIds });
      }
      break;
    case "important-limits":
      for (const lim of plan.limitations) items.push({ kind: "limitation", text: `Important limitation: ${lim}`, citationLabels: [] });
      break;
    case "where-sources-disagree":
      for (const c of plan.conflicts) items.push({ kind: "conflict", text: c, citationLabels: [] });
      break;
    case "what-is-missing":
      for (const m of plan.missingEvidence) items.push({ kind: "missing", text: m, citationLabels: [] });
      break;
    case "next-safe-step":
      if (plan.escalation.type !== "none")
        items.push({ kind: "escalation", text: plan.escalation.requiredWording, citationLabels: [] });
      break;
    case "sources":
      for (const c of plan.citationMap)
        items.push({ kind: "citation", text: `[${c.label}] ${c.attribution}`, citationLabels: [c.label] });
      break;
  }
  return { templateId, heading, items };
}

export function compileRenderedAnswer(
  plan: AnswerPlan,
  candidate: CompositionCandidate,
  providerMeta: ProviderDisplayMeta,
): RenderedAnswer {
  const pointById = new Map(plan.permittedAnswerPoints.map((p) => [p.id, p]));

  const sections: RenderedSection[] = candidate.sections.map((s) =>
    compileSection(plan, s.sectionTemplateId as SectionTemplateId, s.orderedPointIds, pointById),
  );

  const citations: RenderedCitation[] = plan.citationMap.map((c: CitationEntry) => ({
    label: c.label,
    attribution: c.attribution,
    sourceType: c.sourceType,
    excerpt: c.exactExcerpt,
    locale: c.locale,
    translationStatus: c.translationStatus,
    link: c.link,
  }));

  const draft: Omit<RenderedAnswer, "finalFingerprint" | "answerId"> = {
    schemaVersion: RENDERED_ANSWER_SCHEMA,
    planId: plan.planId,
    planFingerprint: plan.planFingerprint,
    candidateFingerprint: fingerprintCandidate(candidate),
    disposition: plan.disposition,
    requestedLocale: plan.request.requestedLocale,
    title: titleText(plan, candidate.titleTemplateId),
    intro: introText(plan, candidate.introTemplateId),
    sections,
    conclusion: CONCLUSION_TEXT[candidate.conclusionTemplateId as keyof typeof CONCLUSION_TEXT] ?? "",
    citations,
    mandatoryQualifications: plan.limitations,
    escalationDisclosure: plan.escalation.type !== "none" ? plan.escalation.requiredWording : "",
    providerMeta,
  };

  const finalFingerprint = fingerprint({
    ...draft,
    // providerMeta latency/requestId are volatile → exclude from the content hash
    providerMeta: { renderer: providerMeta.renderer, provider: providerMeta.provider, model: providerMeta.model },
  });
  const answerId = `ans:${plan.planFingerprint}:${fingerprintCandidate(candidate)}`;

  return { ...draft, answerId, finalFingerprint };
}
