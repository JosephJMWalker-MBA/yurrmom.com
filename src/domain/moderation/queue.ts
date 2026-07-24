/**
 * Deterministic moderation queue (Phase 9).
 *
 * Priority is expressed as explicit BANDS with a stated reason — never an
 * opaque score. Ordering within a band is oldest-unresolved-first, then by
 * deterministic ID. Priority NEVER considers votes, popularity, follower count,
 * affiliate value, controversy, or engagement. Report volume is not truth: a
 * report's band comes from its reason category, and multiple reports do not
 * escalate the band beyond what a single report of that category would.
 */
import { validateFictionProvenance } from "./provenance";
import type {
  ModerationStore,
  PriorityBand,
  QueueItem,
  Report,
  ReportReason,
} from "./types";

const BAND_RANK: Record<PriorityBand, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

/** Band for a report, derived solely from its reason category. */
function reportBand(reason: ReportReason): PriorityBand {
  switch (reason) {
    case "pii-or-doxxing":
    case "minor-safety":
    case "threat-or-violence":
    case "targets-real-person":
      return "urgent";
    case "hate-or-protected-trait":
    case "sexual-content":
    case "harassment":
      return "high";
    case "spam-or-manipulation":
      return "low";
    case "other":
      return "normal";
  }
}

function reportReasonText(reason: ReportReason): string {
  const map: Record<ReportReason, string> = {
    "pii-or-doxxing": "PII/doxxing report — urgent human review.",
    "minor-safety": "Minor-safety report — urgent human review.",
    "threat-or-violence": "Threat/violence report — urgent human review.",
    "targets-real-person": "Report alleges an identifiable real person is targeted — urgent.",
    "hate-or-protected-trait": "Hate / protected-trait report.",
    "sexual-content": "Sexual-content report.",
    "harassment": "Harassment report.",
    "spam-or-manipulation": "Spam / manipulation report.",
    "other": "Open report awaiting review.",
  };
  return map[reason];
}

export function buildModerationQueue(store: ModerationStore): QueueItem[] {
  const items: QueueItem[] = [];

  // Prompts missing valid fiction provenance → urgent; draft prompts awaiting
  // activation with valid provenance → low (routine maintenance).
  for (const p of store.prompts) {
    if (p.status === "retired") continue;
    const prov = validateFictionProvenance(p.provenance);
    if (!prov.valid) {
      items.push({
        id: `q:prompt:${p.slug}`,
        kind: "prompt",
        targetType: "roast-prompt",
        targetId: p.slug,
        band: "urgent",
        reason: `Prompt missing valid fiction provenance: ${prov.issues[0]}`,
        since: p.updatedAt,
      });
    } else if (p.status === "draft") {
      items.push({
        id: `q:prompt:${p.slug}`,
        kind: "prompt",
        targetType: "roast-prompt",
        targetId: p.slug,
        band: "low",
        reason: "Draft prompt with valid provenance awaiting activation review.",
        since: p.updatedAt,
      });
    }
  }

  // Entries: escalated → high, pending → normal.
  for (const e of store.entries) {
    if (e.status === "escalated") {
      items.push({
        id: `q:entry:${e.id}`,
        kind: "entry",
        targetType: "roast-entry",
        targetId: e.id,
        band: "high",
        reason: "Entry is escalated — internal review required (not an accusation).",
        since: e.updatedAt,
      });
    } else if (e.status === "pending") {
      items.push({
        id: `q:entry:${e.id}`,
        kind: "entry",
        targetType: "roast-entry",
        targetId: e.id,
        band: "normal",
        reason: "New pending submission awaiting first review.",
        since: e.createdAt,
      });
    }
  }

  // Open/reviewing reports: band from reason category only.
  for (const r of store.reports as Report[]) {
    if (r.status !== "open" && r.status !== "reviewing") continue;
    items.push({
      id: `q:report:${r.id}`,
      kind: "report",
      targetType: "report",
      targetId: r.targetId,
      band: reportBand(r.reason),
      reason: reportReasonText(r.reason),
      since: r.createdAt,
      reportId: r.id,
    });
  }

  // Deterministic ordering: band, then oldest-first, then stable by id.
  return items.sort(
    (a, b) =>
      BAND_RANK[a.band] - BAND_RANK[b.band] ||
      a.since.localeCompare(b.since) ||
      a.id.localeCompare(b.id),
  );
}
