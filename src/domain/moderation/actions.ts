/**
 * Moderation & curation operations (Phase 9) — the ONLY way canonical
 * moderation state changes.
 *
 * Every consequential operation: (1) requires a non-empty rationale, (2) checks
 * that the transition is legal, (3) records the actual prior and resulting
 * status, and (4) appends an immutable `ModerationAction`. Existing actions are
 * never edited or deleted; `seq` gives a total order. Removal changes state but
 * preserves the entry and its history. Escalation means "review required" — it
 * is not an accusation and triggers no external reporting.
 *
 * Each operation returns a NEW store (inputs are treated as immutable) or an
 * error. Timestamps are injected for deterministic tests.
 */
import { promptCanActivate } from "./provenance";
import { canTransitionEntry, requiresReviewedAffirmation } from "./transitions";
import { taxonomyChangeIsValid } from "./taxonomy";
import type {
  EntryStatus,
  FeaturedPlacement,
  FeaturedPlacementSlot,
  FeaturedStatus,
  FeaturedTargetType,
  ModerationAction,
  ModerationActionKind,
  ModerationStore,
  ModerationTargetType,
  PromptStatus,
  TaxonomyTerm,
} from "./types";

/** Honest prototype identity — NOT production authentication. */
export const ADMIN_IDENTITY = "moderation-desk";

export type OpResult =
  | { ok: true; store: ModerationStore; action: ModerationAction }
  | { ok: false; reason: string };

interface ActionSeed {
  actor: string;
  targetType: ModerationTargetType;
  targetId: string;
  action: ModerationActionKind;
  rationale: string;
  policyRuleIds?: string[];
  relatedReportIds?: string[];
  priorStatus: string;
  resultingStatus: string;
}

/** Append an immutable audit action, assigning seq/id/timestamp. */
function appendAction(store: ModerationStore, seed: ActionSeed, now: string): { store: ModerationStore; action: ModerationAction } {
  const seq = store.seq + 1;
  const action: ModerationAction = {
    id: `mod:${seq}`,
    seq,
    actor: seed.actor,
    targetType: seed.targetType,
    targetId: seed.targetId,
    action: seed.action,
    rationale: seed.rationale.trim(),
    policyRuleIds: seed.policyRuleIds ?? [],
    relatedReportIds: seed.relatedReportIds ?? [],
    priorStatus: seed.priorStatus,
    resultingStatus: seed.resultingStatus,
    createdAt: now,
    origin: store.origin === "production-seed" ? "production-seed" : "local-device",
  };
  return { store: { ...store, actions: [...store.actions, action], seq }, action };
}

function needRationale(rationale: string | undefined): string | null {
  return rationale && rationale.trim() ? null : "A rationale is required for this action.";
}

// ------------------------------------------------------------ entry moderation

export interface ModerateEntryInput {
  actor: string;
  entryId: string;
  toStatus: EntryStatus;
  rationale: string;
  policyRuleIds?: string[];
  /** Reports (targeting THIS entry) the actor explicitly chooses to resolve. */
  resolveReportIds?: string[];
  /** Required to clear escalated → approved. */
  reviewedEscalation?: boolean;
}

export function moderateEntry(store: ModerationStore, input: ModerateEntryInput, now: string): OpResult {
  const rErr = needRationale(input.rationale);
  if (rErr) return { ok: false, reason: rErr };

  const entry = store.entries.find((e) => e.id === input.entryId);
  if (!entry) return { ok: false, reason: "Entry not found." };
  if (!canTransitionEntry(entry.status, input.toStatus))
    return { ok: false, reason: `Illegal transition ${entry.status} → ${input.toStatus}.` };
  if (requiresReviewedAffirmation(entry.status, input.toStatus) && !input.reviewedEscalation)
    return { ok: false, reason: "Clearing an escalated entry to approved requires an explicit reviewed affirmation." };

  const prior = entry.status;
  const seq = store.seq + 1;

  // Resolve ONLY the explicitly-selected reports that target this entry.
  const resolveIds = new Set(
    (input.resolveReportIds ?? []).filter((id) =>
      store.reports.some((r) => r.id === id && r.targetId === entry.id && (r.status === "open" || r.status === "reviewing")),
    ),
  );

  const entries = store.entries.map((e) =>
    e.id === entry.id ? { ...e, status: input.toStatus, moderationVersion: seq, updatedAt: now } : e,
  );
  const reports = store.reports.map((r) =>
    resolveIds.has(r.id) ? { ...r, status: "resolved" as const, resolutionActionId: `mod:${seq}`, updatedAt: now } : r,
  );

  const withState: ModerationStore = { ...store, entries, reports };
  const { store: next, action } = appendAction(
    withState,
    {
      actor: input.actor,
      targetType: "roast-entry",
      targetId: entry.id,
      action:
        input.toStatus === "approved"
          ? "approve"
          : input.toStatus === "removed"
            ? "remove"
            : input.toStatus === "escalated"
              ? "escalate"
              : "restore-to-pending",
      rationale: input.rationale,
      policyRuleIds: input.policyRuleIds,
      relatedReportIds: [...resolveIds],
      priorStatus: prior,
      resultingStatus: input.toStatus,
    },
    now,
  );
  return { ok: true, store: next, action };
}

