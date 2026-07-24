"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ADMIN_IDENTITY,
  buildModerationQueue,
  moderateEntry,
  mutateTaxonomy,
  orderedPlacements,
  resolveReport,
  setFeatured,
  setPromptStatus,
  type FeatureInput,
  type ModerateEntryInput,
  type ModerationStore,
  type OpResult,
  type ResolveReportInput,
  type SetPromptStatusInput,
  type TaxonomyOpInput,
} from "@/domain/moderation";
import { moderationRepo } from "@/data/moderation-repo";

type OpInput<T> = Omit<T, "actor">;

/**
 * Admin-side moderation state, backed by the device-local repository. Every
 * consequential operation runs a pure domain function (which enforces
 * rationale, legal transitions, and append-only audit), then persists. The
 * public projection is computed independently and never reads this hook.
 */
export function useModeration() {
  const [store, setStore] = useState<ModerationStore | null>(null);

  useEffect(() => {
    setStore(moderationRepo.load());
  }, []);

  const apply = useCallback((run: (s: ModerationStore) => OpResult): { ok: boolean; reason?: string } => {
    if (!store) return { ok: false, reason: "Not ready." };
    const result = run(store);
    if (!result.ok) return { ok: false, reason: result.reason };
    moderationRepo.save(result.store);
    setStore(result.store);
    return { ok: true };
  }, [store]);

  const now = () => new Date().toISOString();

  const queue = useMemo(() => (store ? buildModerationQueue(store) : []), [store]);

  const counts = useMemo(() => {
    if (!store) return null;
    const entries = store.entries;
    return {
      pending: entries.filter((e) => e.status === "pending").length,
      escalated: entries.filter((e) => e.status === "escalated").length,
      approved: entries.filter((e) => e.status === "approved").length,
      removed: entries.filter((e) => e.status === "removed").length,
      openReports: store.reports.filter((r) => r.status === "open" || r.status === "reviewing").length,
      urgentOrHigh: buildModerationQueue(store).filter((q) => q.band === "urgent" || q.band === "high").length,
      activePrompts: store.prompts.filter((p) => p.status === "active").length,
      activeFeatured: store.featured.filter((f) => f.status === "active").length,
      deprecatedTerms: store.taxonomy.filter((t) => t.status === "deprecated").length,
    };
  }, [store]);

  return {
    ready: store !== null,
    store,
    queue,
    counts,
    placements: store ? orderedPlacements(store.featured) : [],
    reset: useCallback(() => setStore(moderationRepo.reset()), []),

    moderateEntry: (input: OpInput<ModerateEntryInput>) =>
      apply((s) => moderateEntry(s, { actor: ADMIN_IDENTITY, ...input }, now())),
    resolveReport: (input: OpInput<ResolveReportInput>) =>
      apply((s) => resolveReport(s, { actor: ADMIN_IDENTITY, ...input }, now())),
    setPromptStatus: (input: OpInput<SetPromptStatusInput>) =>
      apply((s) => setPromptStatus(s, { actor: ADMIN_IDENTITY, ...input }, now())),
    setFeatured: (input: OpInput<FeatureInput>) =>
      apply((s) => setFeatured(s, { actor: ADMIN_IDENTITY, ...input }, now())),
    mutateTaxonomy: (input: OpInput<TaxonomyOpInput>) =>
      apply((s) => mutateTaxonomy(s, { actor: ADMIN_IDENTITY, ...input }, now())),
  };
}
