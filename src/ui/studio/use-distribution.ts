"use client";

import { useCallback, useEffect, useState } from "react";
import { getList, getSystem, systems } from "@/data";
import {
  createDistributionAsset,
  editBlockText,
  exportAsset,
  markExported,
  removeBlock,
  reorderBlocks,
  reviewStaleAsset,
  validateDistributionAsset,
  type CreateAssetResult,
  type DistributionAsset,
  type ExportFormat,
  type ExportResult,
  type SourceSelection,
} from "@/domain/distribution";
import { distributionRepo, type DistributionStore } from "@/data/distribution-repo";

/**
 * Local editorial state for the Content Studio. Mirrors the reference/workspace
 * hooks: loads from the repository seam after mount (localStorage has no SSR)
 * and persists every mutation immediately. The CANONICAL system is always read
 * fresh from the data layer so validation and staleness reflect the current
 * source of truth — an asset is a derivative, never a source.
 */
export function useDistribution() {
  const [store, setStore] = useState<DistributionStore | null>(null);

  useEffect(() => {
    setStore(distributionRepo.load());
  }, []);

  /** Re-validate an asset against its CURRENT canonical system. */
  const revalidate = useCallback((asset: DistributionAsset): DistributionAsset => {
    const current = getSystem(asset.sourceSystemSlug);
    return { ...asset, validation: validateDistributionAsset(asset, current) };
  }, []);

  const persist = useCallback((asset: DistributionAsset) => {
    const validated = { ...asset, validation: validateDistributionAsset(asset, getSystem(asset.sourceSystemSlug)) };
    setStore(distributionRepo.upsert(validated));
    return validated;
  }, []);

  const create = useCallback(
    (args: {
      systemSlug: string;
      templateId: string;
      selection: SourceSelection;
      internalName?: string;
    }): CreateAssetResult => {
      const system = getSystem(args.systemSlug);
      if (!system) return { ok: false, reason: `Unknown system "${args.systemSlug}".` };
      const lists = system.listSlugs.map((s) => getList(s)).filter((l): l is NonNullable<typeof l> => Boolean(l));
      const result = createDistributionAsset({
        system,
        lists,
        templateId: args.templateId,
        selection: args.selection,
        creatorHandle: system.creatorHandle,
        internalName: args.internalName,
      });
      if (result.ok) setStore(distributionRepo.upsert(result.asset));
      return result;
    },
    [],
  );

  const get = useCallback(
    (id: string): DistributionAsset | undefined => store?.assets.find((a) => a.id === id),
    [store],
  );

  const editBlock = useCallback(
    (id: string, blockId: string, text: string) => {
      const asset = store?.assets.find((a) => a.id === id);
      if (!asset) return;
      persist(editBlockText(asset, blockId, text));
    },
    [store, persist],
  );

  const dropBlock = useCallback(
    (id: string, blockId: string) => {
      const asset = store?.assets.find((a) => a.id === id);
      if (!asset) return;
      persist(removeBlock(asset, blockId));
    },
    [store, persist],
  );

  const reorder = useCallback(
    (id: string, orderedIds: string[]) => {
      const asset = store?.assets.find((a) => a.id === id);
      if (!asset) return;
      persist(reorderBlocks(asset, orderedIds));
    },
    [store, persist],
  );

  /** Promote a valid, current asset to `ready`. Refused if invalid/stale. */
  const markReady = useCallback(
    (id: string): { ok: boolean; reason?: string } => {
      const asset = store?.assets.find((a) => a.id === id);
      if (!asset) return { ok: false, reason: "Asset not found." };
      const validated = revalidate(asset);
      if (!validated.validation?.valid) return { ok: false, reason: "Resolve validation issues first." };
      persist({ ...validated, status: "ready" });
      return { ok: true };
    },
    [store, persist, revalidate],
  );

  const reviewStale = useCallback(
    (id: string) => {
      const asset = store?.assets.find((a) => a.id === id);
      if (!asset) return;
      const current = getSystem(asset.sourceSystemSlug);
      if (!current) return;
      persist(reviewStaleAsset(asset, current));
    },
    [store, persist],
  );

  const doExport = useCallback(
    (id: string, format: ExportFormat): ExportResult => {
      const asset = store?.assets.find((a) => a.id === id);
      if (!asset) return { ok: false, reason: "Asset not found." };
      const validated = revalidate(asset);
      const result = exportAsset(validated, format);
      if (result.ok) persist(markExported(validated));
      return result;
    },
    [store, persist, revalidate],
  );

  const remove = useCallback((id: string) => {
    setStore(distributionRepo.remove(id));
  }, []);

  const reset = useCallback(() => {
    setStore(distributionRepo.reset());
  }, []);

  return {
    ready: store !== null,
    assets: store?.assets ?? [],
    systems,
    create,
    get,
    editBlock,
    dropBlock,
    reorder,
    markReady,
    reviewStale,
    doExport,
    remove,
    reset,
    revalidate,
  };
}
