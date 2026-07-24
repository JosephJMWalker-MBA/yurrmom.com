/**
 * Voting rules (Phase 9).
 *
 * Votes apply ONLY to approved entries, at most one per entry per local device.
 * The public score is always DERIVED (baseline + live votes) — never stored,
 * never able to change moderation priority, never able to make pending content
 * public.
 */
import type { RoastEntryRecord, VoteRecord } from "./types";

export function deriveVoteScore(entry: RoastEntryRecord, votes: VoteRecord[]): number {
  const live = votes.reduce((n, v) => (v.entryId === entry.id ? n + v.value : n), 0);
  return entry.baselineScore + live;
}

export function hasVoted(entryId: string, voterRef: string, votes: VoteRecord[]): boolean {
  return votes.some((v) => v.entryId === entryId && v.localVoterRef === voterRef);
}

export type VoteResult =
  | { ok: true; votes: VoteRecord[]; voted: boolean }
  | { ok: false; reason: string };

/**
 * Toggle a local device's single vote on an approved entry. Returns the new
 * vote list. Never creates more than one vote per (entry, voter).
 */
export function toggleVote(
  entry: RoastEntryRecord | undefined,
  voterRef: string,
  votes: VoteRecord[],
  now: string,
): VoteResult {
  if (!entry) return { ok: false, reason: "Entry not found." };
  if (entry.status !== "approved") return { ok: false, reason: "Only approved entries can be voted on." };
  const existing = votes.find((v) => v.entryId === entry.id && v.localVoterRef === voterRef);
  if (existing) {
    return { ok: true, votes: votes.filter((v) => v !== existing), voted: false };
  }
  const vote: VoteRecord = {
    id: `vote:${entry.id}:${voterRef}`,
    entryId: entry.id,
    localVoterRef: voterRef,
    value: 1,
    createdAt: now,
  };
  return { ok: true, votes: [...votes, vote], voted: true };
}
