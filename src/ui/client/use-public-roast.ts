"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildPendingEntry,
  createReport,
  projectPublicRoast,
  toggleVote,
  type ModerationStore,
  type PublicRoast,
  type ReportReason,
  type RoastEntryRecord,
} from "@/domain/moderation";
import { moderationRepo } from "@/data/moderation-repo";

/** One stable per-device reference for votes/submissions/reports (not identity). */
function deviceRef(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const k = "ym:device-ref";
    let ref = window.localStorage.getItem(k);
    if (!ref) {
      ref = `dev-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(k, ref);
    }
    return ref;
  } catch {
    return "local-device";
  }
}

/**
 * Public roast participation, backed by the device-local moderation repository.
 * The visitor sees only the PUBLIC PROJECTION (approved entries). Submissions
 * become `pending` (never public, never auto-approved). Votes apply only to
 * approved entries. Reports are allegations that never hide content here.
 */
export function usePublicRoast(slug: string, fallback: PublicRoast) {
  const [store, setStore] = useState<ModerationStore | null>(null);
  const [ref, setRef] = useState("ssr");

  useEffect(() => {
    setStore(moderationRepo.load());
    setRef(deviceRef());
  }, []);

  const persist = useCallback((next: ModerationStore) => {
    moderationRepo.save(next);
    setStore(next);
  }, []);

  const prompt = store?.prompts.find((p) => p.slug === slug);
  const projected: PublicRoast =
    store && prompt ? projectPublicRoast(prompt, store.entries, store.votes) ?? fallback : fallback;

  /** This device's own pending submissions (shown to the author, never public). */
  const myPending: RoastEntryRecord[] =
    store?.entries.filter((e) => e.promptSlug === slug && e.status === "pending" && e.localAuthorRef === ref) ?? [];

  const votedFor = useCallback(
    (entryId: string) => store?.votes.some((v) => v.entryId === entryId && v.localVoterRef === ref) ?? false,
    [store, ref],
  );

  const vote = useCallback(
    (entryId: string) => {
      if (!store) return;
      const entry = store.entries.find((e) => e.id === entryId);
      const result = toggleVote(entry, ref, store.votes, new Date().toISOString());
      if (result.ok) persist({ ...store, votes: result.votes });
    },
    [store, ref, persist],
  );

  const submit = useCallback(
    (args: { displayName?: string; body: string; affirmedFictionalTarget: boolean }): { ok: boolean; reason?: string } => {
      if (!store) return { ok: false, reason: "Not ready." };
      const result = buildPendingEntry(
        { promptSlug: slug, localAuthorRef: ref, ...args },
        new Date().toISOString(),
      );
      if (!result.ok) return { ok: false, reason: result.reason };
      persist({ ...store, entries: [...store.entries, result.entry] });
      return { ok: true };
    },
    [store, ref, slug, persist],
  );

  const report = useCallback(
    (args: { targetId: string; reason: ReportReason; note?: string }): { ok: boolean; reason?: string } => {
      if (!store) return { ok: false, reason: "Not ready." };
      const result = createReport(
        { targetType: "roast-entry", localReporterRef: ref, ...args },
        store.reports,
        new Date().toISOString(),
      );
      if (!result.ok) return { ok: false, reason: result.reason };
      persist({ ...store, reports: [...store.reports, result.report] });
      return { ok: true };
    },
    [store, ref, persist],
  );

  return { ready: store !== null, roast: projected, myPending, vote, votedFor, submit, report };
}
