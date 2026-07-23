/**
 * TEST-ONLY synthetic authoritative fixtures (Phase 5).
 *
 * These use OBVIOUSLY FICTIONAL publisher/source names ("Fictional ...") and
 * exist SOLELY to exercise the eligibility mechanics. They live under tests/
 * and are imported by no file in src/ — so they structurally cannot leak into
 * production corpus construction. Never render these in production UI.
 *
 * Every registry here is tagged origin: "test-fixture".
 */
import { contentHash } from "../../src/domain/reference/hash.ts";
import type {
  AuthorityAssessment,
  CuratedClaim,
  EvidenceSpan,
  ReferenceRegistry,
  ReferenceVersion,
} from "../../src/domain/reference/types.ts";

// A stable "now" for deterministic currency checks in tests.
export const TEST_NOW = new Date("2026-07-23T00:00:00.000Z");

const EVIDENCE_TEXT =
  "Children around four years old can participate in simple, supervised household tasks such as putting away toys and carrying unbreakable dishes to the counter.";

const VERSION_ID = "src:fictional-council:child-tasks@v1";
const SPAN_ID = `${VERSION_ID}#span:${contentHash(EVIDENCE_TEXT)}`;

function span(): EvidenceSpan {
  return {
    id: SPAN_ID,
    referenceVersionId: VERSION_ID,
    exactText: EVIDENCE_TEXT,
    textHash: contentHash(EVIDENCE_TEXT),
    sectionPath: "Age-appropriate participation",
    locator: { page: "14", sectionHeading: "Age-appropriate participation", paragraphIndex: 2 },
    locale: "en",
    createdAt: "2026-02-01T00:00:00.000Z",
  };
}

