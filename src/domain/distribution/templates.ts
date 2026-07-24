/**
 * Deterministic distribution templates (Phase 8).
 *
 * A template organizes SELECTED canonical material, inserts FIXED framing
 * language, preserves exact source-backed statements, exposes editable creator
 * fields, and enforces required disclosures. Templates are pure, channel-aware,
 * locale-aware functions over trusted plan fields. They NEVER call a model and
 * never invent a household result or broaden a limitation.
 *
 * The registry is versioned and replaceable.
 */
import type {
  HouseholdSystem,
  PortableList,
  Provenance,
  SourceType,
} from "../types";
import { blockId } from "./ids";
import { requiredCautions, hasAffiliateOffers } from "./sensitivity";
import type {
  AssetType,
  BlockKind,
  Channel,
  DisclosureKind,
  DistributionContentBlock,
  DistributionDisclosure,
  DistributionSourceRef,
  SourceObjectType,
  SourceSelection,
} from "./types";

export const TEMPLATE_REGISTRY_VERSION = "distribution-templates/2026-07-1";

export type TemplateId =
  | "video-problem-method"
  | "video-one-household-rule"
  | "social-context-method"
  | "social-list-explainer"
  | "pin-practical-system"
  | "newsletter-household-note"
  | "blog-system-story";

export interface TemplateContext {
  system: HouseholdSystem;
  /** Lists belonging to the system (already filtered). */
  lists: PortableList[];
  selection: SourceSelection;
  assetId: string;
  assetLocale: string;
}

export interface DistributionTemplate {
  id: TemplateId;
  version: string;
  assetType: AssetType;
  channels: Channel[];
  /** Block kinds that must exist in a valid asset from this template. */
  requiredBlockKinds: BlockKind[];
  build(ctx: TemplateContext): {
    blocks: DistributionContentBlock[];
    disclosures: DistributionDisclosure[];
  };
}

// --------------------------------------------------------- shared helpers

function provenanceOf(system: HouseholdSystem): SourceType {
  return system.provenance?.sourceType ?? "personal-experience";
}
function localeOf(system: HouseholdSystem): string {
  return system.locale?.sourceLocale ?? "en";
}

function ref(
  system: HouseholdSystem,
  type: SourceObjectType,
  id: string,
  exactText: string,
): DistributionSourceRef {
  return {
    sourceObjectType: type,
    sourceObjectId: id,
    sourceVersion: system.version,
    owningSystemSlug: system.slug,
    exactText,
    sourceLocale: localeOf(system),
    translationStatus: "original",
    provenanceType: provenanceOf(system),
  };
}

function sourceBlock(
  ctx: TemplateContext,
  kind: BlockKind,
  key: string,
  text: string,
  sourceRef: DistributionSourceRef,
  required = false,
): DistributionContentBlock {
  return {
    id: blockId(ctx.assetId, kind, key),
    kind,
    text,
    provenance: "source-backed",
    required,
    editable: true,
    sourceRef,
  };
}

function templateBlock(
  ctx: TemplateContext,
  kind: BlockKind,
  key: string,
  text: string,
  required = false,
  editable = true,
): DistributionContentBlock {
  return {
    id: blockId(ctx.assetId, kind, key),
    kind,
    text,
    provenance: "deterministic-template",
    required,
    editable,
  };
}

