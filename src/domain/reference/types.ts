/**
 * Curated Reference Registry — domain types (Phase 5).
 *
 * How legitimate reference material can enter the household-knowledge corpus:
 * a stable identity (Publisher → Source) separated from immutable snapshots
 * (Version), exact source-backed EvidenceSpans, editorially-authored
 * CuratedClaims linked to that evidence, and SCOPED AuthorityAssessments.
 *
 * Core epistemic rule encoded structurally: "published by an authoritative
 * organization" grants NO universal authority. Authority is always scoped by
 * domain, jurisdiction, audience, date, version, and risk category, and is
 * gated by editorial review. There is no universal authority score and no
 * truth score anywhere in this model.
 *
 * No framework imports belong in this module.
 */
import type { GuidanceRisk } from "../knowledge/query";

// ------------------------------------------------------------- publisher

/**
 * Organization type is descriptive metadata. It NEVER by itself grants
 * authority — an AuthorityAssessment scoped to a Source/Version does.
 */
export type OrganizationType =
  | "government-agency"
  | "professional-association"
  | "standards-organization"
  | "academic-institution"
  | "peer-reviewed-publication"
  | "licensed-professional-source"
  | "nonprofit-organization"
  | "commercial-publication"
  | "community-source"
  | "platform-internal";

export interface ReferencePublisher {
  id: string;
  name: string;
  organizationType: OrganizationType;
  canonicalWebsite?: string;
  locale: string;
  jurisdiction?: string;
  notes?: string;
}

// --------------------------------------------------------------- source

export type SourceCategory =
  | "guideline"
  | "standard"
  | "clinical-reference"
  | "regulation"
  | "research-article"
  | "fact-sheet"
  | "textbook"
  | "platform-documentation";

/** A source's lifecycle across its versions. */
export type SourceStatus = "active" | "superseded" | "withdrawn";

/** The continuing work/publication identity — NOT a single snapshot. */
export interface ReferenceSource {
  id: string;
  title: string;
  publisherId: string;
  canonicalUrl?: string;
  category: SourceCategory;
  subjectDomains: string[];
  intendedAudience: string;
  locale: string;
  jurisdictions: string[];
  usageNotes?: string;
  status: SourceStatus;
}

// -------------------------------------------------------------- version

export type VersionStatus = "active" | "superseded" | "withdrawn";

/** An IMMUTABLE snapshot of a source. Never overwritten when the source changes. */
export interface ReferenceVersion {
  id: string;
  sourceId: string;
  /** Monotonic ordinal within a source (1, 2, …) — deterministic ID input. */
  ordinal: number;
  versionLabel: string;
  publicationDate?: string; // ISO
  effectiveDate?: string; // ISO
  enteredDate: string; // ISO — when curated into the platform
  reviewDueDate?: string; // ISO
  /** Hash of `sourceText` — proves the snapshot's bytes (see hash.ts). */
  contentHash: string;
  status: VersionStatus;
  supersedesVersionId?: string;
  supersededByVersionId?: string;
  /** Exact source text or curated excerpts — never a whole-document summary. */
  sourceText: string;
  changeNotes?: string;
}

// ---------------------------------------------------------- evidence span

/**
 * Where in the source the exact text lives. The smallest useful set of forms;
 * exact text and locator ALWAYS travel together.
 */
export interface CitationLocator {
  page?: string; // "12" or "12-14"
  sectionHeading?: string;
  paragraphIndex?: number;
  lineRange?: string; // "5-9"
  urlFragment?: string; // "#recommendations"
  tableOrFigure?: string; // "Table 3"
}

/** An IMMUTABLE, source-backed excerpt. Never silently changed after a claim cites it. */
export interface EvidenceSpan {
  id: string;
  referenceVersionId: string;
  exactText: string;
  textHash: string;
  sectionPath?: string;
  locator: CitationLocator;
  locale: string;
  editorialNotes?: string;
  createdAt: string; // ISO
}

// --------------------------------------------------------------- claims

export type ClaimType =
  | "descriptive"
  | "procedural"
  | "developmental"
  | "safety"
  | "contraindication"
  | "recommendation"
  | "definition"
  | "limitation";

/** How far the claim's wording moves from the cited evidence. */
export type InterpretationLevel =
  | "direct-statement"
  | "faithful-paraphrase"
  | "editorial-inference";

/** Review lifecycle. */
export type ClaimStatus =
  | "draft"
  | "evidence-linked"
  | "in-review"
  | "approved"
  | "needs-revision"
  | "superseded"
  | "withdrawn";

/** How broadly the claim declares itself to apply across jurisdictions. */
export type ApplicabilityScope = "scoped" | "broad";

