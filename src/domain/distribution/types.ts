/**
 * Content Studio & Honest Distribution — domain types (Phase 8).
 *
 * A HouseholdSystem is CANONICAL. A DistributionAsset is a DERIVATIVE: a
 * channel-specific expression of selected canonical material. A derivative
 * never overwrites the canonical system, never becomes a new source of truth,
 * never loses its provenance, never invents a result, never broadens a
 * limitation, never removes a required disclosure, and never presents
 * translated or edited text as the creator's original words.
 *
 * No framework imports belong in this module.
 */
import type { SourceType } from "../types";

// ------------------------------------------------------------ channels / types

export type AssetType =
  | "short-form-video"
  | "social-post"
  | "pinterest-pin"
  | "newsletter-section"
  | "blog-draft";

export type Channel =
  | "tiktok"
  | "reels"
  | "shorts"
  | "instagram"
  | "facebook"
  | "pinterest"
  | "newsletter"
  | "blog";

export type DistributionAssetStatus =
  | "draft"
  | "ready"
  | "exported"
  | "needs-review"
  | "stale"
  | "archived";

// ------------------------------------------------------------ source refs

/** Which canonical field a block was drawn from. */
export type SourceObjectType =
  | "system-promise"
  | "system-problem"
  | "household-context"
  | "story-section"
  | "list-item"
  | "routine"
  | "recipe"
  | "observed-outcome"
  | "limitations"
  | "applicability"
  | "creator-disclosure";

/** A traceable pointer to exact canonical material at a specific version. */
export interface DistributionSourceRef {
  sourceObjectType: SourceObjectType;
  sourceObjectId: string; // slug, "story-0", "listSlug#itemId", etc.
  sourceVersion: number;
  owningSystemSlug: string;
  /** Exact canonical text captured at selection time. */
  exactText: string;
  sourceLocale: string;
  /** "original" or a translation status label. */
  translationStatus: string;
  provenanceType: SourceType;
}

// ------------------------------------------------------------ blocks

export type BlockKind =
  | "hook"
  | "title"
  | "setup"
  | "household-context"
  | "problem"
  | "method"
  | "step"
  | "list-item"
  | "creator-experience"
  | "caution"
  | "limitation"
  | "disclosure"
  | "call-to-action"
  | "caption"
  | "visual-direction"
  | "spoken-line"
  | "on-screen-text"
  | "subject-line"
  | "preview-text"
  | "body"
  | "source-note";

/**
 * How a block's text is authored. `source-backed` means exact canonical text
 * (traceable, quotable). Editing a source-backed block flips it to
 * `creator-authored-derivative` and drops the exact-quote claim.
 */
export type BlockProvenance =
  | "source-backed"
  | "creator-authored"
  | "creator-authored-derivative"
  | "deterministic-template"
  | "translated-derivative";

export interface DistributionContentBlock {
  id: string;
  kind: BlockKind;
  text: string;
  provenance: BlockProvenance;
  required: boolean;
  editable: boolean;
  /** Present for source-backed / derivative blocks — the canonical origin. */
  sourceRef?: DistributionSourceRef;
  /** True once a source-backed block has been edited (exact match no longer holds). */
  editedFromExact?: boolean;
  /** Human note shown in the editor (never in exports unless part of text). */
  label?: string;
}

// ------------------------------------------------------------ disclosures

export type DisclosureKind =
  | "creator-affiliate"
  | "platform-relationship"
  | "product-affiliate"
  | "no-affiliate"
  | "medical-caution"
  | "developmental-caution"
  | "experience-not-universal"
  | "translation-caution";

export interface DistributionDisclosure {
  id: string;
  kind: DisclosureKind;
  /** Exact disclosure text — cannot be silently removed from a valid asset. */
  text: string;
  required: boolean;
}

// ------------------------------------------------------------ provenance

export interface AssetProvenance {
  creatorHandle: string;
  sourceSystemSlug: string;
  sourceSystemVersion: number;
  sourceLocale: string;
  assetLocale: string;
  /** "original" | "approved-translation" | (inspection-only statuses never publish). */
  translationStatus: string;
  translationSourceVersion?: number;
  translatorAttribution?: string;
  reviewState: "unreviewed" | "creator-reviewed" | "needs-review";
  cautionNotes: string[];
}

// ------------------------------------------------------------ validation

export interface AssetValidationIssue {
  code: string;
  message: string;
  blockId?: string;
}

export interface AssetValidationResult {
  valid: boolean;
  errors: AssetValidationIssue[];
  warnings: AssetValidationIssue[];
}

// ------------------------------------------------------------ the asset

export interface DistributionAsset {
  id: string;
  creatorHandle: string;
  sourceSystemSlug: string;
  sourceSystemVersion: number;
  sourceLocale: string;
  assetLocale: string;
  assetType: AssetType;
  channel: Channel;
  templateId: string;
  templateVersion: string;
  internalName: string;
  status: DistributionAssetStatus;
  sourceRefs: DistributionSourceRef[];
  blocks: DistributionContentBlock[];
  disclosures: DistributionDisclosure[];
  /** Disclosure kinds the source required at creation — cannot be removed. */
  requiredDisclosureKinds: DisclosureKind[];
  provenance: AssetProvenance;
  createdAt: string;
  updatedAt: string;
  exportedAt?: string;
  /** Honest label — local editorial data is never presented as globally published. */
  origin: "production-seed" | "local-device";
  validation?: AssetValidationResult;
}

// ------------------------------------------------------------ destinations

/** Honest destination capability states (Phase 8). No external publish exists. */
export type DestinationCapability =
  | "manual-copy"
  | "export-only"
  | "planned"
  | "unavailable"
  | "connected-draft-only"
  | "connected-publishable";

export interface DestinationDescriptor {
  id: string;
  name: string;
  capability: DestinationCapability;
  /** Honest copy shown wherever the boundary appears. */
  note: string;
}

// ------------------------------------------------------------ source selection

/** What the creator picked from their canonical system. */
export interface SourceSelection {
  promise?: boolean;
  problem?: boolean;
  householdContext?: boolean;
  storyIndices?: number[];
  listItemIds?: string[]; // "listSlug#itemId"
  routineIndices?: number[];
  recipeIndices?: number[];
  observedOutcomes?: boolean;
  limitations?: boolean;
  applicability?: boolean;
  disclosure?: boolean;
}
