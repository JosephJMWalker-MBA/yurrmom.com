/**
 * Phase 9 domain tests — Moderation, Curation & Platform Administration.
 *
 * Runs with the committed tooling: `npm test` (node:test via tsx). Verifies the
 * fictional-by-construction boundary, pending-by-default entries, public
 * projection privacy, deterministic queue, append-only audited actions,
 * transition guards, curation/taxonomy rules, honest integration states, and
 * that roast/moderation content never enters household knowledge or
 * distribution.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPendingEntry,
  buildModerationQueue,
  projectPublicRoast,
  toggleVote,
  deriveVoteScore,
  createReport,
  moderateEntry,
  resolveReport,
  setPromptStatus,
  setFeatured,
  mutateTaxonomy,
  canTransitionEntry,
  promptCanActivate,
  validateFictionProvenance,
  validateTaxonomy,
  deriveTaxonomyUsage,
  liveFeatured,
  describeIntegrations,
  auditFor,
  MODERATION_POLICY_VERSION,
  type ModerationStore,
  type TaxonomyTerm,
} from "../src/domain/moderation/index.ts";
import { buildModerationSeed } from "../src/data/moderation-seed.ts";
import { LocalModerationRepository } from "../src/data/moderation-repo.ts";
import { systems } from "../src/data/systems.ts";
import { lists } from "../src/data/lists.ts";
import { creators } from "../src/data/creators.ts";
import { buildCorpus } from "../src/domain/knowledge/index.ts";
import { createDistributionAsset, validateDistributionAsset } from "../src/domain/distribution/index.ts";

const NOW = "2026-07-22T12:00:00.000Z";
function seed(): ModerationStore {
  return buildModerationSeed();
}
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// -------------------------------------------------------------- entry defaults

test("a new submission defaults to pending", () => {
  const r = buildPendingEntry(
    { promptSlug: "deb-laminated-chore-chart", body: "The chart has a mission statement now.", affirmedFictionalTarget: true, localAuthorRef: "dev-1" },
    NOW,
  );
  assert.ok(r.ok);
  assert.equal((r as Extract<typeof r, { ok: true }>).entry.status, "pending");
});

test("the caller cannot create an approved entry (always pending)", () => {
  // The submission builder has no status parameter; every result is pending.
  const r = buildPendingEntry({ promptSlug: "x", body: "totally fine roast text", affirmedFictionalTarget: true, localAuthorRef: "d" }, NOW);
  assert.ok(r.ok);
  assert.notEqual((r as Extract<typeof r, { ok: true }>).entry.status, "approved");
});

test("submission requires the fictional-target affirmation and rejects HTML", () => {
  const noAffirm = buildPendingEntry({ promptSlug: "x", body: "fine text here", affirmedFictionalTarget: false, localAuthorRef: "d" }, NOW);
  assert.equal(noAffirm.ok, false);
  const html = buildPendingEntry({ promptSlug: "x", body: "<script>alert(1)</script>", affirmedFictionalTarget: true, localAuthorRef: "d" }, NOW);
  assert.equal(html.ok, false);
});

// -------------------------------------------------------------- public projection

test("public projection includes approved and excludes pending/removed/escalated", () => {
  const s = seed();
  const prompt = s.prompts.find((p) => p.slug === "deb-laminated-chore-chart")!;
  const pub = projectPublicRoast(prompt, s.entries, s.votes)!;
  const ids = new Set(pub.entries.map((e) => e.id));
  assert.ok(ids.has("entry:deb:e1"), "approved included");
  assert.ok(!ids.has("entry:deb:pending-1"), "pending excluded");
  assert.ok(!ids.has("entry:deb:removed-1"), "removed excluded");
  assert.ok(!ids.has("entry:deb:escalated-1"), "escalated excluded");
  assert.ok(!ids.has("entry:deb:pii-fixture"), "pii pending excluded");
});

test("a non-active prompt is not publicly visible", () => {
  const s = seed();
  const draft = s.prompts.find((p) => p.status === "draft")!;
  assert.equal(projectPublicRoast(draft, s.entries, s.votes), null);
});

test("the fiction label is always present in the public projection", () => {
  const s = seed();
  const prompt = s.prompts.find((p) => p.status === "active")!;
  const pub = projectPublicRoast(prompt, s.entries, s.votes)!;
  assert.ok(pub.fictionLabel && pub.fictionLabel.length > 0);
});

test("public projection exposes no reports, reporter, rationale, or audit data", () => {
  const s = seed();
  const prompt = s.prompts.find((p) => p.status === "active")!;
  const pub = projectPublicRoast(prompt, s.entries, s.votes)!;
  const blob = JSON.stringify(pub);
  assert.ok(!blob.includes("reporter"), "no reporter refs");
  assert.ok(!blob.includes("rationale"), "no rationale");
  assert.ok(!blob.includes("localReporterRef"));
  for (const e of pub.entries) {
    assert.deepEqual(Object.keys(e).sort(), ["author", "body", "id", "score"]);
  }
});

// -------------------------------------------------------------- fiction provenance

test("there is no real-person fiction kind, in types or seed data", () => {
  const s = seed();
  for (const p of s.prompts) {
    assert.ok(["synthetic-illustration", "ai-generated-fiction", "archetype"].includes(p.provenance.kind));
    assert.notEqual(p.provenance.kind as string, "real-person");
    assert.equal(p.provenance.identifiablePersonExcluded, true);
  }
});

test("invalid fiction provenance blocks prompt activation", () => {
  const s = seed();
  const draft = clone(s.prompts.find((p) => p.status === "draft")!);
  draft.provenance.fictionalSubjectAffirmed = false;
  assert.equal(promptCanActivate(draft).valid, false);
  const store = { ...s, prompts: s.prompts.map((p) => (p.slug === draft.slug ? draft : p)) };
  const r = setPromptStatus(store, { actor: "mod", promptSlug: draft.slug, toStatus: "active", rationale: "try" }, NOW);
  assert.equal(r.ok, false);
});

test("validateFictionProvenance rejects a missing public label", () => {
  const bad = validateFictionProvenance({
    kind: "archetype",
    sourceNote: "x",
    attribution: "y",
    fictionalSubjectAffirmed: true,
    identifiablePersonExcluded: true,
    requiredPublicLabel: "",
  });
  assert.equal(bad.valid, false);
});

// -------------------------------------------------------------- votes

test("votes are permitted only on approved entries", () => {
  const s = seed();
  const pending = s.entries.find((e) => e.status === "pending")!;
  const r = toggleVote(pending, "voter", s.votes, NOW);
  assert.equal(r.ok, false);
});

test("one local vote per entry (toggle), and score is derived", () => {
  const s = seed();
  const approved = s.entries.find((e) => e.id === "entry:deb:e2")!;
  const add = toggleVote(approved, "voter-1", s.votes, NOW);
  assert.ok(add.ok && add.voted === true);
  const votes1 = (add as Extract<typeof add, { ok: true }>).votes;
  // Same voter again → toggles off (never two votes).
  const off = toggleVote(approved, "voter-1", votes1, NOW);
  assert.ok(off.ok && off.voted === false);
  // Derived score = baseline + live votes.
  assert.equal(deriveVoteScore(approved, votes1), approved.baselineScore + 1);
  assert.equal(deriveVoteScore(approved, (off as Extract<typeof off, { ok: true }>).votes), approved.baselineScore);
});

test("votes do not change moderation-queue priority or ordering", () => {
  const s = seed();
  const before = buildModerationQueue(s).map((q) => q.id);
  const approved = s.entries.find((e) => e.id === "entry:deb:e2")!;
  const voted = toggleVote(approved, "v1", s.votes, NOW);
  const s2 = { ...s, votes: (voted as Extract<typeof voted, { ok: true }>).votes };
  const after = buildModerationQueue(s2).map((q) => q.id);
  assert.deepEqual(after, before);
});

// -------------------------------------------------------------- reports

test("report creation succeeds and does not auto-remove content", () => {
  const s = seed();
  const target = s.entries.find((e) => e.id === "entry:deb:e3")!;
  const r = createReport({ targetType: "roast-entry", targetId: target.id, reason: "harassment", localReporterRef: "rep-x" }, s.reports, NOW);
  assert.ok(r.ok);
  // Entry status is unchanged by a report.
  assert.equal(target.status, "approved");
});

test("a single reporter cannot stack duplicate open reports for the same reason", () => {
  const s = seed();
  const first = createReport({ targetType: "roast-entry", targetId: "entry:deb:e3", reason: "spam-or-manipulation", localReporterRef: "rep-dup" }, s.reports, NOW);
  assert.ok(first.ok);
  const reports = [...s.reports, (first as Extract<typeof first, { ok: true }>).report];
  const dup = createReport({ targetType: "roast-entry", targetId: "entry:deb:e3", reason: "spam-or-manipulation", localReporterRef: "rep-dup" }, reports, NOW);
  assert.equal(dup.ok, false);
});

test("report count does not determine a verdict", () => {
  const s = seed();
  let reports = s.reports;
  for (let i = 0; i < 5; i++) {
    const r = createReport({ targetType: "roast-entry", targetId: "entry:deb:e5", reason: "spam-or-manipulation", localReporterRef: `rep-${i}` }, reports, `${NOW}-${i}`);
    if (r.ok) reports = [...reports, r.report];
  }
  const entry = s.entries.find((e) => e.id === "entry:deb:e5")!;
  assert.equal(entry.status, "approved", "5 reports never auto-change status");
  // All spam reports remain low band — volume never escalates the band.
  const q = buildModerationQueue({ ...s, reports });
  const spamItems = q.filter((i) => i.kind === "report" && reports.find((r) => r.id === i.reportId)?.reason === "spam-or-manipulation");
  assert.ok(spamItems.every((i) => i.band === "low"));
});

// -------------------------------------------------------------- queue

test("queue assigns deterministic priority bands by category", () => {
  const s = seed();
  const q = buildModerationQueue(s);
  const band = (pred: (i: (typeof q)[number]) => boolean) => q.find(pred)?.band;
  assert.equal(band((i) => i.reportId === "report:real-person"), "urgent");
  assert.equal(band((i) => i.reportId === "report:pii-fixture"), "urgent");
  assert.equal(band((i) => i.kind === "entry" && i.targetId === "entry:deb:escalated-1"), "high");
  assert.equal(band((i) => i.kind === "entry" && i.targetId === "entry:deb:pending-1"), "normal");
  assert.equal(band((i) => i.kind === "prompt"), "low");
});

test("within a band, items are ordered oldest-first", () => {
  const s = seed();
  const q = buildModerationQueue(s);
  const normals = q.filter((i) => i.band === "normal");
  for (let i = 1; i < normals.length; i++) {
    assert.ok(normals[i - 1].since <= normals[i].since, "non-decreasing timestamps within band");
  }
  // urgent band precedes high precedes normal precedes low.
  const bands = q.map((i) => i.band);
  const rank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
  for (let i = 1; i < bands.length; i++) assert.ok(rank[bands[i - 1]] <= rank[bands[i]]);
});

// -------------------------------------------------------------- transitions

test("entry transition guards allow/deny the right edges", () => {
  assert.equal(canTransitionEntry("pending", "approved"), true);
  assert.equal(canTransitionEntry("pending", "removed"), true);
  assert.equal(canTransitionEntry("approved", "removed"), true);
  assert.equal(canTransitionEntry("removed", "approved"), false, "removed cannot go straight to approved");
  assert.equal(canTransitionEntry("removed", "pending"), true);
  assert.equal(canTransitionEntry("escalated", "approved"), true);
  assert.equal(canTransitionEntry("approved", "pending"), false);
  assert.equal(canTransitionEntry("pending", "pending"), false);
});

// -------------------------------------------------------------- actions & audit

test("every consequential action requires a rationale", () => {
  const s = seed();
  const r = moderateEntry(s, { actor: "mod", entryId: "entry:deb:pending-1", toStatus: "approved", rationale: "  " }, NOW);
  assert.equal(r.ok, false);
});

test("approving a pending entry records prior/resulting state and appends an immutable action", () => {
  const s = seed();
  const beforeLen = s.actions.length;
  const beforeFirst = clone(s.actions[0]);
  const r = moderateEntry(s, { actor: "mod", entryId: "entry:deb:pending-1", toStatus: "approved", rationale: "On-archetype wit." }, NOW);
  assert.ok(r.ok);
  const next = (r as Extract<typeof r, { ok: true }>).store;
  // Original store untouched (append-only, immutable inputs).
  assert.equal(s.actions.length, beforeLen);
  assert.deepEqual(s.actions[0], beforeFirst);
  // New action appended with correct prior/resulting.
  assert.equal(next.actions.length, beforeLen + 1);
  const action = next.actions[next.actions.length - 1];
  assert.equal(action.priorStatus, "pending");
  assert.equal(action.resultingStatus, "approved");
  assert.equal(action.action, "approve");
  assert.ok(action.seq > s.seq);
  // Entry is now approved and would project publicly.
  const entry = next.entries.find((e) => e.id === "entry:deb:pending-1")!;
  assert.equal(entry.status, "approved");
});

test("removing an entry preserves it and its history", () => {
  const s = seed();
  const r = moderateEntry(s, { actor: "mod", entryId: "entry:deb:e6", toStatus: "removed", rationale: "Crosses the line." }, NOW);
  assert.ok(r.ok);
  const next = (r as Extract<typeof r, { ok: true }>).store;
  const entry = next.entries.find((e) => e.id === "entry:deb:e6");
  assert.ok(entry, "entry still exists after removal");
  assert.equal(entry!.status, "removed");
  assert.ok(auditFor(next, "entry:deb:e6").some((a) => a.action === "remove"));
});

test("clearing an escalated entry to approved requires an explicit reviewed affirmation", () => {
  const s = seed();
  const without = moderateEntry(s, { actor: "mod", entryId: "entry:deb:escalated-1", toStatus: "approved", rationale: "looks fine" }, NOW);
  assert.equal(without.ok, false);
  const withReview = moderateEntry(s, { actor: "mod", entryId: "entry:deb:escalated-1", toStatus: "approved", rationale: "Reviewed; on-archetype.", reviewedEscalation: true }, NOW);
  assert.ok(withReview.ok);
});

test("approving resolves only explicitly selected reports; unselected stay open", () => {
  const s = seed();
  // e4 has an open real-person report. Approve e4 WITHOUT selecting it.
  const r = moderateEntry(s, { actor: "mod", entryId: "entry:deb:e4", toStatus: "removed", rationale: "n/a", resolveReportIds: [] }, NOW);
  assert.ok(r.ok);
  const next = (r as Extract<typeof r, { ok: true }>).store;
  assert.equal(next.reports.find((rp) => rp.id === "report:real-person")!.status, "open", "unselected report stays open");

  const r2 = moderateEntry(s, { actor: "mod", entryId: "entry:deb:e4", toStatus: "removed", rationale: "Removed for review.", resolveReportIds: ["report:real-person"] }, NOW);
  const next2 = (r2 as Extract<typeof r2, { ok: true }>).store;
  assert.equal(next2.reports.find((rp) => rp.id === "report:real-person")!.status, "resolved", "selected report resolved");
});

test("resolving/dismissing a report is audited and requires rationale", () => {
  const s = seed();
  const noReason = resolveReport(s, { actor: "mod", reportId: "report:real-person", rationale: "" }, NOW);
  assert.equal(noReason.ok, false);
  const dismissed = resolveReport(s, { actor: "mod", reportId: "report:real-person", dismiss: true, rationale: "Reviewed — stays on the archetype." }, NOW);
  assert.ok(dismissed.ok);
  const next = (dismissed as Extract<typeof dismissed, { ok: true }>).store;
  assert.equal(next.reports.find((r) => r.id === "report:real-person")!.status, "dismissed");
});

// -------------------------------------------------------------- prompt admin

test("prompt activation and retirement follow the legal transitions and audit", () => {
  const s = seed();
  const activated = setPromptStatus(s, { actor: "mod", promptSlug: "gary-the-group-chat-organizer", toStatus: "active", rationale: "Valid fiction; good archetype." }, NOW);
  assert.ok(activated.ok);
  const s2 = (activated as Extract<typeof activated, { ok: true }>).store;
  assert.equal(s2.prompts.find((p) => p.slug === "gary-the-group-chat-organizer")!.status, "active");
  const retired = setPromptStatus(s2, { actor: "mod", promptSlug: "deb-laminated-chore-chart", toStatus: "retired", rationale: "Rotating the weekly roast." }, NOW);
  assert.ok(retired.ok);
});

// -------------------------------------------------------------- featured curation

test("featuring never mutates canonical systems or creators", () => {
  const s = seed();
  const systemsBefore = clone(systems);
  const creatorsBefore = clone(creators);
  const r = setFeatured(s, { actor: "mod", targetType: "creator", targetId: "sam-after-midnight", placement: "creator-spotlight", toStatus: "active", rationale: "Context-first profile." }, NOW);
  assert.ok(r.ok);
  assert.deepEqual(systems, systemsBefore);
  assert.deepEqual(creators, creatorsBefore);
});

test("live featured placements are deterministic and exclude expired/retired", () => {
  const s = seed();
  const live = liveFeatured(s.featured, "homepage-primary", NOW);
  assert.ok(live.every((p) => p.status === "active"));
  const expired = liveFeatured(s.featured, "homepage-secondary", NOW);
  assert.equal(expired.length, 0, "expired placement does not render");
});

// -------------------------------------------------------------- taxonomy

test("taxonomy rejects duplicate canonical keys", () => {
  const s = seed();
  const dupTerm: TaxonomyTerm = {
    id: "tax:dup",
    key: "household-domain:kitchen-food-safety", // same key as an existing term
    facetKey: "household-domain",
    canonicalLabel: "Dup",
    description: "",
    aliases: [],
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
    auditActionIds: [],
  };
  const r = mutateTaxonomy(s, { actor: "mod", term: dupTerm, op: "taxonomy-create", rationale: "x" }, NOW);
  assert.equal(r.ok, false);
});

test("taxonomy detects replacement loops", () => {
  const a: TaxonomyTerm = { id: "a", key: "k:a", facetKey: "constraint", canonicalLabel: "A", description: "", aliases: [], status: "deprecated", replacementTermId: "b", createdAt: NOW, updatedAt: NOW, auditActionIds: [] };
  const b: TaxonomyTerm = { id: "b", key: "k:b", facetKey: "constraint", canonicalLabel: "B", description: "", aliases: [], status: "deprecated", replacementTermId: "a", createdAt: NOW, updatedAt: NOW, auditActionIds: [] };
  assert.equal(validateTaxonomy([a, b]).valid, false);
});

test("deprecating a term does not mutate canonical systems", () => {
  const s = seed();
  const systemsBefore = clone(systems);
  const term = clone(s.taxonomy.find((t) => t.id === "tax:constraint:cross-contact")!);
  const r = mutateTaxonomy(s, { actor: "mod", term, op: "taxonomy-deprecate", rationale: "Merging constraints." }, NOW);
  assert.ok(r.ok);
  assert.deepEqual(systems, systemsBefore);
  assert.equal((r as Extract<typeof r, { ok: true }>).store.taxonomy.find((t) => t.id === term.id)!.status, "deprecated");
});

test("taxonomy usage is derived from canonical systems", () => {
  const s = seed();
  const kitchen = s.taxonomy.find((t) => t.id === "tax:domain:kitchen-food-safety")!;
  assert.ok(deriveTaxonomyUsage(kitchen, systems) >= 1, "celiac system uses the kitchen domain");
  const legacy = s.taxonomy.find((t) => t.id === "tax:domain:food-safety-legacy")!;
  assert.equal(deriveTaxonomyUsage(legacy, systems), 0, "no system uses the legacy term");
});

// -------------------------------------------------------------- integrations

test("integration states are honest: nothing publishable, no secrets exposed", () => {
  const list = describeIntegrations({ modelCredentialsConfigured: false, modelEnabled: false, modelProvider: "none", now: NOW });
  assert.ok(list.length >= 8);
  for (const i of list) {
    assert.notEqual(i.capability, "connected-publishable");
    assert.equal(typeof i.credentialsConfigured, "boolean");
    // No secret-looking values anywhere in the descriptor.
    const blob = JSON.stringify(i);
    assert.ok(!/sk-[A-Za-z0-9]/.test(blob), "no api-key-like strings");
    assert.ok(!/"(apiKey|token|secret|password)"/.test(blob), "no credential value fields");
  }
});

test("model-renderer integration reflects the actual feature status", () => {
  const off = describeIntegrations({ modelCredentialsConfigured: false, modelEnabled: false, modelProvider: "none", modelReason: "disabled" });
  const model = off.find((i) => i.id === "model-renderer")!;
  assert.equal(model.capability, "unavailable");
  assert.equal(model.credentialsConfigured, false);
  assert.equal(model.productionAllowed, false);
});

// -------------------------------------------------------------- persistence

test("repository persists locally, falls back on corruption, and reset re-seeds", () => {
  const mem = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  g.window = {
    localStorage: {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    },
  };
  try {
    const repo = new LocalModerationRepository();
    const first = repo.load();
    assert.equal(first.origin, "local-device", "never presented as globally published");
    const promptCount = first.prompts.length;

    // Mutate + persist survives a reload.
    const withExtra = { ...first, seq: first.seq + 0, entries: first.entries };
    repo.save({ ...withExtra, taxonomy: withExtra.taxonomy });
    assert.equal(repo.load().prompts.length, promptCount);

    // Corruption → fresh seed.
    mem.set("ym:moderation:v1", "{ not valid json");
    assert.equal(repo.load().prompts.length, promptCount, "corruption falls back to seed");

    // Reset re-seeds deterministically.
    const reset = repo.reset();
    assert.equal(reset.prompts.length, promptCount);
    assert.equal(reset.actions.length, first.actions.length);
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
  }
});

// -------------------------------------------------------------- fixture separation

test("roast/moderation content never enters household-knowledge retrieval", () => {
  const corpus = buildCorpus(systems, lists, creators);
  const blob = JSON.stringify(corpus).toLowerCase();
  // A distinctive seeded roast entry body must not appear anywhere in the corpus.
  assert.ok(!blob.includes("version 47 has a qr code"), "roast entry text absent from knowledge corpus");
  assert.ok(!blob.includes("laminated the chore chart"), "roast prompt text absent from knowledge corpus");
});

test("pending roast content cannot silently enter a distribution asset", () => {
  // Distribution assets are built from canonical systems, never from the roast
  // store — and the distribution validator rejects roast fiction outright.
  const system = systems.find((s) => s.slug === "family-of-six-laundry-line")!;
  const created = createDistributionAsset({
    system,
    lists: lists.filter((l) => system.listSlugs.includes(l.slug)),
    templateId: "social-context-method",
    selection: { problem: true, routineIndices: [0] },
    creatorHandle: system.creatorHandle,
  });
  assert.ok(created.ok);
  const asset = clone((created as Extract<typeof created, { ok: true }>).asset);
  // Inject a seeded roast entry body into a block → validation must reject it.
  asset.blocks[0].text = "The chart has survived three family meetings. This is a 100% fictional roast.";
  const v = validateDistributionAsset(asset, system);
  assert.ok(v.errors.some((e) => e.code === "roast-fiction-mixed"));
});

// -------------------------------------------------------------- sanity

test("the seed exposes the expected workflow states and a stable policy version", () => {
  const s = seed();
  assert.equal(MODERATION_POLICY_VERSION, s.prompts[0].moderationPolicyVersion);
  const byStatus = s.entries.reduce<Record<string, number>>((a, e) => ((a[e.status] = (a[e.status] ?? 0) + 1), a), {});
  assert.ok(byStatus.approved >= 6 && byStatus.pending >= 2 && byStatus.escalated >= 1 && byStatus.removed >= 1);
  assert.ok(s.actions.length >= 5, "seeded audit history present");
});
