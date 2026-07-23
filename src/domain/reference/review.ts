/**
 * Claim review workflow (Phase 5) — the editorial approval gate.
 *
 * "Approved" means approved for platform use WITHIN the recorded scope. It
 * does not mean mathematically proven or universally true. Approval is manual:
 * an editor must affirm every checklist item, and structural guards block
 * approval when evidence is missing, citations are incomplete, or the claim is
 * broader than its evidence.
 */
import type {
  ClaimEvidenceLink,
  ClaimStatus,
  CuratedClaim,
  EvidenceSpan,
  ReviewCheckKey,
  ReviewChecklistState,
} from "./types";
import { citationIsComplete, hasSupportingEvidence } from "./registry";

export interface ReviewCheckDef {
  key: ReviewCheckKey;
  label: string;
  /** Some checks are structurally verifiable; others are editorial judgement. */
  autoVerifiable: boolean;
}

export const REVIEW_CHECKLIST: ReviewCheckDef[] = [
  { key: "supporting-evidence-attached", label: "Supporting evidence is attached", autoVerifiable: true },
  { key: "citation-locator-complete", label: "Citation locator is complete", autoVerifiable: true },
  { key: "wording-matches-evidence", label: "Claim wording matches the evidence", autoVerifiable: false },
  { key: "not-broader-than-evidence", label: "Claim is not broader than the evidence", autoVerifiable: false },
  { key: "source-scope-covers-domain", label: "Source scope covers the claim domain", autoVerifiable: false },
  { key: "jurisdiction-preserved", label: "Jurisdiction is preserved", autoVerifiable: false },
  { key: "audience-preserved", label: "Intended audience is preserved", autoVerifiable: false },
  { key: "source-limitations-preserved", label: "Source limitations are preserved", autoVerifiable: false },
  { key: "version-currency-reviewed", label: "Version and currency were reviewed", autoVerifiable: false },
  { key: "licensing-recorded", label: "Licensing / usage notes are recorded", autoVerifiable: false },
  { key: "conflicts-considered", label: "Conflicts or qualifying evidence were considered", autoVerifiable: false },
];

export interface ApprovalGuardResult {
  canApprove: boolean;
  /** Blocking reasons — an empty list means approval is permitted. */
  blockers: string[];
}

/**
 * Structural + checklist guard. Blocks approval unless:
 *  - at least one `supports`/`defines` link exists (§5)
 *  - every cited evidence span has a complete citation locator (§7)
 *  - every checklist item is affirmed (§7)
 * The "not broader than evidence" and "wording matches" checks are editorial
 * affirmations; the guard requires them to be ticked but cannot prove them.
 */
export function evaluateApprovalGuard(
  claim: CuratedClaim,
  links: ClaimEvidenceLink[],
  spans: EvidenceSpan[],
  checklist: ReviewChecklistState,
): ApprovalGuardResult {
  const blockers: string[] = [];

  if (!hasSupportingEvidence(claim.id, links)) {
    blockers.push(
      "No supporting/defining evidence is linked — a claim needs at least one `supports` or `defines` link before approval.",
    );
  }

  const citedSpanIds = links.map((l) => l.evidenceSpanId);
  const citedSpans = spans.filter((s) => citedSpanIds.includes(s.id));
  const incomplete = citedSpans.filter((s) => !citationIsComplete(s));
  if (citedSpans.length === 0) {
    blockers.push("No evidence spans are cited.");
  }
  for (const s of incomplete) {
    blockers.push(`Evidence span ${s.id} has an incomplete citation locator.`);
  }

  for (const item of REVIEW_CHECKLIST) {
    if (!checklist[item.key]) {
      blockers.push(`Checklist not affirmed: ${item.label}.`);
    }
  }

  return { canApprove: blockers.length === 0, blockers };
}

/** Allowed review-state transitions (documented, deterministic). */
const TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  draft: ["evidence-linked", "withdrawn"],
  "evidence-linked": ["in-review", "draft", "withdrawn"],
  "in-review": ["approved", "needs-revision", "withdrawn"],
  approved: ["needs-revision", "superseded", "withdrawn"],
  "needs-revision": ["evidence-linked", "in-review", "withdrawn"],
  superseded: ["withdrawn"],
  withdrawn: [],
};

export function canTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
