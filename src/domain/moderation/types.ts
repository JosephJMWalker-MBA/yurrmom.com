/**
 * Moderation, Curation & Platform Administration — canonical domain (Phase 9).
 *
 * These are the INTERNAL governance objects. The public roast page never
 * consumes them directly; it consumes the deterministic projection produced by
 * `projectPublicRoast` (see ./public). Load-bearing invariants encoded here:
 *
 *  - Roast subjects are fictional BY CONSTRUCTION. `FictionKind` has no
 *    real-person variant, and a prompt cannot activate without valid fiction
 *    provenance.
 *  - New entries default to `pending`. There is no way to construct one as
 *    `approved` — status only moves through audited transitions.
 *  - Every consequential action carries a mandatory rationale and appends an
 *    immutable `ModerationAction`. Removal changes state; it never erases
 *    history.
 *
 * No framework imports belong in this module.
 */

// ------------------------------------------------------------ fiction provenance

/**
 * Fiction provenance kinds. There is deliberately NO `real-person` variant —
 * a roast subject cannot be sourced from an identifiable real person.
 */
export type FictionKind = "synthetic-illustration" | "ai-generated-fiction" | "archetype";

export interface FictionProvenance {
  kind: FictionKind;
  /** How the fictional subject was created; never names a real person. */
  sourceNote: string;
  /** Who authored the fiction — a creator handle or the platform. */
  attribution: string;
  createdDate?: string;
  /** The creator/platform affirms the subject is fictional. */
  fictionalSubjectAffirmed: boolean;
  /** …and affirms it does not target an identifiable real person. */
  identifiablePersonExcluded: boolean;
  /** The label the public page MUST show. */
  requiredPublicLabel: string;
}

// ------------------------------------------------------------ roast prompt

export type PromptStatus = "draft" | "active" | "retired";

export interface RoastBridgeRecord {
  label: string;
  href: string;
  blurb: string;
}