/** A fully valid, approved, in-scope, current authoritative claim (case 1). */
export function makeApprovedRegistry(over?: {
  assessmentStatus?: AuthorityAssessment["status"];
  assessmentReviewDue?: string;
  claimStatus?: CuratedClaim["status"];
  claimReviewDue?: string;
  sourceStatus?: "active" | "superseded" | "withdrawn";
  versionStatus?: "active" | "superseded" | "withdrawn";
  recognizedDomains?: string[];
  recognizedJurisdictions?: string[];
  supportedRisks?: CuratedClaim["riskCategories"];
  interpretationLevel?: CuratedClaim["interpretationLevel"];
  omitEvidence?: boolean;
  applicabilityScope?: CuratedClaim["applicabilityScope"];
}): ReferenceRegistry {
  const claim: CuratedClaim = {
    id: "claim:fictional-editor:child-tasks",
    statement:
      "Around age four, children can help with simple supervised chores like putting away toys and carrying unbreakable dishes.",
    claimType: "developmental",
    interpretationLevel: over?.interpretationLevel ?? "faithful-paraphrase",
    locale: "en",
    riskCategories: over?.supportedRisks ?? ["developmental"],
    subjectDomains: ["child development", "household chores"],
    intendedAudience: "Parents and caregivers",
    developmentalApplicability: "four-year-old",
    householdCircumstances: ["young children"],
    constraints: [],
    jurisdiction: "US",
    applicabilityScope: over?.applicabilityScope ?? "scoped",
    applicability: "US families with preschool-age children.",
    exclusions: ["Not a substitute for a pediatrician's individualized advice."],
    limitations: "General developmental guidance; individual children vary.",
    effectiveDate: "2026-01-01",
    reviewDueDate: over?.claimReviewDue ?? "2027-01-01",
    status: over?.claimStatus ?? "approved",
    version: 1,
    dependsOnVersionId: VERSION_ID,
    editorHandle: "editorial-desk",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  };

  const assessment: AuthorityAssessment = {
    id: "assess:fictional-council:child-tasks",
    sourceId: "src:fictional-council:child-tasks",
    status: over?.assessmentStatus ?? "approved-for-scope",
    recognizedDomains: over?.recognizedDomains ?? ["child development", "household chores"],
    recognizedJurisdictions: over?.recognizedJurisdictions ?? ["US"],
    supportedRiskCategories: ["developmental"],
    intendedAudience: "Parents and caregivers",
    effectiveScope: "US child-development guidance, 2026 edition.",
    limitations: "Not medical diagnosis; not legal advice; US only.",
    assessorHandle: "editorial-desk",
    assessmentDate: "2026-02-05T00:00:00.000Z",
    reviewDueDate: over?.assessmentReviewDue ?? "2027-02-05",
    notes: "Scoped assessment — authoritative for child-development guidance in the US only.",
  };

  const version: ReferenceVersion = {
    id: VERSION_ID,
    sourceId: "src:fictional-council:child-tasks",
    ordinal: 1,
    versionLabel: "2026 edition",
    publicationDate: "2026-01-01",
    effectiveDate: "2026-01-01",
    enteredDate: "2026-02-01T00:00:00.000Z",
    reviewDueDate: "2027-01-01",
    contentHash: contentHash(EVIDENCE_TEXT),
    status: over?.versionStatus ?? "active",
    sourceText: EVIDENCE_TEXT,
  };

  return {
    origin: "test-fixture",
    publishers: [
      {
        id: "pub:fictional-pediatric-council",
        name: "Fictional Pediatric Council (TEST ONLY)",
        organizationType: "professional-association",
        locale: "en",
        jurisdiction: "US",
        notes: "Synthetic test publisher — not a real organization.",
      },
    ],
    sources: [
      {
        id: "src:fictional-council:child-tasks",
        title: "Fictional Guidance on Age-Appropriate Household Tasks",
        publisherId: "pub:fictional-pediatric-council",
        category: "guideline",
        subjectDomains: ["child development", "household chores"],
        intendedAudience: "Parents and caregivers",
        locale: "en",
        jurisdictions: ["US"],
        usageNotes: "Synthetic fixture; freely usable in tests.",
        status: over?.sourceStatus ?? "active",
      },
    ],
    versions: [version],
    spans: over?.omitEvidence ? [] : [span()],
    claims: [claim],
    evidenceLinks: over?.omitEvidence
      ? []
      : [
          {
            id: "lnk:child-tasks",
            claimId: claim.id,
            evidenceSpanId: SPAN_ID,
            relation: "supports",
            reviewerNote: "Directly supports the claim's scope.",
            createdAt: "2026-02-01T00:00:00.000Z",
          },
        ],
    claimRelationships: [],
    assessments: [assessment],
  };
}

/** A registry where a second claim conflicts with the first, unresolved (case 11). */
export function makeConflictRegistry(): ReferenceRegistry {
  const reg = makeApprovedRegistry();
  const otherClaim: CuratedClaim = {
    ...reg.claims[0],
    id: "claim:fictional-editor:child-tasks-dissent",
    statement:
      "Some fictional guidance holds that four-year-olds should not carry dishes at all.",
    interpretationLevel: "faithful-paraphrase",
    updatedAt: "2026-02-02T00:00:00.000Z",
  };
  return {
    ...reg,
    claims: [...reg.claims, otherClaim],
    evidenceLinks: [
      ...reg.evidenceLinks,
      {
        id: "lnk:child-tasks-dissent",
        claimId: otherClaim.id,
        evidenceSpanId: SPAN_ID,
        relation: "supports",
        reviewerNote: "Supports the dissenting claim.",
        createdAt: "2026-02-02T00:00:00.000Z",
      },
    ],
    claimRelationships: [
      {
        id: "rel:child-tasks-conflict",
        fromClaimId: reg.claims[0].id,
        toClaimId: otherClaim.id,
        relation: "conflicts-with",
        resolved: false,
        note: "Unresolved disagreement about dish-carrying at age four.",
        createdAt: "2026-02-02T00:00:00.000Z",
      },
    ],
  };
}

export const CHILD_TASKS_VERSION_ID = VERSION_ID;
export const CHILD_TASKS_SPAN_ID = SPAN_ID;
export const CHILD_TASKS_EVIDENCE_TEXT = EVIDENCE_TEXT;
