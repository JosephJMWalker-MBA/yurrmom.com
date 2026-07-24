/**
 * Deterministic asset creation (Phase 8).
 *
 * Builds a DistributionAsset from a canonical system + selection + template.
 * Read-only over the canonical system (never mutates it). The asset carries the
 * source version so staleness is detectable later.
 *
 * Translation rule (§8): an asset may be created only from the ORIGINAL source
 * or an approved/current translation. A machine-draft or stale translation is
 * inspectable but cannot be the publication source — createDistributionAsset
 * refuses a non-approved translation locale.
 */
import type { HouseholdSystem, PortableList } from "../types";
import { assetId } from "./ids";
import { getTemplate } from "./templates";
import { validateDistributionAsset } from "./validate";
import type {
  AssetProvenance,
  DistributionAsset,
  SourceSelection,
} from "./types";

export interface CreateAssetInput {
  system: HouseholdSystem;
  lists: PortableList[];
  templateId: string;
  selection: SourceSelection;
  creatorHandle: string;
  internalName?: string;
  assetLocale?: string;
  /** Only for an approved/current translation. Defaults to the source locale. */
  translation?: {
    status: string; // must be "creator-approved" or "reviewed"
    sourceVersion: number;
    attribution?: string;
  };
  now?: string; // ISO, injectable for deterministic tests
}

export type CreateAssetResult =
  | { ok: true; asset: DistributionAsset }
  | { ok: false; reason: string };

const APPROVED_TRANSLATION = new Set(["creator-approved", "reviewed"]);

export function createDistributionAsset(input: CreateAssetInput): CreateAssetResult {
  const template = getTemplate(input.templateId);
  if (!template) return { ok: false, reason: `Unknown template "${input.templateId}".` };

  const sourceLocale = input.system.locale?.sourceLocale ?? "en";
  const assetLocale = input.assetLocale ?? sourceLocale;
  const localized = assetLocale.split("-")[0] !== sourceLocale.split("-")[0];

  if (localized) {
    if (!input.translation) {
      return { ok: false, reason: "A localized asset requires an approved translation source." };
    }
    if (!APPROVED_TRANSLATION.has(input.translation.status)) {
      return {
        ok: false,
        reason: `Cannot create an asset from a ${input.translation.status} translation — only approved/current translations may be published.`,
      };
    }
  }

  const now = input.now ?? new Date().toISOString();
  const id = assetId({
    systemSlug: input.system.slug,
    assetType: template.assetType,
    templateId: template.id,
    creatorHandle: input.creatorHandle,
    assetLocale,
    selection: input.selection,
  });

  const { blocks, disclosures } = template.build({
    system: input.system,
    lists: input.lists,
    selection: input.selection,
    assetId: id,
    assetLocale,
  });

  const sourceRefs = blocks
    .map((b) => b.sourceRef)
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const provenance: AssetProvenance = {
    creatorHandle: input.creatorHandle,
    sourceSystemSlug: input.system.slug,
    sourceSystemVersion: input.system.version,
    sourceLocale,
    assetLocale,
    translationStatus: localized ? "approved-translation" : "original",
    translationSourceVersion: input.translation?.sourceVersion,
    translatorAttribution: input.translation?.attribution,
    reviewState: "unreviewed",
    cautionNotes: [],
  };

  const asset: DistributionAsset = {
    id,
    creatorHandle: input.creatorHandle,
    sourceSystemSlug: input.system.slug,
    sourceSystemVersion: input.system.version,
    sourceLocale,
    assetLocale,
    assetType: template.assetType,
    channel: template.channels[0],
    templateId: template.id,
    templateVersion: template.version,
    internalName: input.internalName ?? `${input.system.title} — ${template.assetType}`,
    status: "draft",
    sourceRefs,
    blocks,
    disclosures,
    requiredDisclosureKinds: disclosures.filter((d) => d.required).map((d) => d.kind),
    provenance,
    createdAt: now,
    updatedAt: now,
    origin: "local-device",
  };

  asset.validation = validateDistributionAsset(asset, input.system);
  return { ok: true, asset };
}