// ------------------------------------------------------------ report resolution

export interface ResolveReportInput {
  actor: string;
  reportId: string;
  dismiss?: boolean;
  rationale: string;
}

export function resolveReport(store: ModerationStore, input: ResolveReportInput, now: string): OpResult {
  const rErr = needRationale(input.rationale);
  if (rErr) return { ok: false, reason: rErr };
  const report = store.reports.find((r) => r.id === input.reportId);
  if (!report) return { ok: false, reason: "Report not found." };
  if (report.status === "resolved" || report.status === "dismissed")
    return { ok: false, reason: "Report is already closed." };

  const prior = report.status;
  const toStatus = input.dismiss ? "dismissed" : "resolved";
  const seq = store.seq + 1;
  const reports = store.reports.map((r) =>
    r.id === report.id ? { ...r, status: toStatus as typeof r.status, resolutionActionId: `mod:${seq}`, updatedAt: now } : r,
  );
  const { store: next, action } = appendAction(
    { ...store, reports },
    {
      actor: input.actor,
      targetType: "report",
      targetId: report.id,
      action: input.dismiss ? "dismiss-report" : "resolve-report",
      rationale: input.rationale,
      relatedReportIds: [report.id],
      priorStatus: prior,
      resultingStatus: toStatus,
    },
    now,
  );
  return { ok: true, store: next, action };
}

// ------------------------------------------------------------ prompt admin

export interface SetPromptStatusInput {
  actor: string;
  promptSlug: string;
  toStatus: PromptStatus;
  rationale: string;
}

const PROMPT_EDGES: Record<PromptStatus, PromptStatus[]> = {
  draft: ["active"],
  active: ["retired"],
  retired: [], // retired prompts stay historically inspectable
};

export function setPromptStatus(store: ModerationStore, input: SetPromptStatusInput, now: string): OpResult {
  const rErr = needRationale(input.rationale);
  if (rErr) return { ok: false, reason: rErr };
  const prompt = store.prompts.find((p) => p.slug === input.promptSlug);
  if (!prompt) return { ok: false, reason: "Prompt not found." };
  if (!PROMPT_EDGES[prompt.status].includes(input.toStatus))
    return { ok: false, reason: `Illegal prompt transition ${prompt.status} → ${input.toStatus}.` };
  if (input.toStatus === "active") {
    const check = promptCanActivate(prompt);
    if (!check.valid) return { ok: false, reason: `Cannot activate: ${check.issues[0]}` };
  }

  const prompts = store.prompts.map((p) =>
    p.slug === prompt.slug ? { ...p, status: input.toStatus, updatedAt: now, version: p.version + 1 } : p,
  );
  const { store: next, action } = appendAction(
    { ...store, prompts },
    {
      actor: input.actor,
      targetType: "roast-prompt",
      targetId: prompt.slug,
      action: input.toStatus === "active" ? "activate-prompt" : "retire-prompt",
      rationale: input.rationale,
      priorStatus: prompt.status,
      resultingStatus: input.toStatus,
    },
    now,
  );
  return { ok: true, store: next, action };
}

// ------------------------------------------------------------ featured curation

export interface FeatureInput {
  actor: string;
  /** Omit to create a new placement. */
  placementId?: string;
  targetType?: FeaturedTargetType;
  targetId?: string;
  placement?: FeaturedPlacementSlot;
  toStatus: FeaturedStatus;
  displayOrder?: number;
  rationale: string;
  startAt?: string;
  endAt?: string;
}

