/**
 * Source-version staleness (Phase 8).
 *
 * When the canonical system version moves past the version an asset was built
 * from, the asset is stale: it must be reviewed before returning to `ready`,
 * and it cannot export as current. Creator edits are never auto-rewritten and
 * nothing auto-republishes.
 */
import type { HouseholdSystem } from "../types";
import type { DistributionAsset } from "./types";

export interface StalenessReport {
  stale: boolean;
  assetVersion: number;
  currentVersion: number;
  /** Source refs whose object version predates the current system. */
  changedRefIds: string[];
}

export function assetStaleness(asset: DistributionAsset, current: HouseholdSystem): StalenessReport {
  const stale = asset.sourceSystemVersion < current.version;
  return {
    stale,
    assetVersion: asset.sourceSystemVersion,
    currentVersion: current.version,
    changedRefIds: stale
      ? asset.sourceRefs.filter((r) => r.sourceVersion < current.version).map((r) => r.sourceObjectId)
      : [],
  };
}

/** Mark an asset stale (preserving history + creator edits). Returns a new asset. */
export function markStale(asset: DistributionAsset, current: HouseholdSystem, now?: string): DistributionAsset {
  const report = assetStaleness(asset, current);
  if (!report.stale) return asset;
  return {
    ...asset,
    status: "stale",
    updatedAt: now ?? new Date().toISOString(),
    provenance: { ...asset.provenance, reviewState: "needs-review" },
  };
}

/**
 * Creator confirms they've reviewed a stale asset against the current source.
 * This does NOT rewrite edits; it re-baselines the version and returns to draft
 * (the creator then re-validates to reach `ready`).
 */
export function reviewStaleAsset(asset: DistributionAsset, current: HouseholdSystem, now?: string): DistributionAsset {
  return {
    ...asset,
    sourceSystemVersion: current.version,
    status: "draft",
    updatedAt: now ?? new Date().toISOString(),
    provenance: { ...asset.provenance, reviewState: "creator-reviewed" },
  };
}
