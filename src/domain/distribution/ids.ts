/**
 * Deterministic IDs for distribution assets/blocks (Phase 8).
 *
 * Reuses the shared `contentHash` (FNV-1a) — no parallel hash implementation.
 * The same inputs always produce the same asset/block ID.
 */
import { contentHash } from "../reference/hash";
import type { AssetType, BlockKind, SourceSelection } from "./types";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Stable for the same system+type+template+selection+creator+locale. */
export function assetId(args: {
  systemSlug: string;
  assetType: AssetType;
  templateId: string;
  creatorHandle: string;
  assetLocale: string;
  selection: SourceSelection;
}): string {
  const selectionKey = contentHash(
    JSON.stringify({
      p: !!args.selection.promise,
      pr: !!args.selection.problem,
      hc: !!args.selection.householdContext,
      s: args.selection.storyIndices ?? [],
      li: args.selection.listItemIds ?? [],
      r: args.selection.routineIndices ?? [],
      rc: args.selection.recipeIndices ?? [],
      oo: !!args.selection.observedOutcomes,
      lim: !!args.selection.limitations,
      ap: !!args.selection.applicability,
      d: !!args.selection.disclosure,
    }),
  );
  return `da:${args.systemSlug}:${args.assetType}:${slugify(args.templateId)}:${args.assetLocale}:${selectionKey}`;
}

export function blockId(assetIdValue: string, kind: BlockKind, localKey: string): string {
  return `blk:${contentHash(`${assetIdValue}|${kind}|${localKey}`)}`;
}

export function disclosureId(assetIdValue: string, kind: string): string {
  return `dsc:${contentHash(`${assetIdValue}|${kind}`)}`;
}
