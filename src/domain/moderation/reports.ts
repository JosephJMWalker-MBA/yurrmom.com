/**
 * Reporting (Phase 9).
 *
 * A report is an ALLEGATION, not a verdict. Creating one never hides approved
 * content and never proves a violation. A single local reporter cannot stack
 * unlimited duplicate OPEN reports against the same target for the same reason.
 * Reporter references are internal only and never reach the public projection.
 */
import type { Report, ReportReason, ReportTargetType } from "./types";

export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  note?: string;
  localReporterRef: string;
}

export type ReportResult =
  | { ok: true; report: Report }
  | { ok: false; reason: string; duplicateOf?: string };

const HTML_OR_SCRIPT = /<\/?[a-z][\s\S]*?>|<script|javascript:|onerror=|onload=/i;

export function createReport(input: ReportInput, existing: Report[], now: string): ReportResult {
  if (input.note && HTML_OR_SCRIPT.test(input.note))
    return { ok: false, reason: "Report note can't contain markup." };

  // Duplicate guard: same reporter + target + reason with a still-open report.
  const dup = existing.find(
    (r) =>
      r.localReporterRef === input.localReporterRef &&
      r.targetId === input.targetId &&
      r.reason === input.reason &&
      (r.status === "open" || r.status === "reviewing"),
  );
  if (dup) return { ok: false, reason: "You already have an open report on this for the same reason.", duplicateOf: dup.id };

  const report: Report = {
    id: `report:${input.targetId}:${input.reason}:${input.localReporterRef}:${now}`,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    note: input.note?.trim() || undefined,
    localReporterRef: input.localReporterRef,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  return { ok: true, report };
}

/** Open or reviewing reports for a given target. */
export function openReportsFor(targetId: string, reports: Report[]): Report[] {
  return reports.filter((r) => r.targetId === targetId && (r.status === "open" || r.status === "reviewing"));
}
