/**
 * Deterministic public projection (Phase 9).
 *
 * `projectPublicRoast` is the ONLY way roast content reaches the public page.
 * It includes an active prompt, its APPROVED entries (with derived score), the
 * validated fiction label, and public bridges. It structurally excludes:
 * pending/removed/escalated entries, report details, reporter references,
 * moderator rationale, audit history, and internal policy notes. A non-active
 * prompt projects to `null` (not publicly visible).
 */
import type {
  PublicRoast,
  PublicRoastEntry,
  RoastEntryRecord,
  RoastPromptRecord,
  VoteRecord,
} from "./types";
import { deriveVoteScore } from "./votes";

export function projectPublicRoast(
  prompt: RoastPromptRecord,
  entries: RoastEntryRecord[],
  votes: VoteRecord[],
): PublicRoast | null {
  // A prompt that is not active is not publicly visible at all.
  if (prompt.status !== "active") return null;

  const approved: PublicRoastEntry[] = entries
    .filter((e) => e.promptSlug === prompt.slug && e.status === "approved")
    .map((e) => ({
      id: e.id,
      author: e.displayAuthor,
      body: e.body,
      score: deriveVoteScore(e, votes),
    }))
    // Ranked by derived score (wit), then stable by id. Cruelty/controversy
    // never enters this ordering — only approved entries and their scores do.
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  return {
    slug: prompt.slug,
    characterName: prompt.characterName,
    title: prompt.title,
    premise: prompt.premise,
    fictionLabel: prompt.fictionLabel,
    bridges: prompt.bridges,
    entries: approved,
  };
}

/** All active prompts, projected. Retired/draft prompts are omitted. */
export function projectPublicRoastList(
  prompts: RoastPromptRecord[],
  entries: RoastEntryRecord[],
  votes: VoteRecord[],
): PublicRoast[] {
  return prompts
    .map((p) => projectPublicRoast(p, entries, votes))
    .filter((r): r is PublicRoast => r !== null);
}
