/**
 * Phase 4 domain tests — deterministic knowledge projection & retrieval.
 *
 * Run with the repo's committed tooling: `npm test` (node:test via tsx).
 * These import only pure domain functions + seeded data arrays (relative
 * paths) so no framework alias resolution or app runtime is needed.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { buildCorpus, derivationOf, projectSystem, retrieve } from "../src/domain/knowledge/index.ts";
import type { KnowledgeQuery } from "../src/domain/knowledge/index.ts";
import { systems } from "../src/data/systems.ts";
import { lists } from "../src/data/lists.ts";
import { creators } from "../src/data/creators.ts";
import { translationRecords } from "../src/data/translations.ts";

const corpus = buildCorpus(systems, lists, creators);

const baseQuery = (over: Partial<KnowledgeQuery>): KnowledgeQuery => ({
  text: "",
  requestedLocale: "en",
  representationPolicy: "public-safe",
  guidanceRisk: "ordinary-household",
  ...over,
});

function topSystem(q: KnowledgeQuery): string | undefined {
  return retrieve(q, corpus, translationRecords).hits[0]?.unit.ownerSystemSlug;
}

// ---------------------------------------------------------- projection

test("deterministic unit IDs are stable across projections", () => {
  const a = buildCorpus(systems, lists, creators).map((u) => u.id);
  const b = buildCorpus(systems, lists, creators).map((u) => u.id);
  assert.deepEqual(a, b);
  // Encodes slug + version + kind → stable for same source+version.
  const celiac = corpus.find((u) => u.kind === "problem-promise" && u.ownerSystemSlug === "celiac-safe-pantry-reset");
  assert.equal(celiac?.id, "ku:celiac-safe-pantry-reset:v4:problem-promise:core");
});

test("unit IDs are unique", () => {
  const ids = corpus.map((u) => u.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("projection does not mutate source objects (frozen inputs)", () => {
  const frozenSystems = systems.map((s) => Object.freeze(structuredClone(s)));
  const frozenLists = lists.map((l) => Object.freeze(structuredClone(l)));
  const before = JSON.stringify(systems);
  // Deep-freeze one system fully and project — any write would throw.
  const sys = structuredClone(systems[0]);
  deepFreeze(sys);
  const sysLists = structuredClone(lists.filter((l) => l.systemSlug === sys.slug));
  sysLists.forEach(deepFreeze);
  assert.doesNotThrow(() => projectSystem(sys, sysLists, creators[0]));
  assert.doesNotThrow(() => buildCorpus(frozenSystems, frozenLists, creators));
  assert.equal(JSON.stringify(systems), before);
});

test("list-item units preserve structure and EXCLUDE retailer offers", () => {
  const item = corpus.find((u) => u.kind === "list-item" && u.sourceObjectId.endsWith("#gf-flour"));
  assert.ok(item?.listItem, "list-item projection present");
  assert.equal(item!.listItem!.need, "Certified GF all-purpose flour");
  assert.equal(item!.listItem!.preferredName, "King Arthur Measure for Measure");
  assert.ok(item!.listItem!.substitutions.length >= 1);
  assert.equal(item!.listItem!.importance, "required");
  // No offers/URLs/affiliate anywhere on a unit.
  const serialized = JSON.stringify(item);
  assert.ok(!serialized.includes("http"), "no URL leaked into unit");
  assert.ok(!/affiliate/i.test(serialized), "no affiliate field on unit");
  assert.ok(!("offers" in (item!.listItem as object)), "no offers on projection");
});

// ---------------------------------------------------------- retrieval

test("stable retrieval ordering — identical packets across runs", () => {
  const q = baseQuery({ text: "shared kitchen celiac label checks" });
  const p1 = retrieve(q, corpus, translationRecords);
  const p2 = retrieve(q, corpus, translationRecords);
  assert.deepEqual(p1, p2);
  assert.deepEqual(
    p1.hits.map((h) => [h.rank, h.unit.id, h.score]),
    p2.hits.map((h) => [h.rank, h.unit.id, h.score]),
  );
});

test("seeded case 1 — celiac shared-kitchen ranks first with reasons", () => {
  const q = baseQuery({ text: "shared kitchen celiac label checks" });
  const packet = retrieve(q, corpus, translationRecords);
  assert.equal(packet.hits[0].unit.ownerSystemSlug, "celiac-safe-pantry-reset");
  const reasons = packet.hits[0].reasons.join(" ").toLowerCase();
  assert.ok(reasons.includes("query term"), "reasons cite matched terms");
  assert.equal(packet.coverage, "sufficient-for-household-exploration");
});

test("seeded case 2 — family laundry ranks first", () => {
  const q = baseQuery({ text: "kids help with laundry one washer" });
  assert.equal(topSystem(q), "family-of-six-laundry-line");
});

test("facet matching — constraint filter contributes and is explained", () => {
  const q = baseQuery({
    text: "kitchen safety",
    constraints: ["strict cross-contact prevention"],
  });
  const packet = retrieve(q, corpus, translationRecords);
  const celiacHit = packet.hits.find((h) => h.unit.ownerSystemSlug === "celiac-safe-pantry-reset");
  assert.ok(celiacHit, "celiac unit retrieved");
  assert.ok(
    celiacHit!.reasons.some((r) => r.toLowerCase().includes("constraint")),
    "constraint reason present",
  );
});

test("source-type filter excludes non-matching provenance", () => {
  const q = baseQuery({
    text: "kitchen",
    sourceTypeFilters: ["sourced-reference"], // none exist in seed
  });
  const packet = retrieve(q, corpus, translationRecords);
  assert.equal(packet.hits.length, 0, "no authoritative-reference units exist");
});

test("scope boost surfaces the scoped system", () => {
  const q = baseQuery({ text: "night", systemScope: "two-am-field-kit" });
  const packet = retrieve(q, corpus, translationRecords);
  assert.equal(packet.hits[0].unit.ownerSystemSlug, "two-am-field-kit");
  assert.ok(packet.hits[0].reasons.some((r) => r.includes("system scope")));
});

// ---------------------------------------------------------- translation policy

test("locale fallback — English request serves the original", () => {
  const q = baseQuery({ text: "celiac shared kitchen", systemScope: "celiac-safe-pantry-reset" });
  const packet = retrieve(q, corpus, translationRecords);
  assert.equal(packet.hits[0].representation.kind, "original");
});

test("seeded case 4 — public-safe does NOT serve the Spanish machine draft", () => {
  const q = baseQuery({
    text: "celiac shared kitchen",
    requestedLocale: "es",
    systemScope: "celiac-safe-pantry-reset",
    representationPolicy: "public-safe",
  });
  const packet = retrieve(q, corpus, translationRecords);
  const top = packet.hits[0];
  assert.equal(top.representation.kind, "original", "falls back to original");
  assert.equal(top.representation.approvedByCreator, true);
  assert.ok(top.representation.fellBackToOriginal, "explicitly a fallback");
  assert.equal(packet.localeSummary.approvedTranslationAvailable, false);
  assert.equal(packet.localeSummary.unapprovedOrStalePresent, true);
  // Never claims equivalence.
  assert.ok(/not claimed/i.test(top.representation.provenanceNote));
});

test("seeded case 5 — editorial inspection MAY show the draft, with caution", () => {
  const q = baseQuery({
    text: "celiac shared kitchen",
    requestedLocale: "es",
    systemScope: "celiac-safe-pantry-reset",
    representationPolicy: "editorial-inspection",
  });
  const packet = retrieve(q, corpus, translationRecords);
  const top = packet.hits[0];
  assert.equal(top.representation.kind, "translation");
  assert.equal(top.representation.approvedByCreator, false);
  assert.ok(
    packet.localeSummary.notes.some((n) => /machine draft/i.test(n)),
    "caution/status travels with the draft",
  );
});

test("stale translation handling — version bump makes it stale in editorial mode", () => {
  const bumped = structuredClone(translationRecords); // record stays v4
  const stalerSystems = structuredClone(systems);
  const celiac = stalerSystems.find((s) => s.slug === "celiac-safe-pantry-reset")!;
  celiac.version = 9; // source moved on; record.sourceVersion (4) < 9
  const staleCorpus = buildCorpus(stalerSystems, lists, creators);
  const q = baseQuery({
    text: "celiac",
    requestedLocale: "es",
    systemScope: "celiac-safe-pantry-reset",
    representationPolicy: "editorial-inspection",
  });
  const packet = retrieve(q, staleCorpus, bumped);
  assert.ok(
    packet.localeSummary.notes.some((n) => /stale/i.test(n)),
    "stale status is reported",
  );
});

// ---------------------------------------------------------- high-stakes

test("seeded case 3 — developmental query reports authoritative-support-required", () => {
  const q = baseQuery({
    text: "what chores are appropriate for a four-year-old?",
    developmentalStage: "four-year-old",
    guidanceRisk: "developmental",
  });
  const packet = retrieve(q, corpus, translationRecords);
  assert.equal(packet.coverage, "authoritative-support-required");
  assert.ok(packet.insufficientSupportReason);
  // Personal experience may still appear — but labeled, never authoritative.
  for (const h of packet.hits) {
    assert.notEqual(h.unit.provenanceSourceType, "sourced-reference");
    assert.ok(
      h.warnings.some((w) => /not authoritative/i.test(w)),
      "each hit warns it is not authoritative developmental guidance",
    );
  }
});

test("medical query with no authoritative source → authoritative-support-required", () => {
  const q = baseQuery({ text: "celiac", guidanceRisk: "medical" });
  const packet = retrieve(q, corpus, translationRecords);
  assert.equal(packet.coverage, "authoritative-support-required");
});

// ---------------------------------------------------------- invariants

test("affiliate neutrality — adding a retailer link does not change ranking", () => {
  const q = baseQuery({ text: "shared kitchen celiac label checks" });
  const before = retrieve(q, corpus, translationRecords);

  const listsWithExtraOffer = structuredClone(lists);
  const pantry = listsWithExtraOffer.find((l) => l.slug === "celiac-safe-pantry-staples")!;
  pantry.items[0].preferred!.offers.push({
    retailer: "BrandNewMegaStore",
    url: "https://example.com/paid-placement",
    state: "link-only",
    affiliate: true,
  });
  const mutatedCorpus = buildCorpus(systems, listsWithExtraOffer, creators);
  const after = retrieve(q, mutatedCorpus, translationRecords);

  assert.deepEqual(
    before.hits.map((h) => [h.unit.id, h.score]),
    after.hits.map((h) => [h.unit.id, h.score]),
    "ranking is identical before/after adding a retailer offer",
  );
});

test("derivative content is never labeled as creator-original", () => {
  // All seeded canonical units are original personal-experience.
  for (const u of corpus) {
    if (u.derivation !== "original") {
      // If a derivative unit ever appears, it must not be personal-experience.
      assert.notEqual(u.provenanceSourceType, "personal-experience");
    }
  }
  // And a translated derivation maps correctly.
  assert.equal(derivationOf("translated-derivative"), "translated");
  assert.equal(derivationOf("ai-assisted-draft"), "generated");
  assert.equal(derivationOf("personal-experience"), "original");
});

test("repeated execution produces byte-identical packets (JSON)", () => {
  const q = baseQuery({ text: "laundry kids washer", requestedLocale: "en" });
  const a = JSON.stringify(retrieve(q, corpus, translationRecords));
  const b = JSON.stringify(retrieve(q, corpus, translationRecords));
  assert.equal(a, b);
});

// ---------------------------------------------------------- helpers

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    for (const v of Object.values(obj)) deepFreeze(v);
    Object.freeze(obj);
  }
  return obj;
}
