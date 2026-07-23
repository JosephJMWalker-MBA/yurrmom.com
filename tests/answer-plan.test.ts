/**
 * Phase 6 domain tests — Grounded Answer Planning & Citation Composition.
 *
 * Runs with the committed tooling: `npm test` (node:test via tsx). Reuses the
 * Phase 5 test-only fictional fixtures for eligible-authority/conflict cases;
 * they never enter production corpus construction.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCorpus,
  retrieve,
  type EvidencePacket,
  type KnowledgeQuery,
} from "../src/domain/knowledge/index.ts";
import { addVersion, projectRegistryClaims } from "../src/domain/reference/index.ts";
import {
  answerRenderer,
  answerRequestToQuery,
  planAnswer,
  validateAnswerPlan,
  type AnswerRequest,
} from "../src/domain/answer/index.ts";
import { systems } from "../src/data/systems.ts";
import { lists } from "../src/data/lists.ts";
import { creators } from "../src/data/creators.ts";
import { translationRecords } from "../src/data/translations.ts";
import {
  makeApprovedRegistry,
  makeConflictRegistry,
  TEST_NOW,
} from "./fixtures/reference-fixtures.ts";

const PLAN_NOW = new Date("2026-07-23T12:00:00.000Z");
const prodCorpus = buildCorpus(systems, lists, creators);

function req(over: Partial<AnswerRequest>): AnswerRequest {
  return {
    question: "",
    requestedLocale: "en",
    representationPolicy: "public-safe",
    guidanceRisk: "ordinary-household",
    depth: "standard",
    ...over,
  };
}

function packetFor(request: AnswerRequest, corpus = prodCorpus, tr = translationRecords): EvidencePacket {
  return retrieve(answerRequestToQuery(request), corpus, tr, 12, TEST_NOW);
}

function planFor(request: AnswerRequest, corpus = prodCorpus, tr = translationRecords) {
  const packet = packetFor(request, corpus, tr);
  return { packet, plan: planAnswer(request, packet, { now: PLAN_NOW }) };
}

function corpusWithAuthority(reg = makeApprovedRegistry()) {
  return buildCorpus(systems, lists, creators, projectRegistryClaims(reg));
}

// ---------------------------------------------------- determinism & fingerprints

test("deterministic plan IDs and repeated identical plans (minus createdAt)", () => {
  const r = req({ question: "kids help with laundry one washer" });
  const p1 = planFor(r).plan;
  const p2 = planFor(r).plan;
  assert.equal(p1.planId, p2.planId);
  assert.equal(p1.planFingerprint, p2.planFingerprint);
  assert.equal(p1.packetFingerprint, p2.packetFingerprint);
  assert.equal(p1.citationMapFingerprint, p2.citationMapFingerprint);
  const strip = (p: typeof p1) => ({ ...p, createdAt: "X" });
  assert.deepEqual(strip(p1), strip(p2));
});

test("plan fingerprint excludes the injected createdAt", () => {
  const r = req({ question: "kids help with laundry one washer" });
  const { packet } = planFor(r);
  const a = planAnswer(r, packet, { now: new Date("2020-01-01") });
  const b = planAnswer(r, packet, { now: new Date("2999-12-31") });
  assert.equal(a.planFingerprint, b.planFingerprint);
  assert.notEqual(a.createdAt, b.createdAt);
});

test("citation labels are stable and sequential", () => {
  const { plan } = planFor(req({ question: "kids help with laundry one washer" }));
  plan.citationMap.forEach((c, i) => assert.equal(c.label, String(i + 1)));
  assert.equal(new Set(plan.citationMap.map((c) => c.label)).size, plan.citationMap.length);
});

// ---------------------------------------------------- immutability

test("planning does not mutate packet or canonical data", () => {
  const r = req({ question: "kids help with laundry one washer" });
  const packet = packetFor(r);
  const packetBefore = JSON.stringify(packet);
  const systemsBefore = JSON.stringify(systems);
  planAnswer(r, packet, { now: PLAN_NOW });
  assert.equal(JSON.stringify(packet), packetBefore, "packet unchanged");
  assert.equal(JSON.stringify(systems), systemsBefore, "canonical systems unchanged");
});

// ---------------------------------------------------- case A: ordinary

test("case A — ordinary laundry: household-exploration, labeled experience, cited, non-universal", () => {
  const { plan } = planFor(req({ question: "How can kids help with laundry when a family has one washer?" }));
  assert.ok(["household-exploration", "qualified-household-exploration"].includes(plan.disposition));
  assert.ok(plan.livedExperienceExamples.length > 0, "creator experience present");
  assert.ok(plan.livedExperienceExamples.every((p) => !p.prescriptiveAllowed), "no universal prescription");
  // every substantive creator point has a citation to an actual unit
  for (const p of plan.livedExperienceExamples) assert.ok(p.citationIds.length > 0);
  assert.ok(plan.authoritativePoints.length === 0, "no authoritative points in ordinary case");
  assert.equal(plan.validation.valid, true, JSON.stringify(plan.validation.errors));
});

// ---------------------------------------------------- case B: celiac medical

test("case B — celiac medical: abstain/escalate, no authoritative point, experience still cited", () => {
  const { plan } = planFor(req({
    question: "How does this family keep a shared kitchen safer for a child with celiac disease?",
    guidanceRisk: "medical",
    systemScope: "celiac-safe-pantry-reset",
  }));
  assert.ok(["abstain-authoritative-support-required", "escalate-to-qualified-professional"].includes(plan.disposition));
  assert.equal(plan.authoritativePoints.length, 0, "no medical recommendation");
  assert.equal(plan.escalation.type, "licensed-medical-professional");
  assert.ok(plan.escalation.prescriptiveAnswerPointsProhibited);
  assert.ok(plan.livedExperienceExamples.length > 0 && plan.livedExperienceExamples.every((p) => p.citationIds.length > 0));
  assert.ok(plan.missingEvidence.length > 0);
  assert.equal(plan.validation.valid, true, JSON.stringify(plan.validation.errors));
});

// ---------------------------------------------------- case C: developmental

test("case C — developmental insufficiency: no prescription, escalation, missing evidence explicit", () => {
  const { plan } = planFor(req({
    question: "What chores are appropriate for a four-year-old?",
    developmentalStage: "four-year-old",
    householdDomain: "child development",
    jurisdiction: "US",
    guidanceRisk: "developmental",
  }));
  assert.equal(plan.authoritativePoints.length, 0);
  assert.ok(plan.rendererConstraints.mustStateMissingAuthority);
  assert.equal(plan.escalation.type, "pediatric-or-developmental-professional");
  assert.ok(plan.missingEvidence.some((m) => /authoritative/i.test(m)));
  assert.ok(!plan.rendererConstraints.prescriptiveAllowedAnywhere, "no prescriptive points allowed");
  assert.equal(plan.validation.valid, true, JSON.stringify(plan.validation.errors));
});

// ---------------------------------------------------- case D: eligible authority

test("case D — test-only eligible authority: supported-guidance with cited exact evidence + scope", () => {
  const r = req({
    question: "chores appropriate for a four-year-old",
    developmentalStage: "four-year-old",
    householdDomain: "child development",
    jurisdiction: "US",
    guidanceRisk: "developmental",
  });
  const { plan } = planFor(r, corpusWithAuthority());
  assert.equal(plan.disposition, "supported-guidance");
  assert.ok(plan.authoritativePoints.length >= 1);
  const ap = plan.authoritativePoints[0];
  assert.ok(ap.citationIds.length > 0);
  const cit = plan.citationMap.find((c) => c.label === ap.citationIds[0])!;
  assert.ok(cit.exactExcerpt.length > 0 && cit.locator, "exact evidence + locator cited");
  assert.ok(ap.applicability && /US|Audience/i.test(ap.applicability), "jurisdiction/audience scope visible");
  assert.equal(plan.validation.valid, true, JSON.stringify(plan.validation.errors));
  // still avoids universal language via prohibitions
  assert.ok(plan.prohibitedAssertions.some((p) => p.code === "no-universal-applicability"));
});

test("supported authority still carries mandatory limitations + escalation reason", () => {
  const r = req({ question: "chores appropriate for a four-year-old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" });
  const { plan } = planFor(r, corpusWithAuthority());
  assert.ok(plan.limitations.length > 0, "authoritative claim limitation surfaced");
  assert.equal(plan.escalation.type, "pediatric-or-developmental-professional");
});

// ---------------------------------------------------- case E: material conflict

test("case E — material conflict: conflict mandatory, disposition reflects conflict, one side not uncontested", () => {
  const r = req({ question: "chores appropriate for a four-year-old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" });
  const { plan } = planFor(r, corpusWithAuthority(makeConflictRegistry()));
  assert.equal(plan.disposition, "conflicted-guidance");
  assert.ok(plan.conflicts.length > 0);
  assert.ok(plan.rendererConstraints.mustDiscloseConflict);
  assert.ok(plan.permittedAnswerPoints.some((p) => p.role === "conflict"));
  assert.equal(plan.validation.valid, true, JSON.stringify(plan.validation.errors));
});

test("validator FAILS a plan that omits a present conflict", () => {
  const r = req({ question: "chores appropriate for a four-year-old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" });
  const { packet, plan } = planFor(r, corpusWithAuthority(makeConflictRegistry()));
  const tampered = { ...plan, conflicts: [], permittedAnswerPoints: plan.permittedAnswerPoints.filter((p) => p.role !== "conflict") };
  const v = validateAnswerPlan(tampered, packet);
  assert.equal(v.valid, false);
  assert.ok(v.errors.some((e) => e.code === "conflict-disclosure-omitted"));
});

// ---------------------------------------------------- case F: translation policy

test("case F — Spanish public-safe: falls back to original, translation caution mandatory, no equivalence", () => {
  const r = req({
    question: "How does this family keep a shared kitchen safer for celiac disease?",
    requestedLocale: "es",
    systemScope: "celiac-safe-pantry-reset",
    guidanceRisk: "ordinary-household",
  });
  const { plan } = planFor(r);
  // served as original English; translation status travels on every citation
  assert.ok(plan.citationMap.every((c) => c.translationStatus.length > 0));
  assert.ok(plan.qualifications.some((q) => q.kind === "stale-or-unapproved-translation" && q.mandatory));
  assert.ok(plan.prohibitedAssertions.some((p) => p.code === "no-exact-translation-equivalence"));
  assert.ok(plan.prohibitedAssertions.some((p) => p.code === "no-translation-approval-implied"));
  assert.equal(plan.validation.valid, true, JSON.stringify(plan.validation.errors));
});

test("editorial-inspection Spanish exposes the draft status without claiming approval", () => {
  const r = req({
    question: "celiac shared kitchen",
    requestedLocale: "es",
    systemScope: "celiac-safe-pantry-reset",
    representationPolicy: "editorial-inspection",
    guidanceRisk: "ordinary-household",
  });
  const { plan } = planFor(r);
  assert.ok(plan.citationMap.some((c) => /translation/i.test(c.translationStatus)));
  assert.ok(!plan.citationMap.some((c) => /approved/i.test(c.translationStatus) && /not creator-approved/.test(c.translationStatus) === false && c.translationStatus.includes("machine")));
});

// ---------------------------------------------------- case G: citation laundering

test("case G — citation laundering: citation attached to an unsupported proposition FAILS", () => {
  const r = req({ question: "kids help with laundry one washer" });
  const { packet, plan } = planFor(r);
  // Attach citation [1] to a point whose supportingHitIds do NOT include [1]'s hit.
  const other = plan.citationMap[1] ?? plan.citationMap[0];
  const target = plan.permittedAnswerPoints.find((p) => p.citationIds.length > 0 && !p.citationIds.includes(other.label))!;
  const tampered = {
    ...plan,
    permittedAnswerPoints: plan.permittedAnswerPoints.map((p) =>
      p.id === target.id ? { ...p, citationIds: [...p.citationIds, other.label] } : p,
    ),
  };
  const v = validateAnswerPlan(tampered, packet);
  assert.equal(v.valid, false);
  assert.ok(v.errors.some((e) => e.code === "citation-support-mismatch"));
});

test("validator FAILS a point citing a hit not present in the packet", () => {
  const r = req({ question: "kids help with laundry one washer" });
  const { packet, plan } = planFor(r);
  const p0 = plan.permittedAnswerPoints.find((p) => p.supportingHitIds.length > 0)!;
  const tampered = {
    ...plan,
    permittedAnswerPoints: plan.permittedAnswerPoints.map((p) =>
      p.id === p0.id ? { ...p, supportingHitIds: ["hit:99:nonexistent-unit"] } : p,
    ),
  };
  const v = validateAnswerPlan(tampered, packet);
  assert.equal(v.valid, false);
  assert.ok(v.errors.some((e) => e.code === "hit-not-in-packet"));
});

test("validator FAILS a packet/plan fingerprint mismatch", () => {
  const rA = req({ question: "kids help with laundry one washer" });
  const rB = req({ question: "celiac shared kitchen label checks" });
  const planA = planFor(rA).plan;
  const packetB = packetFor(rB);
  const v = validateAnswerPlan(planA, packetB);
  assert.equal(v.valid, false);
  assert.ok(v.errors.some((e) => e.code === "packet-fingerprint-mismatch"));
});

// ---------------------------------------------------- case H: affiliate neutrality

test("case H — affiliate neutrality: adding a retailer offer does not change the plan", () => {
  const r = req({ question: "How can kids help with laundry when a family has one washer?" });
  const before = planFor(r).plan;

  const listsWithOffer = structuredClone(lists);
  const pantry = listsWithOffer.find((l) => l.slug === "celiac-safe-pantry-staples")!;
  pantry.items[0].preferred!.offers.push({ retailer: "MegaAffiliate", url: "https://example.com/x", state: "link-only", affiliate: true });
  const mutatedCorpus = buildCorpus(systems, listsWithOffer, creators);
  const after = planAnswer(r, retrieve(answerRequestToQuery(r), mutatedCorpus, translationRecords, 12, TEST_NOW), { now: PLAN_NOW });

  assert.equal(before.planFingerprint, after.planFingerprint, "plan fingerprint unchanged");
  assert.equal(before.packetFingerprint, after.packetFingerprint, "packet fingerprint unchanged");
  assert.deepEqual(before.disposition, after.disposition);
  assert.deepEqual(before.citationMap.map((c) => c.label), after.citationMap.map((c) => c.label));
});

// ---------------------------------------------------- exclusions (stale/withdrawn/expired/inference)

test("stale claim (new version) cannot support authority", () => {
  const { registry } = addVersion(makeApprovedRegistry(), { sourceId: "src:fictional-council:child-tasks", versionLabel: "2027", sourceText: "revised", enteredDate: "2027-03-01T00:00:00.000Z" });
  const r = req({ question: "chores four year old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" });
  const { plan } = planFor(r, corpusWithAuthority(registry));
  assert.equal(plan.authoritativePoints.length, 0);
  assert.notEqual(plan.disposition, "supported-guidance");
});

test("withdrawn source cannot support authority", () => {
  const r = req({ question: "chores four year old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" });
  const { plan } = planFor(r, corpusWithAuthority(makeApprovedRegistry({ sourceStatus: "withdrawn" })));
  assert.equal(plan.authoritativePoints.length, 0);
});

test("expired assessment cannot support authority", () => {
  const r = req({ question: "chores four year old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" });
  const { plan } = planFor(r, corpusWithAuthority(makeApprovedRegistry({ assessmentReviewDue: "2025-01-01" })));
  assert.equal(plan.authoritativePoints.length, 0);
});

test("editorial inference cannot become an authoritative point", () => {
  const r = req({ question: "chores four year old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" });
  const { plan } = planFor(r, corpusWithAuthority(makeApprovedRegistry({ interpretationLevel: "editorial-inference" })));
  assert.equal(plan.authoritativePoints.length, 0);
});

// ---------------------------------------------------- renderer boundary

test("renderer accepts a plan and refuses an invalid one", () => {
  const { plan } = planFor(req({ question: "kids help with laundry one washer" }));
  const ok = answerRenderer.renderPreview(plan);
  assert.ok(ok.ok && ok.preview.text.includes("## Disposition"));
  const invalid = { ...plan, validation: { valid: false, errors: [{ code: "x", message: "y" }], warnings: [] } };
  const bad = answerRenderer.renderPreview(invalid);
  assert.equal(bad.ok, false);
});

// ---------------------------------------------------- fixture separation

test("no test fixture leaks into production plan citations", async () => {
  const { plan } = planFor(req({ question: "chores appropriate for a four-year-old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" }));
  assert.ok(!/Fictional/i.test(JSON.stringify(plan)), "no fictional fixture in production plan");
});

test("repeated execution byte-identical (minus createdAt)", () => {
  const r = req({ question: "kids help with laundry one washer" });
  const { packet } = planFor(r);
  const a = planAnswer(r, packet, { now: PLAN_NOW });
  const b = planAnswer(r, packet, { now: PLAN_NOW });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});
