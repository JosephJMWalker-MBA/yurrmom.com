/**
 * Grounded Answer Plan — domain types (Phase 6).
 *
 * An AnswerPlan is a DERIVED, read-only artifact that transforms an
 * EvidencePacket into an *answer contract*: what a future renderer or language
 * model is permitted to communicate, how it must be qualified, which citations
 * support each point, which distinctions must stay visible, and when the system
 * must abstain or escalate. It is NOT a conversational answer, and it never
 * mutates canonical content, units, translations, reference material, or the
 * packet.
 *
 * This layer depends on the knowledge layer only. It never imports the
 * reference layer, and it introduces no model, provider, or scoring of truth.
 *
 * No framework imports belong in this module.
 */
import type {
  EvidencePacket,
  GuidanceRisk,
  NormalizedQuery,
  RepresentationPolicy,
} from "../knowledge";

// ------------------------------------------------------------ request

export type CommunicationDepth = "brief" | "standard" | "detailed";

/**
 * Caller-supplied only. Nothing is inferred — not family facts, not the risk
 * category. Mirrors KnowledgeQuery inputs so the planner can build/reference a
 * KnowledgeQuery without duplicating normalization.
 */
export interface AnswerRequest {
  question: string;
  requestedLocale: string;
  representationPolicy: RepresentationPolicy;
  guidanceRisk: GuidanceRisk;
  householdCircumstances?: string[];
  developmentalStage?: string;
  householdDomain?: string;
  constraints?: string[];
  taskOrSkill?: string;
  jurisdiction?: string;
  systemScope?: string;
  creatorScope?: string;
  depth: CommunicationDepth;
}

// ------------------------------------------------------------ disposition

export type Disposition =
  | "household-exploration"
  | "qualified-household-exploration"
  | "supported-guidance"
  | "conflicted-guidance"
  | "abstain-insufficient-evidence"
  | "abstain-authoritative-support-required"
  | "escalate-to-qualified-professional";

// ------------------------------------------------------------ answer points

export type PointRole =
  | "direct-response"
  | "household-method"
  | "creator-experience"
  | "authoritative-guidance"
  | "definition"
  | "limitation"
  | "caution"
  | "alternative"
  | "conflict"
  | "missing-evidence"
  | "escalation";

export type SupportClass =
  | "creator-original"
  | "creator-approved-translation"
  | "reviewed-translation"
  | "curated-authoritative"
  | "professional-experience"
  | "platform-synthesis"
  | "unsupported";

/** Whether the point may be omitted by the renderer. */
export type OmissionRule = "required" | "optional" | "prohibited-from-omission";

export interface AnswerPoint {
  id: string;
  role: PointRole;
  /** Proposition, mechanically traceable to its sources (no broad paraphrase). */
  proposition: string;
  supportClass: SupportClass;
  /** EvidenceHit ranks (stable IDs) that support this point. */
  supportingHitIds: string[];
  /** Citation labels ([1], [2]…) that back this point. */
  citationIds: string[];
  sourceLocale?: string;
  effectiveLocale?: string;
  applicability?: string;
  limitations: string[];
  warnings: string[];
  /** Whether prescriptive ("you should…") phrasing is permitted for this point. */
  prescriptiveAllowed: boolean;
  omission: OmissionRule;
}

// ------------------------------------------------------------ support ledger

export type SupportRelation =
  | "directly-states"
  | "supports"
  | "defines"
  | "qualifies"
  | "limits"
  | "contradicts"
  | "illustrates"
  | "background-only";

export interface SupportLedgerEntry {
  pointId: string;
  proposition: string;
  supportingHitIds: string[];
  supportingUnitIds: string[];
  sourceObject: string;
  sourceVersion: number;
  supportRelation: SupportRelation;
  /** For curated-claim support only. */
  authoritativeEligible?: boolean;
  interpretationLevel?: string;
  citationIds: string[];
  supportWarnings: string[];
}

// ------------------------------------------------------------ citation map

