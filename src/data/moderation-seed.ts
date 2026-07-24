/**
 * Seeded moderation state (Phase 9 demonstration).
 *
 * Enough state to exercise the whole workflow: an active fictional prompt with
 * approved entries, a harmless pending submission, an approved entry reported
 * for a real-person boundary, an obviously-SYNTHETIC PII fixture (containing NO
 * real data), an escalated entry, a removed entry (history preserved), an
 * immutable audit trail, featured placements, and taxonomy including an alias
 * and a deprecated-with-replacement term.
 *
 * Fixture separation: this file NEVER contributes to canonical household
 * knowledge, retrieval, or distribution — it is roast/admin state only.
 */
import { currentRoast } from "./roast";
import { MODERATION_POLICY_VERSION } from "@/domain/moderation";
import type {
  FeaturedPlacement,
  ModerationAction,
  ModerationStore,
  Report,
  RoastEntryRecord,
  RoastPromptRecord,
  TaxonomyTerm,
  VoteRecord,
} from "@/domain/moderation";

const T = {
  base: "2026-06-01T09:00:00.000Z",
  e2: "2026-06-02T09:00:00.000Z",
  e3: "2026-06-03T09:00:00.000Z",
  pending: "2026-07-15T09:00:00.000Z",
  escalated: "2026-07-16T09:00:00.000Z",
  pii: "2026-07-17T09:00:00.000Z",
  removed: "2026-07-10T09:00:00.000Z",
  reportReal: "2026-07-18T09:00:00.000Z",
  reportPii: "2026-07-18T10:00:00.000Z",
  reportOld: "2026-06-20T09:00:00.000Z",
  feat: "2026-06-25T09:00:00.000Z",
} as const;

// ------------------------------------------------------------ prompt

const debPrompt: RoastPromptRecord = {
  slug: currentRoast.slug,
  characterName: currentRoast.characterName,
  title: currentRoast.title,
  premise: currentRoast.premise,
  provenance: {
    kind: "synthetic-illustration",
    sourceNote:
      "Deb is an illustrated household archetype drawn for yurrmom.com. She is assembled from common chore-chart tropes, not any real individual.",
    attribution: "yurrmom.com editorial",
    createdDate: "2026-05-01",
    fictionalSubjectAffirmed: true,
    identifiablePersonExcluded: true,
    requiredPublicLabel: currentRoast.fiction.label,
  },
  fictionLabel: currentRoast.fiction.label,
  fictionLabelRequired: true,
  status: "active",
  moderationPolicyVersion: MODERATION_POLICY_VERSION,
  bridges: currentRoast.bridges,
  createdAt: T.base,
  updatedAt: T.base,
  version: 1,
};

// A second prompt kept as a DRAFT with valid provenance (activation demo) and
// one RETIRED prompt (historically inspectable, not publicly discoverable).
const draftPrompt: RoastPromptRecord = {
  slug: "gary-the-group-chat-organizer",
  characterName: "Gary",
  title: "Gary Made a Group Chat for the Group Chat",
  premise: [
    "Meet Gary. Gary made a group chat to coordinate the other group chat.",
    "It has an agenda. The agenda has a sub-agenda. Roast the org chart, not a person.",
  ],
  provenance: {
    kind: "archetype",
    sourceNote: "Gary is a synthetic 'over-organizer' archetype, not a real person.",
    attribution: "yurrmom.com editorial",
    fictionalSubjectAffirmed: true,
    identifiablePersonExcluded: true,
    requiredPublicLabel: "Gary is 100% fictional — an over-organizer archetype, not a real person.",
  },
  fictionLabel: "Gary is 100% fictional — an over-organizer archetype, not a real person.",
  fictionLabelRequired: true,
  status: "draft",
  moderationPolicyVersion: MODERATION_POLICY_VERSION,
  bridges: [],
  createdAt: T.pending,
  updatedAt: T.pending,
  version: 1,
};

// ------------------------------------------------------------ entries

const approvedSeed: RoastEntryRecord[] = currentRoast.entries.map((e, i) => ({
  id: `entry:deb:${e.id}`,
  promptSlug: debPrompt.slug,
  displayAuthor: e.author,
  body: e.body,
  status: "approved",
  baselineScore: e.votes,
  reportIds: [],
  moderationVersion: 0,
  createdAt: i === 1 ? T.e2 : i === 2 ? T.e3 : T.base,
  updatedAt: T.base,
  origin: "production-seed",
}));

const pendingEntry: RoastEntryRecord = {
  id: "entry:deb:pending-1",
  promptSlug: debPrompt.slug,
  localAuthorRef: "local-demo-visitor",
  displayAuthor: "lamination_witness",
  body: "The chart now has a changelog. The changelog is also laminated. Version control has entered the chat.",
  status: "pending",
  baselineScore: 0,
  reportIds: [],
  moderationVersion: 0,
  createdAt: T.pending,
  updatedAt: T.pending,
  origin: "production-seed",
};

