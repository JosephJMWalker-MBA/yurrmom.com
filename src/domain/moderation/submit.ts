/**
 * Public roast submission validation (Phase 9).
 *
 * A visitor submits a roast for REVIEW. The result is always a `pending` entry
 * — never auto-approved, never public, never implying a moderator has seen it.
 * Input is trimmed and validated; HTML/script is rejected and never rendered as
 * markup. A fictional-target affirmation is required.
 */
import type { RoastEntryRecord } from "./types";

export const SUBMISSION_MIN = 3;
export const SUBMISSION_MAX = 280;

const HTML_OR_SCRIPT = /<\/?[a-z][\s\S]*?>|<script|javascript:|onerror=|onload=/i;

export interface SubmissionInput {
  promptSlug: string;
  displayName?: string;
  body: string;
  affirmedFictionalTarget: boolean;
  localAuthorRef: string;
}

export type SubmissionResult =
  | { ok: true; entry: RoastEntryRecord }
  | { ok: false; reason: string };

export function buildPendingEntry(input: SubmissionInput, now: string): SubmissionResult {
  const body = (input.body ?? "").trim();
  if (!body) return { ok: false, reason: "Write a roast before submitting." };
  if (body.length < SUBMISSION_MIN) return { ok: false, reason: `Too short — at least ${SUBMISSION_MIN} characters.` };
  if (body.length > SUBMISSION_MAX) return { ok: false, reason: `Too long — keep it under ${SUBMISSION_MAX} characters.` };
  if (HTML_OR_SCRIPT.test(body)) return { ok: false, reason: "Plain text only — HTML and scripts aren't allowed." };
  if (!input.affirmedFictionalTarget)
    return { ok: false, reason: "Please affirm this targets the fictional prompt, not a real person." };

  const displayAuthor = (input.displayName ?? "").trim() || "anonymous";
  if (HTML_OR_SCRIPT.test(displayAuthor)) return { ok: false, reason: "Display name can't contain markup." };

  const entry: RoastEntryRecord = {
    id: `entry:${input.promptSlug}:${input.localAuthorRef}:${now}`,
    promptSlug: input.promptSlug,
    localAuthorRef: input.localAuthorRef,
    displayAuthor: displayAuthor.slice(0, 40),
    body,
    status: "pending", // ALWAYS pending — never approved on creation
    baselineScore: 0,
    reportIds: [],
    moderationVersion: 0,
    createdAt: now,
    updatedAt: now,
    origin: "local-device",
  };
  return { ok: true, entry };
}