/** Source-backed blocks drawn from the creator's selection (exact canonical text). */
function selectedSourceBlocks(ctx: TemplateContext, methodKind: BlockKind): DistributionContentBlock[] {
  const { system, lists, selection } = ctx;
  const blocks: DistributionContentBlock[] = [];

  if (selection.problem && system.problem)
    blocks.push(sourceBlock(ctx, "problem", "problem", system.problem, ref(system, "system-problem", system.slug, system.problem)));

  if (selection.householdContext && system.audience)
    blocks.push(sourceBlock(ctx, "household-context", "context", system.audience, ref(system, "household-context", system.slug, system.audience)));

  for (const i of selection.storyIndices ?? []) {
    const s = system.story[i];
    if (s) blocks.push(sourceBlock(ctx, "creator-experience", `story-${i}`, s.body, ref(system, "story-section", `${system.slug}#story-${i}`, s.body)));
  }

  for (const idKey of selection.listItemIds ?? []) {
    const [listSlug, itemId] = idKey.split("#");
    const list = lists.find((l) => l.slug === listSlug);
    const item = list?.items.find((it) => it.id === itemId);
    if (item) {
      const text = `${item.need} — ${item.quantity}, ${item.recurrence}`;
      blocks.push(sourceBlock(ctx, "list-item", `li-${idKey}`, text, ref(system, "list-item", idKey, text)));
    }
  }

  for (const i of selection.routineIndices ?? []) {
    const r = system.routines[i];
    if (r) {
      const text = `${r.title} (${r.frequency}): ${r.steps.map((s) => `${s.when} — ${s.what}`).join("; ")}`;
      blocks.push(sourceBlock(ctx, methodKind, `routine-${i}`, text, ref(system, "routine", `${system.slug}#routine-${i}`, text)));
    }
  }

  for (const i of selection.recipeIndices ?? []) {
    const rc = system.recipes[i];
    if (rc) {
      const text = `${rc.title} — ${rc.servings}, ${rc.time}`;
      blocks.push(sourceBlock(ctx, methodKind, `recipe-${i}`, text, ref(system, "recipe", `${system.slug}#recipe-${i}`, text)));
    }
  }

  if (selection.observedOutcomes && system.observedResults)
    blocks.push(sourceBlock(ctx, "creator-experience", "observed", system.observedResults, ref(system, "observed-outcome", system.slug, system.observedResults)));

  return blocks;
}

/** Required disclosure + caution blocks derived deterministically from the system. */
function requiredDisclosures(ctx: TemplateContext): {
  disclosures: DistributionDisclosure[];
  blocks: DistributionContentBlock[];
} {
  const { system, lists } = ctx;
  const cautions = requiredCautions(system);
  const affiliate = hasAffiliateOffers(lists);
  const disclosures: DistributionDisclosure[] = [];
  const blocks: DistributionContentBlock[] = [];
  const disc = (kind: DisclosureKind, text: string, required: boolean) => {
    disclosures.push({ id: `dsc:${ctx.assetId}:${kind}`, kind, text, required });
    blocks.push({
      id: blockId(ctx.assetId, kind === "medical-caution" || kind === "developmental-caution" ? "caution" : "disclosure", kind),
      kind: kind === "medical-caution" || kind === "developmental-caution" ? "caution" : kind === "experience-not-universal" ? "limitation" : "disclosure",
      text,
      provenance: "deterministic-template",
      required,
      editable: kind === "creator-affiliate", // disclosure text stays; affiliate note is creator-editable
    });
  };

  // Experience-not-universal framing (all these systems are personal experience).
  disc("experience-not-universal", "This reflects one household's experience and is not a universal instruction — adapt it to your own home.", true);

  if (cautions.medical)
    disc("medical-caution", "This is a household practice, not medical advice. For any medical question, consult a qualified professional.", true);
  if (cautions.developmental)
    disc("developmental-caution", "This is general household information, not individualized developmental guidance. For a specific child, consult a qualified professional.", true);

  if (affiliate) {
    disc("creator-affiliate", system.disclosure ?? "Some retailer links are the creator's affiliate links; purchases may earn the creator a commission. yurrmom.com takes 0%.", true);
    disc("platform-relationship", "yurrmom.com takes no commission on creator affiliate earnings.", true);
  } else {
    disc("no-affiliate", "No affiliate links are included in this asset.", false);
  }

  // Translation caution when the asset locale differs from the source locale.
  if (ctx.assetLocale.split("-")[0] !== localeOf(system).split("-")[0]) {
    disc("translation-caution", "This asset is localized; translation status travels with it and equivalence is not claimed.", true);
  }

  return { disclosures, blocks };
}