const escalatedEntry: RoastEntryRecord = {
  id: "entry:deb:escalated-1",
  promptSlug: debPrompt.slug,
  displayAuthor: "anonymous",
  body: "[Escalated for review] Borderline entry a moderator flagged for a second look before any decision.",
  status: "escalated",
  baselineScore: 0,
  reportIds: [],
  moderationVersion: 3,
  createdAt: T.escalated,
  updatedAt: T.escalated,
  origin: "production-seed",
};

// SYNTHETIC PII fixture — contains NO real person's data. It is pending (never
// public) and carries an urgent pii-or-doxxing report so the removal workflow
// can be demonstrated.
const piiEntry: RoastEntryRecord = {
  id: "entry:deb:pii-fixture",
  promptSlug: debPrompt.slug,
  displayAuthor: "anonymous",
  body: "[SYNTHETIC DOXXING FIXTURE — no real data] This entry would attach a private contact detail for the fictional character. Placeholder only; nothing real is stored.",
  status: "pending",
  baselineScore: 0,
  reportIds: ["report:pii-fixture"],
  moderationVersion: 0,
  createdAt: T.pii,
  updatedAt: T.pii,
  origin: "production-seed",
};

// A REMOVED entry — kept so history is preserved and never erased.
const removedEntry: RoastEntryRecord = {
  id: "entry:deb:removed-1",
  promptSlug: debPrompt.slug,
  displayAuthor: "anonymous",
  body: "[Removed] A cruelty pile-on that was taken down. It stays here in the record; it is not public.",
  status: "removed",
  baselineScore: 0,
  reportIds: [],
  moderationVersion: 2,
  createdAt: T.removed,
  updatedAt: T.removed,
  origin: "production-seed",
};

// ------------------------------------------------------------ votes

const votes: VoteRecord[] = [
  { id: "vote:entry:deb:e1:seed-voter", entryId: "entry:deb:e1", localVoterRef: "seed-voter", value: 1, createdAt: T.base },
];

// ------------------------------------------------------------ reports

const reports: Report[] = [
  {
    id: "report:real-person",
    targetType: "roast-entry",
    targetId: "entry:deb:e4",
    reason: "targets-real-person",
    note: "Reporter believes this points at a specific real individual, not the archetype.",
    localReporterRef: "reporter-a",
    status: "open",
    createdAt: T.reportReal,
    updatedAt: T.reportReal,
  },
  {
    id: "report:pii-fixture",
    targetType: "roast-entry",
    targetId: "entry:deb:pii-fixture",
    reason: "pii-or-doxxing",
    localReporterRef: "reporter-b",
    status: "open",
    createdAt: T.reportPii,
    updatedAt: T.reportPii,
  },
  {
    id: "report:old-resolved",
    targetType: "roast-entry",
    targetId: "entry:deb:removed-1",
    reason: "harassment",
    localReporterRef: "reporter-c",
    status: "resolved",
    createdAt: T.reportOld,
    updatedAt: T.removed,
    resolutionActionId: "mod:4",
  },
];

// ------------------------------------------------------------ audit history

const actions: ModerationAction[] = [
  {
    id: "mod:1",
    seq: 1,
    actor: "moderation-desk",
    targetType: "roast-entry",
    targetId: "entry:deb:e1",
    action: "approve",
    rationale: "On-archetype wit about the chart. No safety concern.",
    policyRuleIds: ["weak-not-unsafe"],
    relatedReportIds: [],
    priorStatus: "pending",
    resultingStatus: "approved",
    createdAt: T.base,
    origin: "production-seed",
  },
  {
    id: "mod:2",
    seq: 2,
    actor: "moderation-desk",
    targetType: "roast-entry",
    targetId: "entry:deb:removed-1",
    action: "remove",
    rationale: "Cruelty pile-on rather than wit; crosses the harassment line.",
    policyRuleIds: ["harassment-cruelty"],
    relatedReportIds: ["report:old-resolved"],
    priorStatus: "approved",
    resultingStatus: "removed",
    createdAt: T.removed,
    origin: "production-seed",
  },
  {
    id: "mod:3",
    seq: 3,
    actor: "moderation-desk",
    targetType: "roast-entry",
    targetId: "entry:deb:escalated-1",
    action: "escalate",
    rationale: "Ambiguous target; needs a second reviewer. Not an accusation.",
    policyRuleIds: ["identifiable-real-person"],
    relatedReportIds: [],
    priorStatus: "pending",
    resultingStatus: "escalated",
    createdAt: T.escalated,
    origin: "production-seed",
  },
  {
    id: "mod:4",
    seq: 4,
    actor: "moderation-desk",
    targetType: "report",
    targetId: "report:old-resolved",
    action: "resolve-report",
    rationale: "Content removed under the harassment rule; report resolved.",
    policyRuleIds: ["harassment-cruelty"],
    relatedReportIds: ["report:old-resolved"],
    priorStatus: "open",
    resultingStatus: "resolved",
    createdAt: T.removed,
    origin: "production-seed",
  },
  {
    id: "mod:5",
    seq: 5,
    actor: "moderation-desk",
    targetType: "featured-placement",
    targetId: "feat:homepage-primary:family-of-six-laundry-line",
    action: "feature",
    rationale: "Clear, well-documented household system; good homepage exemplar. Not an endorsement of any product.",
    policyRuleIds: [],
    relatedReportIds: [],
    priorStatus: "none",
    resultingStatus: "active",
    createdAt: T.feat,
    origin: "production-seed",
  },
];

