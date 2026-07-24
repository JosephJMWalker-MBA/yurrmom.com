/**
 * Asset editing (Phase 8) — pure transforms that touch ONLY the asset.
 *
 * Editing a source-backed block flips it to `creator-authored-derivative`, sets
 * `editedFromExact`, and drops the exact-quote claim — the block keeps a link
 * to its original source for traceability but no longer asserts exact wording.
 * Canonical content is never touched. Required blocks/disclosures cannot be
 * removed (guarded here and re-checked by validation).
 */
import type { DistributionAsset, DistributionContentBlock } from "./types";

function touch(asset: DistributionAsset, now?: string): DistributionAsset {
  return { ...asset, updatedAt: now ?? new Date().toISOString() };
}

/** Edit a block's text. Source-backed blocks become creator-authored-derivative. */
export function editBlockText(
  asset: DistributionAsset,
  blockId: string,
  newText: string,
  now?: string,
): DistributionAsset {
  const blocks = asset.blocks.map((b): DistributionContentBlock => {
    if (b.id !== blockId) return b;
    const wasSourceBacked = b.provenance === "source-backed" || b.provenance === "translated-derivative";
    const unchanged = b.text === newText;
    if (unchanged) return b;
    return {
      ...b,
      text: newText,
      provenance: wasSourceBacked ? "creator-authored-derivative" : b.provenance === "deterministic-template" ? "creator-authored-derivative" : b.provenance,
      editedFromExact: wasSourceBacked ? true : b.editedFromExact,
    };
  });
  // Any edit invalidates a prior ready state until re-validated.
  const status = asset.status === "ready" || asset.status === "exported" ? "draft" : asset.status;
  return { ...touch(asset, now), blocks, status };
}

/** Reorder OPTIONAL blocks. Required blocks keep their relative anchoring. */
export function reorderBlocks(asset: DistributionAsset, orderedIds: string[], now?: string): DistributionAsset {
  const byId = new Map(asset.blocks.map((b) => [b.id, b]));
  const seen = new Set<string>();
  const next: DistributionContentBlock[] = [];
  for (const id of orderedIds) {
    const b = byId.get(id);
    if (b && !seen.has(id)) {
      next.push(b);
      seen.add(id);
    }
  }
  // Append any blocks not named in the order (never silently dropped).
  for (const b of asset.blocks) if (!seen.has(b.id)) next.push(b);
  return { ...touch(asset, now), blocks: next };
}

/** Remove an OPTIONAL block. Required blocks are refused (returns unchanged). */
export function removeBlock(asset: DistributionAsset, blockId: string, now?: string): DistributionAsset {
  const target = asset.blocks.find((b) => b.id === blockId);
  if (!target || target.required) return asset; // never silently drop a required block
  return { ...touch(asset, now), blocks: asset.blocks.filter((b) => b.id !== blockId) };
}
