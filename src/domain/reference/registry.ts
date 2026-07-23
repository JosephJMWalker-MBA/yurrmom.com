/**
 * Registry selectors + deterministic ID/constructor helpers (Phase 5).
 *
 * Pure, read-only queries over a ReferenceRegistry, plus small factory
 * helpers that compute deterministic IDs and content hashes. Nothing here
 * mutates a version or evidence span after creation.
 */
import { contentHash } from "./hash";
import type {
  AuthorityAssessment,
  CitationLocator,
  ClaimEvidenceLink,
  CuratedClaim,
  EvidenceSpan,
  ReferenceRegistry,
  ReferenceSource,
  ReferenceVersion,
} from "./types";

// ------------------------------------------------------------- selectors

export function versionsForSource(
  reg: ReferenceRegistry,
  sourceId: string,
): ReferenceVersion[] {
  return reg.versions
    .filter((v) => v.sourceId === sourceId)
    .sort((a, b) => a.ordinal - b.ordinal);
}

export function activeVersionForSource(
  reg: ReferenceRegistry,
  sourceId: string,
): ReferenceVersion | undefined {
  return versionsForSource(reg, sourceId).find((v) => v.status === "active");
}

export function spansForVersion(
  reg: ReferenceRegistry,
  versionId: string,
): EvidenceSpan[] {
  return reg.spans.filter((s) => s.referenceVersionId === versionId);
}

export function linksForClaim(
  reg: ReferenceRegistry,
  claimId: string,
): ClaimEvidenceLink[] {
  return reg.evidenceLinks.filter((l) => l.claimId === claimId);
}

export function hasSupportingEvidence(
  claimId: string,
  links: ClaimEvidenceLink[],
): boolean {
  return links.some(
    (l) =>
      l.claimId === claimId &&
      (l.relation === "supports" || l.relation === "defines"),
  );
}

export function citationIsComplete(span: EvidenceSpan): boolean {
  const l = span.locator;
  const hasLocator = Boolean(
    l.page || l.sectionHeading || l.paragraphIndex !== undefined || l.lineRange || l.urlFragment || l.tableOrFigure,
  );
  return span.exactText.trim().length > 0 && hasLocator;
}

export function assessmentForSource(
  reg: ReferenceRegistry,
  sourceId: string,
  versionId?: string,
): AuthorityAssessment | undefined {
  const candidates = reg.assessments.filter((a) => a.sourceId === sourceId);
  // Prefer a version-pinned assessment when a version is supplied.
  if (versionId) {
    const pinned = candidates.find((a) => a.referenceVersionId === versionId);
    if (pinned) return pinned;
  }
  return candidates.find((a) => !a.referenceVersionId) ?? candidates[0];
}

export function sourceOf(
  reg: ReferenceRegistry,
  sourceId: string,
): ReferenceSource | undefined {
  return reg.sources.find((s) => s.id === sourceId);
}

/** Unresolved claim↔claim conflicts touching a claim (either direction). */
export function unresolvedConflicts(reg: ReferenceRegistry, claimId: string) {
  return reg.claimRelationships.filter(
    (r) =>
      !r.resolved &&
      (r.relation === "conflicts-with") &&
      (r.fromClaimId === claimId || r.toClaimId === claimId),
  );
}

// ------------------------------------------------------ deterministic ids

export function slugId(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function publisherId(name: string): string {
  return `pub:${slugId(name)}`;
}

export function sourceId(publisherIdValue: string, title: string): string {
  return `src:${publisherIdValue.replace(/^pub:/, "")}:${slugId(title)}`;
}

export function versionId(sourceIdValue: string, ordinal: number): string {
  return `${sourceIdValue}@v${ordinal}`;
}

export function spanId(versionIdValue: string, exactText: string): string {
  return `${versionIdValue}#span:${contentHash(exactText)}`;
}

export function claimId(editorHandle: string, statement: string): string {
  return `claim:${slugId(editorHandle)}:${contentHash(statement)}`;
}

export function evidenceLinkId(
  claimIdValue: string,
  spanIdValue: string,
  relation: string,
): string {
  return `lnk:${contentHash(`${claimIdValue}|${spanIdValue}|${relation}`)}`;
}

// ---------------------------------------------------------- constructors

export function makeSpan(args: {
  referenceVersionId: string;
  exactText: string;
  locator: CitationLocator;
  locale: string;
  sectionPath?: string;
  editorialNotes?: string;
  createdAt: string;
}): EvidenceSpan {
  return {
    id: spanId(args.referenceVersionId, args.exactText),
    referenceVersionId: args.referenceVersionId,
    exactText: args.exactText,
    textHash: contentHash(args.exactText),
    sectionPath: args.sectionPath,
    locator: args.locator,
    locale: args.locale,
    editorialNotes: args.editorialNotes,
    createdAt: args.createdAt,
  };
}

export function makeEvidenceLink(args: {
  claimId: string;
  evidenceSpanId: string;
  relation: ClaimEvidenceLink["relation"];
  reviewerNote?: string;
  createdAt: string;
}): ClaimEvidenceLink {
  return {
    id: evidenceLinkId(args.claimId, args.evidenceSpanId, args.relation),
    claimId: args.claimId,
    evidenceSpanId: args.evidenceSpanId,
    relation: args.relation,
    reviewerNote: args.reviewerNote,
    createdAt: args.createdAt,
  };
}

/** Evidence excerpts a claim cites (supports/defines/qualifies/limits) with locators. */
export function claimCitations(reg: ReferenceRegistry, claim: CuratedClaim) {
  return linksForClaim(reg, claim.id)
    .map((link) => {
      const span = reg.spans.find((s) => s.id === link.evidenceSpanId);
      return span ? { link, span } : undefined;
    })
    .filter((x): x is { link: ClaimEvidenceLink; span: EvidenceSpan } => Boolean(x));
}