// ------------------------------------------------------------ featured

const featured: FeaturedPlacement[] = [
  {
    id: "feat:homepage-primary:family-of-six-laundry-line",
    targetType: "household-system",
    targetId: "family-of-six-laundry-line",
    placement: "homepage-primary",
    status: "active",
    editorialRationale: "A clear, well-documented system that shows the platform thesis. Not an endorsement.",
    displayOrder: 0,
    startAt: T.feat,
    createdAt: T.feat,
    updatedAt: T.feat,
    auditActionIds: ["mod:5"],
  },
  {
    id: "feat:creator-spotlight:maya-runs-the-kitchen",
    targetType: "creator",
    targetId: "maya-runs-the-kitchen",
    placement: "creator-spotlight",
    status: "active",
    editorialRationale: "Context-first profile with rigorous provenance. Popularity played no part in this choice.",
    displayOrder: 0,
    startAt: T.feat,
    createdAt: T.feat,
    updatedAt: T.feat,
    auditActionIds: [],
  },
  {
    id: "feat:homepage-secondary:two-am-field-kit",
    targetType: "household-system",
    targetId: "two-am-field-kit",
    placement: "homepage-secondary",
    status: "expired",
    editorialRationale: "Previous seasonal feature; window has ended.",
    displayOrder: 1,
    startAt: "2026-04-01T00:00:00.000Z",
    endAt: "2026-05-01T00:00:00.000Z",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    auditActionIds: [],
  },
];

// ------------------------------------------------------------ taxonomy

const taxonomy: TaxonomyTerm[] = [
  {
    id: "tax:domain:kitchen-food-safety",
    key: "household-domain:kitchen-food-safety",
    facetKey: "household-domain",
    canonicalLabel: "Kitchen & food safety",
    description: "Systems about running a kitchen safely, including dietary constraints.",
    aliases: ["kitchen safety", "food safety"],
    status: "active",
    createdAt: T.base,
    updatedAt: T.base,
    auditActionIds: [],
  },
  {
    id: "tax:circumstance:celiac-child",
    key: "household-circumstance:celiac-child",
    facetKey: "household-circumstance",
    canonicalLabel: "celiac child",
    description: "A household adapting to a child's celiac diagnosis.",
    aliases: ["celiac kid", "coeliac child"], // alias example
    status: "active",
    createdAt: T.base,
    updatedAt: T.base,
    auditActionIds: [],
  },
  {
    id: "tax:constraint:cross-contact",
    key: "constraint:strict-cross-contact-prevention",
    facetKey: "constraint",
    canonicalLabel: "strict cross-contact prevention",
    description: "Constraint requiring strict separation to prevent gluten cross-contact.",
    aliases: [],
    status: "active",
    createdAt: T.base,
    updatedAt: T.base,
    auditActionIds: [],
  },
  {
    id: "tax:devstage:newborn",
    key: "developmental-stage:newborn",
    facetKey: "developmental-stage",
    canonicalLabel: "newborn weeks",
    description: "The newborn stage — night feeds, caregiver recovery.",
    aliases: [],
    status: "active",
    createdAt: T.base,
    updatedAt: T.base,
    auditActionIds: [],
  },
  {
    id: "tax:domain:food-safety-legacy",
    key: "household-domain:food-safety-legacy",
    facetKey: "household-domain",
    canonicalLabel: "Food safety (legacy)",
    description: "Deprecated in favor of the combined kitchen & food safety domain.",
    aliases: [],
    status: "deprecated",
    replacementTermId: "tax:domain:kitchen-food-safety", // deprecated → replacement
    createdAt: T.base,
    updatedAt: T.feat,
    auditActionIds: [],
  },
];

// ------------------------------------------------------------ store

export function buildModerationSeed(): ModerationStore {
  return {
    origin: "production-seed",
    prompts: [debPrompt, draftPrompt],
    entries: [...approvedSeed, pendingEntry, escalatedEntry, piiEntry, removedEntry],
    votes,
    reports,
    actions,
    featured,
    taxonomy,
    seq: 5,
  };
}

export const moderationSeed: ModerationStore = buildModerationSeed();