/** The mandatory limitation block — preserves the creator's stated limits exactly. */
function limitationBlock(ctx: TemplateContext): DistributionContentBlock | undefined {
  const { system } = ctx;
  if (!system.limitations) return undefined;
  return {
    ...sourceBlock(ctx, "limitation", "limitation", system.limitations, ref(system, "limitations", system.slug, system.limitations), true),
  };
}

function sourceNote(ctx: TemplateContext): DistributionContentBlock {
  const { system } = ctx;
  const creator = system.provenance?.originalAuthorHandle ?? system.creatorHandle;
  return templateBlock(
    ctx,
    "source-note",
    "note",
    `From “${system.title}” (v${system.version}) by ${creator} on yurrmom.com. Household experience, cited to its source.`,
    true,
    false,
  );
}

// --------------------------------------------------------- template builders

function videoTemplate(id: TemplateId, hook: string): DistributionTemplate {
  return {
    id,
    version: TEMPLATE_REGISTRY_VERSION,
    assetType: "short-form-video",
    channels: ["tiktok", "reels", "shorts"],
    requiredBlockKinds: ["hook", "caption", "limitation", "source-note"],
    build(ctx) {
      const { system } = ctx;
      const method = selectedSourceBlocks(ctx, "method");
      const { disclosures, blocks: discBlocks } = requiredDisclosures(ctx);
      const blocks: DistributionContentBlock[] = [
        templateBlock(ctx, "hook", "hook", hook.replace("{title}", system.title)),
        ...(ctx.selection.promise && system.promise
          ? [sourceBlock(ctx, "setup", "promise", system.promise, ref(system, "system-promise", system.slug, system.promise))]
          : []),
        templateBlock(ctx, "on-screen-text", "ost", "One household's method — not a universal rule."),
        ...method.map((b) => ({ ...b, kind: "spoken-line" as BlockKind })),
        templateBlock(ctx, "spoken-line", "close", "That's the system that worked for us."),
        templateBlock(ctx, "caption", "caption", `How one family runs “${system.title}”. Full method + sources on yurrmom.com.`, true),
      ];
      const lim = limitationBlock(ctx);
      if (lim) blocks.push(lim);
      blocks.push(...discBlocks, sourceNote(ctx));
      return { blocks, disclosures };
    },
  };
}

function socialTemplate(id: TemplateId, opener: string, listMode: boolean): DistributionTemplate {
  return {
    id,
    version: TEMPLATE_REGISTRY_VERSION,
    assetType: "social-post",
    channels: ["instagram", "facebook"],
    requiredBlockKinds: ["body", "limitation", "call-to-action", "source-note"],
    build(ctx) {
      const { system } = ctx;
      const method = selectedSourceBlocks(ctx, listMode ? "list-item" : "method");
      const { disclosures, blocks: discBlocks } = requiredDisclosures(ctx);
      const blocks: DistributionContentBlock[] = [
        templateBlock(ctx, "body", "opener", opener.replace("{title}", system.title)),
        ...(ctx.selection.householdContext && system.audience
          ? [sourceBlock(ctx, "household-context", "context", system.audience, ref(system, "household-context", system.slug, system.audience))]
          : []),
        ...method,
        templateBlock(ctx, "call-to-action", "cta", "Full method and sources are on yurrmom.com.", true),
      ];
      const lim = limitationBlock(ctx);
      if (lim) blocks.push(lim);
      blocks.push(...discBlocks, sourceNote(ctx));
      return { blocks, disclosures };
    },
  };
}

const pinTemplate: DistributionTemplate = {
  id: "pin-practical-system",
  version: TEMPLATE_REGISTRY_VERSION,
  assetType: "pinterest-pin",
  channels: ["pinterest"],
  requiredBlockKinds: ["title", "body", "source-note"],
  build(ctx) {
    const { system } = ctx;
    const { disclosures, blocks: discBlocks } = requiredDisclosures(ctx);
    const method = selectedSourceBlocks(ctx, "method");
    const blocks: DistributionContentBlock[] = [
      templateBlock(ctx, "title", "title", system.title),
      templateBlock(ctx, "visual-direction", "visual", "Suggested board: Household Systems. Visual headline reads the system name; no results claimed."),
      ...(ctx.selection.promise && system.promise
        ? [sourceBlock(ctx, "body", "promise", system.promise, ref(system, "system-promise", system.slug, system.promise))]
        : []),
      ...method,
      templateBlock(ctx, "call-to-action", "link", "Read the full system on yurrmom.com."),
    ];
    const lim = limitationBlock(ctx);
    if (lim) blocks.push(lim);
    blocks.push(...discBlocks, sourceNote(ctx));
    return { blocks, disclosures };
  },
};

