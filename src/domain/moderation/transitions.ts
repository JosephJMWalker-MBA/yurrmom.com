/**
 * Entry state-transition guards (Phase 9), centralized and tested.
 *
 * There is no way to construct an entry as `approved`; status only moves along
 * these edges, and every move requires a rationale (enforced by the action
 * layer). Public projection only ever shows `approved`.
 */
import type { EntryStatus, ModerationActionKind } from "./types";

/** Allowed entry transitions. `removed → approved` is intentionally absent. */
const ENTRY_EDGES: Record<EntryStatus, EntryStatus[]> = {
  pending: ["approved", "removed", "escalated"],
  approved: ["removed", "escalated"],
  removed: ["pending"], // must return through review; never removed → approved
  escalated: ["pending", "removed", "approved"], // approved only via explicit reviewed rationale
};

export function canTransitionEntry(from: EntryStatus, to: EntryStatus): boolean {
  if (from === to) return false;
  return ENTRY_EDGES[from]?.includes(to) ?? false;
}

/** The moderation action that produces a given target entry status. */
export function actionForEntryStatus(to: EntryStatus): ModerationActionKind {
  switch (to) {
    case "approved":
      return "approve";
    case "removed":
      return "remove";
    case "escalated":
      return "escalate";
    case "pending":
      return "restore-to-pending";
  }
}

/**
 * `escalated → approved` requires an explicit reviewed affirmation — escalation
 * means "internal review required", so clearing it to public must be deliberate.
 */
export function requiresReviewedAffirmation(from: EntryStatus, to: EntryStatus): boolean {
  return from === "escalated" && to === "approved";
}