export interface RoastPromptRecord {
  slug: string;
  characterName: string;
  title: string;
  premise: string[];
  provenance: FictionProvenance;
  /** Convenience label required to be shown publicly (mirrors provenance). */
  fictionLabel: string;
  fictionLabelRequired: boolean;
  status: PromptStatus;
  /** Which moderation policy version governs this prompt. */
  moderationPolicyVersion: string;
  bridges: RoastBridgeRecord[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ------------------------------------------------------------ roast entry

export type EntryStatus = "pending" | "approved" | "removed" | "escalated";

export interface RoastEntryRecord {
  id: string;
  promptSlug: string;
  /** Local-device author reference (never shown publicly). */
  localAuthorRef?: string;
  /** The chosen display name (may be a handle or "anonymous"). */
  displayAuthor: string;
  body: string;
  status: EntryStatus;
  /**
   * Pre-existing community engagement carried from the seed. Live votes are
   * recorded as VoteRecords and ADDED to this; the public score is always
   * derived (see deriveVoteScore), never stored.
   */
  baselineScore: number;
  reportIds: string[];
  /** The moderation action version that last touched this entry (audit link). */
  moderationVersion: number;
  createdAt: string;
  updatedAt: string;
  origin: "production-seed" | "local-device";
}

// ------------------------------------------------------------ votes

export interface VoteRecord {
  id: string;
  entryId: string;
  /** Local-device voter reference — one vote per entry per device. */
  localVoterRef: string;
  value: 1;
  createdAt: string;
}

// ------------------------------------------------------------ reports

export type ReportTargetType = "roast-entry" | "roast-prompt";

export type ReportReason =
  | "targets-real-person"
  | "hate-or-protected-trait"
  | "harassment"
  | "sexual-content"
  | "minor-safety"
  | "pii-or-doxxing"
  | "threat-or-violence"
  | "spam-or-manipulation"
  | "other";

export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  /** Optional plain-language note from the reporter (never public). */
  note?: string;
  /** Local-device reporter reference — never shown publicly. */
  localReporterRef: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  /** The moderation action that resolved/dismissed this report, when set. */
  resolutionActionId?: string;
}

// ------------------------------------------------------------ moderation policy

export interface ModerationPolicyRule {
  id: string;
  version: string;
  title: string;
  description: string;
  possibleActions: ModerationActionKind[];
  reviewerQuestions: string[];
  rationaleGuidance: string;
}

// ------------------------------------------------------------ moderation actions

export type ModerationActionKind =
  | "approve"
  | "remove"
  | "escalate"
  | "restore-to-pending"
  | "retire-prompt"
  | "activate-prompt"
  | "resolve-report"
  | "dismiss-report"
  | "feature"
  | "unfeature"
  | "taxonomy-create"
  | "taxonomy-update"
  | "taxonomy-deprecate";

export type ModerationTargetType =
  | "roast-entry"
  | "roast-prompt"
  | "report"
  | "featured-placement"
  | "taxonomy-term";

/**
 * An append-only audit event. Once written it is never edited or deleted.
 * `seq` gives an immutable total order; current state is derived by replaying
 * or by the repository's maintained projection, but these events are the record.
 */
export interface ModerationAction {
  id: string;
  seq: number;
  actor: string;
  targetType: ModerationTargetType;
  targetId: string;
  action: ModerationActionKind;
  rationale: string;
  policyRuleIds: string[];
  relatedReportIds: string[];
  priorStatus: string;
  resultingStatus: string;
  createdAt: string;
  origin: "production-seed" | "local-device";
}

// ------------------------------------------------------------ featured curation

export type FeaturedTargetType =
  | "household-system"
  | "creator"
  | "roast-prompt"
  | "merchandise-item";

export type FeaturedPlacementSlot =
  | "homepage-primary"
  | "homepage-secondary"
  | "find-help"
  | "creator-spotlight"
  | "roast-bridge";

export type FeaturedStatus = "draft" | "active" | "expired" | "retired";

export interface FeaturedPlacement {
  id: string;
  targetType: FeaturedTargetType;
  targetId: string;
  placement: FeaturedPlacementSlot;
  status: FeaturedStatus;
  editorialRationale: string;
  displayOrder: number;
  startAt: string;
  endAt?: string;
  createdAt: string;
  updatedAt: string;
  auditActionIds: string[];
}

// ------------------------------------------------------------ taxonomy

export type TaxonomyStatus = "active" | "deprecated" | "draft";

export interface TaxonomyTerm {
  id: string;
  /** Canonical key, e.g. "household-domain:kitchen-food-safety". Unique. */
  key: string;
  /** The facet family this term belongs to (matches FacetKey values). */
  facetKey: string;
  canonicalLabel: string;
  description: string;
  aliases: string[];
  status: TaxonomyStatus;
  replacementTermId?: string;
  createdAt: string;
  updatedAt: string;
  auditActionIds: string[];
}

// ------------------------------------------------------------ integrations

export type IntegrationCapability =
  | "connected-publishable"
  | "connected-export-only"
  | "manual-copy"
  | "link-only"
  | "export-only"
  | "planned"
  | "unavailable";

export interface IntegrationDescriptor {
  id: string;
  label: string;
  domain: string;
  capability: IntegrationCapability;
  implementationType: "none" | "manual" | "local-only" | "adapter-stub" | "live-guarded";
  environment: "local-device" | "server-guarded";
  userFacingBehavior: string;
  missingRequirements: string[];
  lastCheckedAt?: string;
  /** Boolean only — never a value, fragment, or variable name with content. */
  credentialsConfigured: boolean;
  productionAllowed: boolean;
}

// ------------------------------------------------------------ store

/** The full device-local moderation store. Public projection never reads this. */
export interface ModerationStore {
  origin: "production-seed" | "local-device";
  prompts: RoastPromptRecord[];
  entries: RoastEntryRecord[];
  votes: VoteRecord[];
  reports: Report[];
  /** Append-only. */
  actions: ModerationAction[];
  featured: FeaturedPlacement[];
  taxonomy: TaxonomyTerm[];
  /** Monotonic action sequence counter. */
  seq: number;
}

// ------------------------------------------------------------ public projection

export interface PublicRoastEntry {
  id: string;
  author: string;
  body: string;
  /** Derived score (baseline + live votes). Never a stored field. */
  score: number;
}

export interface PublicRoast {
  slug: string;
  characterName: string;
  title: string;
  premise: string[];
  fictionLabel: string;
  bridges: RoastBridgeRecord[];
  entries: PublicRoastEntry[];
}

// ------------------------------------------------------------ queue

export type PriorityBand = "urgent" | "high" | "normal" | "low";

export interface QueueItem {
  id: string;
  kind: "entry" | "report" | "prompt";
  targetType: ModerationTargetType;
  targetId: string;
  band: PriorityBand;
  /** Human-readable explanation of why this band was assigned. */
  reason: string;
  /** Sort key: the unresolved-since timestamp (oldest first within a band). */
  since: string;
  /** Optional linked report for report-derived items. */
  reportId?: string;
}