const newsletterTemplate: DistributionTemplate = {
  id: "newsletter-household-note",
  version: TEMPLATE_REGISTRY_VERSION,
  assetType: "newsletter-section",
  channels: ["newsletter"],
  requiredBlockKinds: ["subject-line", "body", "source-note"],
  build(ctx) {
    const { system } = ctx;
    const { disclosures, blocks: discBlocks } = requiredDisclosures(ctx);
    const method = selectedSourceBlocks(ctx, "method");
    const blocks: DistributionContentBlock[] = [
      templateBlock(ctx, "subject-line", "subject", `One household's take on “${system.title}”`),
      templateBlock(ctx, "preview-text", "preview", "A method that worked for one family — adapt it to yours."),
      templateBlock(ctx, "title", "heading", system.title),
      ...(ctx.selection.problem && system.problem
        ? [sourceBlock(ctx, "body", "problem", system.problem, ref(system, "system-problem", system.slug, system.problem))]
        : []),
      ...method,
      templateBlock(ctx, "call-to-action", "cta", "The full system, with sources, lives on yurrmom.com."),
    ];
    const lim = limitationBlock(ctx);
    if (lim) blocks.push(lim);
    blocks.push(...discBlocks, sourceNote(ctx));
    return { blocks, disclosures };
  },
};

const blogTemplate: DistributionTemplate = {
  id: "blog-system-story",
  version: TEMPLATE_REGISTRY_VERSION,
  assetType: "blog-draft",
  channels: ["blog"],
  requiredBlockKinds: ["title", "body", "limitation", "source-note"],
  build(ctx) {
    const { system } = ctx;
    const { disclosures, blocks: discBlocks } = requiredDisclosures(ctx);
    const method = selectedSourceBlocks(ctx, "method");
    const blocks: DistributionContentBlock[] = [
      templateBlock(ctx, "title", "title", system.title),
      templateBlock(ctx, "body", "intro", "This is one household's system, documented once and shared as experience — not a universal rule."),
      ...(ctx.selection.problem && system.problem
        ? [sourceBlock(ctx, "body", "problem", system.problem, ref(system, "system-problem", system.slug, system.problem))]
        : []),
      ...method,
    ];
    const lim = limitationBlock(ctx);
    if (lim) blocks.push(lim);
    blocks.push(...discBlocks, sourceNote(ctx));
    return { blocks, disclosures };
  },
};

export const DISTRIBUTION_TEMPLATES: Record<TemplateId, DistributionTemplate> = {
  "video-problem-method": videoTemplate("video-problem-method", "The problem with {title} — and the fix."),
  "video-one-household-rule": videoTemplate("video-one-household-rule", "One rule that made {title} work in our house."),
  "social-context-method": socialTemplate("social-context-method", "Here's how one household runs {title}.", false),
  "social-list-explainer": socialTemplate("social-list-explainer", "The list behind {title}, item by item.", true),
  "pin-practical-system": pinTemplate,
  "newsletter-household-note": newsletterTemplate,
  "blog-system-story": blogTemplate,
};

export function getTemplate(id: string): DistributionTemplate | undefined {
  return (DISTRIBUTION_TEMPLATES as Record<string, DistributionTemplate>)[id];
}

/** Templates compatible with a given asset type + channel. */
export function templatesFor(assetType: AssetType, channel: Channel): DistributionTemplate[] {
  return Object.values(DISTRIBUTION_TEMPLATES).filter(
    (t) => t.assetType === assetType && t.channels.includes(channel),
  );
}

export type { Provenance };
