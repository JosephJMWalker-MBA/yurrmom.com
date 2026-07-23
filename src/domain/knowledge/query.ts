/**
 * Query & evidence-packet model (Phase 4).
 *
 * A KnowledgeQuery carries ONLY the context explicitly supplied by the caller.
 * Nothing here infers a family profile, a child profile, or a risk category —
 * the guidance-risk category is supplied, never guessed.
 *
 * An EvidencePacket is EVIDENCE, not an answer: ranked source-backed hits with
 * provenance, warnings, and an honest coverage verdict. It contains no
 * synthesized advice or conversational prose.
 */
import type { SourceType } from "../types";
import type { RepresentationChoice } from "../translation";
import type { RepresentationPolicy } from "./representation";
import type { KnowledgeUnit } from "./unit";

/**
 * Supplied by the caller — never inferred. Determines how strict the evidence
 * standard is for the returned packet.
 */
export type GuidanceRisk =
  | "ordinary-household"
  | "medical"
  | "developmental"
  | "mental-health"
  | "legal"
  | "safety-critical";

export const HIGH_STAKES_RISKS: GuidanceRisk[] = [
  "medical",
  "developmental",
  "mental-health",
  "legal",
  "safety-critical",
];

export interface KnowledgeQuery {
  text: string;
  requestedLocale: string;
  /** Optional explicitly-supplied context. Absent means "not provided". */
  householdCircumstances?: string[];
  developmentalStage?: string;
  householdDomain?: string;
  constraints?: string[];
  taskOrSkill?: string;
  /** Optional jurisdiction context for authoritative eligibility (Phase 5). */
  jurisdiction?: string;
  /** Hard filter: only units whose provenance source type is in this set. */
  sourceTypeFilters?: SourceType[];
  systemScope?: string;
  creatorScope?: string;
  representationPolicy: RepresentationPolicy;
  guidanceRisk: GuidanceRisk;
}

/** The query as retrieval actually interpreted it — echoed back for transparency. */
export interface NormalizedQuery {
  text: string;
  tokens: string[];
  requestedLocale: string;
  householdCircumstances: string[];
  developmentalStage?: string;
  householdDomain?: string;
  constraints: string[];
  taskOrSkill?: string;
  jurisdiction?: string;
  sourceTypeFilters: SourceType[];
  systemScope?: string;
  creatorScope?: string;
}

/** Per-hit authoritative-eligibility outcome (Phase 5; curated-claim units). */
export interface HitEligibility {
  eligible: boolean;
  reasons: string[];
  sourceScope: string;
  queryScope: string;
}

export interface EvidenceHit {
  rank: number;
  score: number;
  unit: KnowledgeUnit;
  /** Human-readable, ordered reasons this unit matched. */
  reasons: string[];
  /** Representation served for the requested locale (with provenance). */
  representation: RepresentationChoice;
  /** Locale/translation status sentence for this hit. */
  localeStatus: string;
  /** Hit-level warnings, e.g. "lived experience, not authoritative guidance". */
  warnings: string[];
  /** Present only for curated-claim units under a high-stakes query. */
  authoritativeEligibility?: HitEligibility;
}

export type CoverageStatus =
  | "sufficient-for-household-exploration"
  | "partial"
  | "insufficient"
  | "authoritative-support-required";

export interface LocaleSummary {
  requestedLocale: string;
  /** How the top hits were served, e.g. "original (en)". */
  servedPrimarilyAs: string;
  approvedTranslationAvailable: boolean;
  /** A draft/stale translation exists but was withheld (public-safe). */
  unapprovedOrStalePresent: boolean;
  notes: string[];
}

export interface EvidencePacket {
  query: NormalizedQuery;
  mode: RepresentationPolicy;
  requestedLocale: string;
  guidanceRisk: GuidanceRisk;
  hits: EvidenceHit[];
  /** Count of hits by canonical source type. */
  sourceTypeSummary: Partial<Record<SourceType, number>>;
  localeSummary: LocaleSummary;
  coverage: CoverageStatus;
  warnings: string[];
  /** Aggregated creator-stated limitations from the returned hits. */
  limitations: string[];
  insufficientSupportReason?: string;
  /** High-stakes authoritative-support accounting (Phase 5). */
  authoritativeSummary?: AuthoritativeSummary;
}

export interface AuthoritativeSummary {
  /** True when the query's risk category demands authoritative support. */
  required: boolean;
  /** True when at least one eligible authoritative claim was retrieved. */
  present: boolean;
  eligibleClaimCount: number;
  /** Curated-claim units that matched but were NOT eligible, and why. */
  ineligibleReasons: string[];
  /** Unresolved conflicts among matched claims. */
  conflictWarnings: string[];
}
