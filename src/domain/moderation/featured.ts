/**
 * Featured-placement curation (Phase 9).
 *
 * Featuring is a SEPARATE record — it never mutates a canonical system or
 * creator, and it never implies professional endorsement. Only `active`
 * placements (within their time window) render, in a deterministic order.
 * Affiliate earnings and follower popularity must never influence this order.
 */
import type { FeaturedPlacement, FeaturedPlacementSlot } from "./types";

/** Is a placement currently live (active + within [startAt, endAt))? */
export function isPlacementLive(p: FeaturedPlacement, now: string): boolean {
  if (p.status !== "active") return false;
  if (p.startAt && now < p.startAt) return false;
  if (p.endAt && now >= p.endAt) return false;
  return true;
}

/** Deterministic, live placements for a slot — order by displayOrder then id. */
export function liveFeatured(
  placements: FeaturedPlacement[],
  slot: FeaturedPlacementSlot,
  now: string,
): FeaturedPlacement[] {
  return placements
    .filter((p) => p.placement === slot && isPlacementLive(p, now))
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
}

/** All placements grouped for the admin preview (no popularity ranking). */
export function orderedPlacements(placements: FeaturedPlacement[]): FeaturedPlacement[] {
  return [...placements].sort(
    (a, b) =>
      a.placement.localeCompare(b.placement) ||
      a.displayOrder - b.displayOrder ||
      a.id.localeCompare(b.id),
  );
}
