/**
 * Immutable versioning + staleness (Phase 5).
 *
 * Adding a new ReferenceVersion NEVER overwrites the old one. It:
 *  - preserves the previous version and its evidence spans (immutable),
 *  - links supersedes / superseded-by,
 *  - marks the old version `superseded`,
 *  - flags every claim that depended on the old version as `needs-revision`,
 *  - and does NOT transfer approval or rewrite any claim.
 *
 * These are pure transforms returning NEW registry arrays; callers persist the
 * result. No approval is ever moved to a newer version automatically.
 */
import { contentHash } from "./hash";
import { versionId, versionsForSource } from "./registry";
import type {
  CuratedClaim,
  ReferenceRegistry,
  ReferenceVersion,
} from "./types";

export interface AddVersionInput {
  sourceId: string;
  versionLabel: string;
  sourceText: string;
  enteredDate: string; // ISO
  publicationDate?: string;
  effectiveDate?: string;
  reviewDueDate?: string;
  changeNotes?: string;
}

export interface AddVersionResult {
  registry: ReferenceRegistry;
  newVersion: ReferenceVersion;
  /** Claim IDs that were flagged needs-revision because their source moved on. */
  staledClaimIds: string[];
}

/**
 * Produce a new registry with an added immutable version. Old versions and
 * spans are carried through untouched.
 */
export function addVersion(
  reg: ReferenceRegistry,
  input: AddVersionInput,
): AddVersionResult {
  const existing = versionsForSource(reg, input.sourceId);
  const prev = existing.find((v) => v.status === "active") ?? existing[existing.length - 1];
  const ordinal = (existing[existing.length - 1]?.ordinal ?? 0) + 1;
  const id = versionId(input.sourceId, ordinal);

  const newVersion: ReferenceVersion = {
    id,
    sourceId: input.sourceId,
    ordinal,
    versionLabel: input.versionLabel,
    publicationDate: input.publicationDate,
    effectiveDate: input.effectiveDate,
    enteredDate: input.enteredDate,
    reviewDueDate: input.reviewDueDate,
    contentHash: contentHash(input.sourceText),
    status: "active",
    supersedesVersionId: prev?.id,
    sourceText: input.sourceText,
    changeNotes: input.changeNotes,
  };

  // Old version becomes superseded but is otherwise preserved verbatim.
  const versions = reg.versions.map((v) => {
    if (prev && v.id === prev.id) {
      return { ...v, status: "superseded" as const, supersededByVersionId: id };
    }
    return v;
  });
  versions.push(newVersion);

  // Claims that depended on the superseded version are flagged for re-review.
  const staledClaimIds: string[] = [];
  const claims: CuratedClaim[] = reg.claims.map((c) => {
    if (prev && c.dependsOnVersionId === prev.id && c.status !== "withdrawn" && c.status !== "superseded") {
      staledClaimIds.push(c.id);
      // Do NOT rewrite the claim or move approval — only flag it.
      return { ...c, status: "needs-revision" as const, updatedAt: input.enteredDate };
    }
    return c;
  });

  return {
    registry: { ...reg, versions, claims },
    newVersion,
    staledClaimIds,
  };
}
