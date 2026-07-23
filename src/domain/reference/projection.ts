/**
 * Reference → KnowledgeUnit projection (Phase 5).
 *
 * Turns an approved (or, for editorial inspection, non-withdrawn) CuratedClaim
 * into a `curated-claim` KnowledgeUnit that the Phase 4 retriever can rank and
 * cite. Read-only over the registry. The unit carries a self-contained
 * payload (claim + exact evidence excerpts + locators + scoped authority
 * assessment + version status + conflicts) so eligibility can be judged and
 * citations shown without re-reading the registry.
 *
 * Withdrawn claims are NOT projected. Editorial inference is preserved as its
 * interpretation level — never relabeled as a direct source statement.
 */
import type { Facet } from "../types";
import { DEFAULT_LOCALE } from "../i18n";
import { normalizeText, tokenize } from "../knowledge/text";
import type {
  ClaimEvidenceCitation,
  CuratedClaimUnitPayload,
  KnowledgeUnit,
} from "../knowledge/unit";
import {
  assessmentForSource,
  citationIsComplete,
  claimCitations,
  sourceOf,
} from "./registry";
import type { CuratedClaim, ReferenceRegistry } from "./types";

function claimUnitId(sourceIdValue: string, ordinal: number, claimId: string): string {
  const bare = sourceIdValue.replace(/^src:/, "");
  const claimBare = claimId.replace(/^claim:/, "");
  return `ku:ref:${bare}:v${ordinal}:claim:${claimBare}`;
}

export function buildClaimPayload(
  reg: ReferenceRegistry,
  claim: CuratedClaim,
): CuratedClaimUnitPayload | undefined {
  const version = reg.versions.find((v) => v.id === claim.dependsOnVersionId);
  if (!version) return undefined;
  const source = sourceOf(reg, version.sourceId);
  if (!source) return undefined;
  const publisher = reg.publishers.find((p) => p.id === source.publisherId);
  const assessment = assessmentForSource(reg, source.id, version.id);

  const citations: ClaimEvidenceCitation[] = claimCitations(reg, claim).map(
    ({ link, span }) => ({
      spanId: span.id,
      relation: link.relation,
      exactText: span.exactText,
      sectionPath: span.sectionPath,
      locator: span.locator,
      citationComplete: citationIsComplete(span),
    }),
  );

  const conflicts = reg.claimRelationships
    .filter(
      (r) =>
        (r.fromClaimId === claim.id || r.toClaimId === claim.id) &&
        (r.relation === "conflicts-with" ||
          r.relation === "alternative-to" ||
          r.relation === "superseded-by"),
    )
    .map((r) => ({
      relation: r.relation,
      otherClaimId: r.fromClaimId === claim.id ? r.toClaimId : r.fromClaimId,
      resolved: r.resolved,
      note: r.note,
    }));

  return {
    claimId: claim.id,
    claimVersion: claim.version,
    statement: claim.statement,
    claimType: claim.claimType,
    interpretationLevel: claim.interpretationLevel,
    claimStatus: claim.status,
    riskCategories: claim.riskCategories,
    subjectDomains: claim.subjectDomains,
    intendedAudience: claim.intendedAudience,
    developmentalApplicability: claim.developmentalApplicability,
    jurisdiction: claim.jurisdiction,
    applicabilityScope: claim.applicabilityScope,
    applicability: claim.applicability,
    exclusions: claim.exclusions,
    limitations: claim.limitations,
    effectiveDate: claim.effectiveDate,
    reviewDueDate: claim.reviewDueDate,
    licensingNote: source.usageNotes,
    editorHandle: claim.editorHandle,
    evidenceCitations: citations,
    sourceVersion: {
      id: version.id,
      label: version.versionLabel,
      ordinal: version.ordinal,
      status: version.status,
      publisherName: publisher?.name ?? "Unknown publisher",
      organizationType: publisher?.organizationType ?? "community-source",
      sourceTitle: source.title,
      sourceStatus: source.status,
      publicationDate: version.publicationDate,
    },
    assessment: {
      status: assessment?.status ?? "unassessed",
      recognizedDomains: assessment?.recognizedDomains ?? [],
      recognizedJurisdictions: assessment?.recognizedJurisdictions ?? [],
      supportedRiskCategories: assessment?.supportedRiskCategories ?? [],
      intendedAudience: assessment?.intendedAudience ?? source.intendedAudience,
      effectiveScope: assessment?.effectiveScope ?? "",
      limitations: assessment?.limitations ?? "",
      reviewDueDate: assessment?.reviewDueDate,
    },
    conflicts,
  };
}

export function projectClaim(
  reg: ReferenceRegistry,
  claim: CuratedClaim,
): KnowledgeUnit | undefined {
  if (claim.status === "withdrawn") return undefined;
  const payload = buildClaimPayload(reg, claim);
  if (!payload) return undefined;

  const locale = { ...DEFAULT_LOCALE, sourceLocale: claim.locale };
  const facets: Facet[] = [
    ...claim.subjectDomains.map((d): Facet => ({ key: "household-domain", value: d })),
    ...claim.riskCategories.map((r): Facet => ({ key: "purpose", value: r })),
    ...claim.householdCircumstances.map((c): Facet => ({ key: "household-circumstance", value: c })),
    ...claim.constraints.map((c): Facet => ({ key: "constraint", value: c })),
    { key: "evidence-type", value: "sourced-reference" },
  ];
  if (claim.developmentalApplicability) {
    facets.push({ key: "developmental-stage", value: claim.developmentalApplicability });
  }

  const indexExtra = [
    claim.subjectDomains.join(" "),
    claim.applicability,
    claim.developmentalApplicability ?? "",
    payload.sourceVersion.sourceTitle,
    payload.sourceVersion.publisherName,
    payload.evidenceCitations.map((c) => c.exactText).join(" "),
  ].join(" ");
  const indexText = normalizeText([claim.statement, indexExtra].join(" "));

  const id = claimUnitId(
    payload.sourceVersion.id.replace(/@v\d+$/, ""),
    payload.sourceVersion.ordinal,
    claim.id,
  );

  return {
    id,
    kind: "curated-claim",
    sourceObjectType: "curated-claim",
    sourceObjectId: claim.id,
    ownerSystemSlug: `reference:${payload.sourceVersion.sourceTitle}`,
    ownerSystemTitle: payload.sourceVersion.sourceTitle,
    sourceVersion: claim.version,
    creatorHandle: claim.editorHandle,
    originalAuthorHandle: payload.sourceVersion.publisherName,
    displayText: claim.statement,
    sourceLocale: locale,
    effectiveLocale: locale,
    provenanceSourceType: "sourced-reference",
    livedExperience: false,
    derivation: "original",
    reviewStatus: claim.status === "approved" ? "creator-reviewed" : "needs-review",
    facets,
    applicability: claim.applicability,
    limitations: claim.limitations,
    claim: payload,
    // Curated claims are editorial, not public creator content: Studio-only link.
    studioHref: `/studio/references#claim:${encodeURIComponent(claim.id)}`,
    indexTokens: tokenize(indexText),
    indexText,
  };
}

/** Project all projectable (non-withdrawn) claims in a registry. */
export function projectRegistryClaims(reg: ReferenceRegistry): KnowledgeUnit[] {
  return reg.claims
    .map((c) => projectClaim(reg, c))
    .filter((u): u is KnowledgeUnit => Boolean(u))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