export function setFeatured(store: ModerationStore, input: FeatureInput, now: string): OpResult {
  const rErr = needRationale(input.rationale);
  if (rErr) return { ok: false, reason: rErr };

  const isUnfeature = input.toStatus === "retired" || input.toStatus === "expired";
  const seq = store.seq + 1;
  const actionId = `mod:${seq}`;
  let placement: FeaturedPlacement;
  let prior: string;
  let placements: FeaturedPlacement[];

  if (input.placementId) {
    const existing = store.featured.find((f) => f.id === input.placementId);
    if (!existing) return { ok: false, reason: "Placement not found." };
    prior = existing.status;
    placement = {
      ...existing,
      status: input.toStatus,
      displayOrder: input.displayOrder ?? existing.displayOrder,
      startAt: input.startAt ?? existing.startAt,
      endAt: input.endAt ?? existing.endAt,
      updatedAt: now,
      auditActionIds: [...existing.auditActionIds, actionId],
    };
    placements = store.featured.map((f) => (f.id === placement.id ? placement : f));
  } else {
    if (!input.targetType || !input.targetId || !input.placement)
      return { ok: false, reason: "New placement needs target type, target id, and a placement slot." };
    prior = "none";
    placement = {
      id: `feat:${input.placement}:${input.targetId}`,
      targetType: input.targetType,
      targetId: input.targetId,
      placement: input.placement,
      status: input.toStatus,
      editorialRationale: input.rationale.trim(),
      displayOrder: input.displayOrder ?? store.featured.filter((f) => f.placement === input.placement).length,
      startAt: input.startAt ?? now,
      endAt: input.endAt,
      createdAt: now,
      updatedAt: now,
      auditActionIds: [actionId],
    };
    placements = [...store.featured, placement];
  }

  const { store: next, action } = appendAction(
    { ...store, featured: placements },
    {
      actor: input.actor,
      targetType: "featured-placement",
      targetId: placement.id,
      action: isUnfeature ? "unfeature" : "feature",
      rationale: input.rationale,
      priorStatus: prior,
      resultingStatus: input.toStatus,
    },
    now,
  );
  return { ok: true, store: next, action };
}

// ------------------------------------------------------------ taxonomy admin

export interface TaxonomyOpInput {
  actor: string;
  term: TaxonomyTerm;
  op: "taxonomy-create" | "taxonomy-update" | "taxonomy-deprecate";
  rationale: string;
}

export function mutateTaxonomy(store: ModerationStore, input: TaxonomyOpInput, now: string): OpResult {
  const rErr = needRationale(input.rationale);
  if (rErr) return { ok: false, reason: rErr };

  const exists = store.taxonomy.find((t) => t.id === input.term.id);
  if (input.op === "taxonomy-create" && exists) return { ok: false, reason: "A term with this id already exists." };
  if (input.op !== "taxonomy-create" && !exists) return { ok: false, reason: "Term not found." };

  const seq = store.seq + 1;
  const actionId = `mod:${seq}`;
  const prior = exists ? exists.status : "none";
  const nextTerm: TaxonomyTerm = {
    ...input.term,
    status: input.op === "taxonomy-deprecate" ? "deprecated" : input.term.status,
    updatedAt: now,
    createdAt: exists?.createdAt ?? now,
    auditActionIds: [...(exists?.auditActionIds ?? []), actionId],
  };

  const check = taxonomyChangeIsValid(store.taxonomy, nextTerm);
  if (!check.valid) return { ok: false, reason: check.issues[0] };

  const taxonomy = exists
    ? store.taxonomy.map((t) => (t.id === nextTerm.id ? nextTerm : t))
    : [...store.taxonomy, nextTerm];

  const { store: next, action } = appendAction(
    { ...store, taxonomy },
    {
      actor: input.actor,
      targetType: "taxonomy-term",
      targetId: nextTerm.id,
      action: input.op,
      rationale: input.rationale,
      priorStatus: prior,
      resultingStatus: nextTerm.status,
    },
    now,
  );
  return { ok: true, store: next, action };
}

/** Audit history for a specific target, in immutable sequence order. */
export function auditFor(store: ModerationStore, targetId: string): ModerationAction[] {
  return store.actions.filter((a) => a.targetId === targetId).sort((a, b) => a.seq - b.seq);
}