export interface CitationLocator {
  page?: string;
  sectionHeading?: string;
  paragraphIndex?: number;
  lineRange?: string;
  urlFragment?: string;
  tableOrFigure?: string;
}

export interface CitationEntry {
  /** Stable label, e.g. "1" (rendered as [1]). */
  label: string;
  hitId: string;
  unitId: string;
  sourceObject: string;
  sourceVersion: number;
  title: string;
  attribution: string;
  sourceType: string;
  exactExcerpt: string;
  locator?: CitationLocator;
  evidenceHash?: string;
  locale: string;
  translationStatus: string;
  reviewStatus: string;
  authoritativeEligible?: boolean;
  applicability?: string;
  limitations?: string;
  link?: string;
  licensingNote?: string;
}

export type CitationMap = CitationEntry[];

// ------------------------------------------------------------ qualifications

export type QualificationKind =
  | "creator-limitation"
  | "curated-limitation"
  | "exclusion"
  | "jurisdiction-limit"
  | "developmental-applicability"
  | "household-circumstance"
  | "translation-caution"
  | "stale-or-unapproved-translation"
  | "unresolved-conflict"
  | "missing-authority"
  | "incomplete-coverage";

export interface Qualification {
  kind: QualificationKind;
  text: string;
  /** Mandatory qualifications must appear in any eventual answer. */
  mandatory: boolean;
  /** Related citation labels, when the qualification is source-backed. */
  citationIds: string[];
}

// ------------------------------------------------------------ prohibitions

export interface ProhibitedAssertion {
  code: string;
  text: string;
}

// ------------------------------------------------------------ escalation

export type EscalationType =
  | "none"
  | "qualified-professional"
  | "pediatric-or-developmental-professional"
  | "licensed-medical-professional"
  | "licensed-mental-health-professional"
  | "qualified-legal-professional"
  | "immediate-safety-response";

export interface EscalationDirective {
  type: EscalationType;
  riskCategory: GuidanceRisk;
  reason: string;
  /** Neutral wording a renderer must use verbatim; no hotlines, no diagnosis. */
  requiredWording: string;
  householdExamplesAllowed: boolean;
  prescriptiveAnswerPointsProhibited: boolean;
}

// ------------------------------------------------------------ renderer

export interface RendererConstraints {
  /** Citation labels that MUST appear in any rendering. */
  requiredCitationLabels: string[];
  mandatoryQualificationTexts: string[];
  prohibitedAssertionCodes: string[];
  /** Global: may ANY point be phrased prescriptively? */
  prescriptiveAllowedAnywhere: boolean;
  mustDiscloseConflict: boolean;
  mustStateMissingAuthority: boolean;
}

// ------------------------------------------------------------ validation

export interface ValidationIssue {
  code: string;
  message: string;
  pointId?: string;
  citationId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// ------------------------------------------------------------ the plan

export interface AnswerPlan {
  planId: string;
  policyVersion: string;
  request: AnswerRequest;
  /** The normalized query the packet reported (echoed, not re-derived). */
  normalizedQuery: NormalizedQuery;
  /** Deterministic fingerprint of the source packet (timestamp-free). */
  packetFingerprint: string;
  createdAt: string;
  disposition: Disposition;
  coverage: EvidencePacket["coverage"];
  permittedAnswerPoints: AnswerPoint[];
  livedExperienceExamples: AnswerPoint[];
  authoritativePoints: AnswerPoint[];
  qualifications: Qualification[];
  limitations: string[];
  conflicts: string[];
  missingEvidence: string[];
  requiredWarnings: string[];
  escalation: EscalationDirective;
  supportLedger: SupportLedgerEntry[];
  citationMap: CitationMap;
  prohibitedAssertions: ProhibitedAssertion[];
  rendererConstraints: RendererConstraints;
  /** Deterministic fingerprint of the plan content (timestamp-free). */
  planFingerprint: string;
  citationMapFingerprint: string;
  validation: ValidationResult;
}

export const POLICY_VERSION = "answer-plan/2026-07";
