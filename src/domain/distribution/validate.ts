/**
 * DistributionAsset validation (Phase 8). Fail closed. Never repairs.
 *
 * Enforces the canonical/derivative boundary and the platform's honesty rules:
 * provenance present, required disclosures/cautions/limitations retained,
 * translations not misrepresented, affiliate links preserved (not rewritten),
 * no unsupported retailer/guaranteed-result claims, no roast fiction, no unsafe
 * HTML/URLs, and every source-backed block traceable to the current source.
 */
import type { HouseholdSystem } from "../types";
import { getTemplate } from "./templates";
import { requiredCautions, looksLikeRoast } from "./sensitivity";
import type {
  AssetValidationIssue,
  AssetValidationResult,
  DistributionAsset,
} from "./types";

const HTML_OR_SCRIPT = /<\/?[a-z][\s\S]*?>|<script|javascript:|onerror=|onload=/i;
const GUARANTEE = /\b(guarantee[ds]?|guaranteed to work|always works|proven to|cures?|100% effective|risk-free)\b/i;
const UNIVERSAL = /\b(everyone should|works for everyone|the only way|you must always)\b/i;
const RETAILER_CLAIM = /\b(cheapest|best price|lowest price|in stock everywhere|guaranteed in stock)\b/i;

export function validateDistributionAsset(
  asset: DistributionAsset,
  currentSource: HouseholdSystem | undefined,
): AssetValidationResult {
  const errors: AssetValidationIssue[] = [];
  const warnings: AssetValidationIssue[] = [];
  const err = (code: string, message: string, extra: Partial<AssetValidationIssue> = {}) =>
    errors.push({ code, message, ...extra });

  // ---- source system present + version ----
  if (!currentSource) {
    err("missing-source-system", "The canonical source system is missing.");
    return { valid: false, errors, warnings };
  }
  if (currentSource.slug !== asset.sourceSystemSlug) {
    err("source-mismatch", "Asset source slug does not match the supplied system.");
  }
  if (asset.sourceSystemVersion > currentSource.version) {
    err("source-version-mismatch", "Asset references a newer source version than exists.");
  }
  if (asset.sourceSystemVersion < currentSource.version || asset.status === "stale") {
    err("stale-source", `Asset was built from v${asset.sourceSystemVersion}; source is now v${currentSource.version}. Review required before it is current.`);
  }

  // ---- provenance ----
  if (!asset.provenance || !asset.provenance.creatorHandle || !asset.provenance.sourceSystemSlug) {
    err("missing-provenance", "Asset provenance is incomplete.");
  }

  // ---- template / channel compatibility ----
  const template = getTemplate(asset.templateId);
  if (!template) {
    err("invalid-template", `Unknown template "${asset.templateId}".`);
  } else {
    if (template.assetType !== asset.assetType)
      err("template-type-mismatch", "Template asset type does not match the asset.");
    if (!template.channels.includes(asset.channel))
      err("invalid-channel", `Channel "${asset.channel}" is not valid for template "${asset.templateId}".`);
  }

  // ---- block integrity ----
  const ids = new Set<string>();
  for (const b of asset.blocks) {
    if (ids.has(b.id)) err("duplicate-block-id", `Duplicate block id "${b.id}".`, { blockId: b.id });
    ids.add(b.id);

    // exact-source label cannot survive an edit
    if (b.provenance === "source-backed" && b.sourceRef && b.text !== b.sourceRef.exactText)
      err("exact-label-on-edited-block", "A block claims source-backed but its text differs from the exact source.", { blockId: b.id });
    if (b.editedFromExact && b.provenance === "source-backed")
      err("exact-label-after-edit", "An edited block still claims source-backed exact wording.", { blockId: b.id });

    // source-backed blocks must trace to the current source object version
    if (b.provenance === "source-backed" && b.sourceRef) {
      if (b.sourceRef.owningSystemSlug !== asset.sourceSystemSlug)
        err("source-link-mismatch", "A source-backed block links to a different system.", { blockId: b.id });
      if (b.sourceRef.sourceVersion > currentSource.version)
        err("source-link-future-version", "A source-backed block links to a non-existent source version.", { blockId: b.id });
    }

    // translation honesty
    if (b.provenance === "translated-derivative" && asset.provenance.translationStatus === "original")
      err("translation-misrepresented", "A translated block appears in an asset marked as original.", { blockId: b.id });

    // safety scans on the block text
    if (HTML_OR_SCRIPT.test(b.text)) err("unsafe-html", "Block contains HTML or script.", { blockId: b.id });
    if (GUARANTEE.test(b.text)) err("guaranteed-result", "Block presents a guaranteed/unverified result.", { blockId: b.id });
    if (UNIVERSAL.test(b.text)) err("universal-claim", "Block presents one household's method as universal.", { blockId: b.id });
    if (RETAILER_CLAIM.test(b.text)) err("unsupported-retailer-claim", "Block makes an unsupported retailer claim.", { blockId: b.id });
    if (looksLikeRoast(b.text)) err("roast-fiction-mixed", "Fictional roast content cannot appear in practical guidance.", { blockId: b.id });

    // malformed URLs (only citation/source links allowed; must be well-formed)
    for (const u of b.text.match(/https?:\/\/\S+/g) ?? []) {
      try {
        // eslint-disable-next-line no-new
        new URL(u);
      } catch {
        err("malformed-url", `Block contains a malformed URL: ${u}`, { blockId: b.id });
      }
    }
  }

  // ---- required blocks present ----
  if (template) {
    const kinds = new Set(asset.blocks.map((b) => b.kind));
    for (const rk of template.requiredBlockKinds) {
      if (!kinds.has(rk)) err("missing-required-block", `Required block kind "${rk}" is missing.`);
    }
  }
  for (const b of asset.blocks) {
    if (b.required && !b.text.trim())
      err("empty-required-block", `Required block "${b.kind}" is empty.`, { blockId: b.id });
  }

  // ---- required disclosures / cautions cannot be removed ----
  // Present disclosure kinds still on the asset:
  const presentKinds = new Set(asset.disclosures.filter((d) => d.required).map((d) => d.kind));
  // Requirement set = union of what the source required at creation (baked) plus
  // medical/developmental cautions re-derived from the CURRENT source.
  const cautions = requiredCautions(currentSource);
  const required = new Set(asset.requiredDisclosureKinds);
  if (cautions.medical) required.add("medical-caution");
  if (cautions.developmental) required.add("developmental-caution");
  required.add("experience-not-universal");
  const localized = asset.assetLocale.split("-")[0] !== asset.sourceLocale.split("-")[0];
  if (localized) required.add("translation-caution");

  for (const kind of required) {
    if (!presentKinds.has(kind)) {
      const map: Record<string, [string, string]> = {
        "medical-caution": ["missing-medical-caution", "A required medical caution has been removed."],
        "developmental-caution": ["missing-developmental-caution", "A required developmental caution has been removed."],
        "creator-affiliate": ["missing-affiliate-disclosure", "A required affiliate disclosure has been removed."],
        "platform-relationship": ["missing-platform-disclosure", "The platform-relationship disclosure has been removed."],
        "experience-not-universal": ["missing-experience-framing", "The 'experience, not universal' framing has been removed."],
        "translation-caution": ["missing-translation-caution", "A localized asset dropped its translation caution."],
      };
      const [code, message] = map[kind] ?? ["missing-required-disclosure", `A required disclosure (${kind}) has been removed.`];
      err(code, message);
    }
  }

  // machine-draft translation may never be an asset's publication source
  if (localized && !["approved-translation"].includes(asset.provenance.translationStatus))
    err("unapproved-translation-source", "A localized asset must be built from an approved/current translation.");

  // ---- required limitation retained (never broadened/removed) ----
  // Target the SOURCE-BACKED limitation specifically — the experience-not-universal
  // disclosure also emits a limitation-kind block, which must not satisfy this.
  if (currentSource.limitations) {
    const limBlock = asset.blocks.find(
      (b) => b.kind === "limitation" && b.sourceRef?.sourceObjectType === "limitations",
    );
    if (!limBlock) {
      err("required-limitation-removed", "The creator's stated limitation was removed.");
    } else if (limBlock.provenance === "source-backed" && limBlock.text !== currentSource.limitations) {
      // A source-backed limitation must match its source exactly; an edited one is
      // flagged (and must already be marked derivative, checked above).
      warnings.push({ code: "limitation-edited", message: "The limitation text has been edited from the source.", blockId: limBlock.id });
    }
  }

  // ---- exportable content non-empty ----
  const exportable = asset.blocks.filter((b) => b.kind !== "source-note" && b.text.trim());
  if (exportable.length === 0) err("empty-exportable-content", "The asset has no exportable content.");

  return { valid: errors.length === 0, errors, warnings };
}

/** True when the asset may move to `ready` / be exported (valid + not stale). */
export function isExportable(asset: DistributionAsset): boolean {
  return (
    (asset.validation?.valid ?? false) &&
    asset.status !== "stale" &&
    asset.status !== "needs-review" &&
    asset.status !== "archived"
  );
}