/**
 * An editorially reviewable proposition connected to exact evidence.
 * A claim is NOT the source text; its wording never replaces the evidence.
 */
export interface CuratedClaim {
  id: string;
  statement: string;
  claimType: ClaimType;
  interpretationLevel: InterpretationLevel;
  locale: string;
  riskCategories: GuidanceRisk[];
  subjectDomains: string[];
  intendedAudience: string;
  developmentalApplicability?: string;
  householdCircumstances: string[];
  constraints: string[];
  jurisdiction?: string;
  /** Whether the claim declares scoped or explicitly broader applicability. */
  applicabilityScope: ApplicabilityScope;
  applicability: string;
  exclusions: string[];
  limitations: string;
  effectiveDate?: string; // ISO
  reviewDueDate?: string; // ISO
  status: ClaimStatus;
  version: number;
  /** The reference version this claim currently depends on (staleness anchor). */
  dependsOnVersionId: string;
  editorHandle: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  /** Which review checklist items were affirmed at last approval (audit). */
  reviewChecklist?: ReviewChecklistState;
}

// ------------------------------------------------- claim ↔ evidence links

export type EvidenceRelation =
  | "supports"
  | "qualifies"
  | "contradicts"
  | "background"
  | "defines"
  | "limits";

export interface ClaimEvidenceLink {
  id: string;
  claimId: string;
  evidenceSpanId: string;
  relation: EvidenceRelation;
  reviewerNote?: string;
  createdAt: string; // ISO
}

// ------------------------------------------------ claim ↔ claim relations

export type ClaimRelation =
  | "supports"
  | "qualifies"
  | "conflicts-with"
  | "alternative-to"
  | "supersedes"
  | "superseded-by";

export interface ClaimRelationship {
  id: string;
  fromClaimId: string;
  toClaimId: string;
  relation: ClaimRelation;
  /** Unresolved conflicts stay visible and qualify coverage. */
  resolved: boolean;
  note?: string;
  createdAt: string; // ISO
}

// -------------------------------------------------- authority assessment

export type AssessmentStatus =
  | "unassessed"
  | "approved-for-scope"
  | "needs-review"
  | "rejected-for-authoritative-use"
  | "expired";

/**
 * Scoped authority — connected to a Source (and optionally a specific
 * Version). NEVER implies authority outside its recorded scope.
 */
export interface AuthorityAssessment {
  id: string;
  sourceId: string;
  /** When present, the assessment is pinned to one immutable version. */
  referenceVersionId?: string;
  status: AssessmentStatus;
  recognizedDomains: string[];
  recognizedJurisdictions: string[]; // may include "global"
  supportedRiskCategories: GuidanceRisk[];
  intendedAudience: string;
  effectiveScope: string;
  limitations: string;
  assessorHandle: string;
  assessmentDate: string; // ISO
  reviewDueDate?: string; // ISO — past this date the assessment is expired
  notes?: string;
}

// ---------------------------------------------------- review checklist

/** The manual review checklist item keys (approval gate). */
export type ReviewCheckKey =
  | "supporting-evidence-attached"
  | "citation-locator-complete"
  | "wording-matches-evidence"
  | "not-broader-than-evidence"
  | "source-scope-covers-domain"
  | "jurisdiction-preserved"
  | "audience-preserved"
  | "source-limitations-preserved"
  | "version-currency-reviewed"
  | "licensing-recorded"
  | "conflicts-considered";

export type ReviewChecklistState = Partial<Record<ReviewCheckKey, boolean>>;

// --------------------------------------------------------- registry root

/**
 * The whole editorial registry as plain arrays — the shape persisted locally
 * and passed to pure selectors/projection. Device-local in this phase behind
 * a repository interface (see src/data/reference-repo.ts).
 */
export interface ReferenceRegistry {
  publishers: ReferencePublisher[];
  sources: ReferenceSource[];
  versions: ReferenceVersion[];
  spans: EvidenceSpan[];
  claims: CuratedClaim[];
  evidenceLinks: ClaimEvidenceLink[];
  claimRelationships: ClaimRelationship[];
  assessments: AuthorityAssessment[];
  /** Honest label carried with the data — never presented as globally published. */
  origin: "production-seed" | "test-fixture" | "local-device";
}

export function emptyRegistry(
  origin: ReferenceRegistry["origin"] = "local-device",
): ReferenceRegistry {
  return {
    publishers: [],
    sources: [],
    versions: [],
    spans: [],
    claims: [],
    evidenceLinks: [],
    claimRelationships: [],
    assessments: [],
    origin,
  };
}
