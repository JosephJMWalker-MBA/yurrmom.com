/**
 * Phase 5 domain tests — Curated Reference Registry & Claim Review.
 *
 * Runs with the committed tooling: `npm test` (node:test via tsx). Test-only
 * synthetic fixtures live under tests/fixtures and are never imported by src/.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  addVersion,
  buildClaimPayload,
  contentHash,
  evaluateApprovalGuard,
  projectClaim,
  projectRegistryClaims,
  REVIEW_CHECKLIST,
  canTransition,
} from "../src/domain/reference/index.ts";
import {
  buildCorpus,
  evaluateAuthoritativeEligibility,
  retrieve,
} from "../src/domain/knowledge/index.ts";
import type { KnowledgeQuery } from "../src/domain/knowledge/index.ts";
import { systems } from "../src/data/systems.ts";
import { lists } from "../src/data/lists.ts";
import { creators } from "../src/data/creators.ts";
import { translationRecords } from "../src/data/translations.ts";
import {
  CHILD_TASKS_EVIDENCE_TEXT,
  CHILD_TASKS_SPAN_ID,
  CHILD_TASKS_VERSION_ID,
  makeApprovedRegistry,
  makeConflictRegistry,
  TEST_NOW,
} from "./fixtures/reference-fixtures.ts";

const fullChecklist = Object.fromEntries(
  REVIEW_CHECKLIST.map((c) => [c.key, true]),
);

/** A developmental query mirroring the production insufficiency case. */
const devQuery = (over?: Partial<KnowledgeQuery>): KnowledgeQuery => ({
  text: "what chores are appropriate for a four-year-old",
  requestedLocale: "en",
  developmentalStage: "four-year-old",
  householdDomain: "child development",
  jurisdiction: "US",
  guidanceRisk: "developmental",
  representationPolicy: "public-safe",
  ...over,
});

function corpusWith(reg = makeApprovedRegistry()) {
  return buildCorpus(systems, lists, creators, projectRegistryClaims(reg));
}

// ---------------------------------------------------- identity & hashing

test("deterministic content hash is stable and order-sensitive", () => {
  assert.equal(contentHash("abc"), contentHash("abc"));
  assert.notEqual(contentHash("abc"), contentHash("acb"));
});

test("deterministic reference/version/span/claim IDs", () => {
  const reg = makeApprovedRegistry();
  assert.equal(reg.versions[0].id, CHILD_TASKS_VERSION_ID);
  assert.equal(reg.spans[0].id, CHILD_TASKS_SPAN_ID);
  assert.equal(reg.spans[0].textHash, contentHash(CHILD_TASKS_EVIDENCE_TEXT));
  const unit = projectClaim(reg, reg.claims[0]);
  const unit2 = projectClaim(makeApprovedRegistry(), makeApprovedRegistry().claims[0]);
  assert.equal(unit?.id, unit2?.id, "same source+claim → same unit id");
});

test("exact evidence text is preserved verbatim in the projected unit", () => {
  const reg = makeApprovedRegistry();
  const unit = projectClaim(reg, reg.claims[0])!;
  assert.equal(unit.claim!.evidenceCitations[0].exactText, CHILD_TASKS_EVIDENCE_TEXT);
});

// -------------------------------------------------- review & approval guards

test("review-state transitions are constrained", () => {
  assert.equal(canTransition("draft", "evidence-linked"), true);
  assert.equal(canTransition("draft", "approved"), false);
  assert.equal(canTransition("in-review", "approved"), true);
  assert.equal(canTransition("withdrawn", "approved"), false);
});

test("case 8 — a claim without exact evidence cannot be approved", () => {
  const reg = makeApprovedRegistry({ omitEvidence: true });
  const guard = evaluateApprovalGuard(reg.claims[0], reg.evidenceLinks, reg.spans, fullChecklist);
  assert.equal(guard.canApprove, false);
  assert.ok(guard.blockers.some((b) => /supporting.*evidence/i.test(b)));
});

test("case 9 — 'broader than evidence' unchecked blocks approval", () => {
  const reg = makeApprovedRegistry();
  const checklist = { ...fullChecklist, "not-broader-than-evidence": false };
  const guard = evaluateApprovalGuard(reg.claims[0], reg.evidenceLinks, reg.spans, checklist);
  assert.equal(guard.canApprove, false);
  assert.ok(guard.blockers.some((b) => /broader than the evidence/i.test(b)));
});

test("incomplete citation locator blocks approval", () => {
  const reg = makeApprovedRegistry();
  reg.spans[0] = { ...reg.spans[0], locator: {} }; // no locator fields
  const guard = evaluateApprovalGuard(reg.claims[0], reg.evidenceLinks, reg.spans, fullChecklist);
  assert.equal(guard.canApprove, false);
  assert.ok(guard.blockers.some((b) => /incomplete citation/i.test(b)));
});

test("a fully-supported, fully-checked claim may be approved", () => {
  const reg = makeApprovedRegistry();
  const guard = evaluateApprovalGuard(reg.claims[0], reg.evidenceLinks, reg.spans, fullChecklist);
  assert.equal(guard.canApprove, true, guard.blockers.join(" | "));
});

// -------------------------------------------------- eligibility mechanics

const eligOf = (reg = makeApprovedRegistry(), ctxOver?: Partial<{ risk: string; domain: string; jurisdiction: string }>) => {
  const payload = buildClaimPayload(reg, reg.claims[0])!;
  return evaluateAuthoritativeEligibility(payload, {
    risk: "developmental",
    domain: "child development",
    jurisdiction: "US",
    now: TEST_NOW,
    ...ctxOver,
  });
};

test("case 1 — approved, in-scope, current claim IS eligible", () => {
  assert.equal(eligOf().eligible, true);
});

test("case 2 — publisher type alone cannot satisfy authority", () => {
  // Same prestigious publisher, but assessment left unassessed → ineligible.
  const reg = makeApprovedRegistry({ assessmentStatus: "unassessed" });
  const r = eligOf(reg);
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => /authority assessment/i.test(x)));
});

test("case 3 — approved source in the WRONG domain cannot satisfy", () => {
  const reg = makeApprovedRegistry({ recognizedDomains: ["home electrical wiring"] });
  const r = eligOf(reg, { domain: "child development" });
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => /domain/i.test(x)));
});

test("case 4 — approved source in the WRONG jurisdiction cannot silently satisfy", () => {
  const reg = makeApprovedRegistry({ recognizedJurisdictions: ["CA"] });
  const r = eligOf(reg, { jurisdiction: "US" });
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => /jurisdiction/i.test(x)));
});

test("case 5 — an EXPIRED authority assessment cannot satisfy", () => {
  const reg = makeApprovedRegistry({ assessmentReviewDue: "2025-01-01" }); // before TEST_NOW
  const r = eligOf(reg);
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => /assessment/i.test(x)));
});

test("case 6 — a STALE claim (past review-due) cannot satisfy", () => {
  const reg = makeApprovedRegistry({ claimReviewDue: "2025-06-01" });
  const r = eligOf(reg);
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => /current/i.test(x)));
});

test("case 7 — a WITHDRAWN source cannot satisfy", () => {
  const reg = makeApprovedRegistry({ sourceStatus: "withdrawn" });
  const r = eligOf(reg);
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => /active source version/i.test(x)));
});

test("case 10 — editorial inference cannot independently satisfy high-stakes", () => {
  const reg = makeApprovedRegistry({ interpretationLevel: "editorial-inference" });
  const r = eligOf(reg);
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => /inference/i.test(x)));
});

test("wrong risk category cannot satisfy", () => {
  const r = eligOf(makeApprovedRegistry(), { risk: "legal" });
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => /risk category/i.test(x)));
});

test("undefined jurisdiction requires the claim to declare broad applicability", () => {
  const scoped = eligOf(makeApprovedRegistry({ applicabilityScope: "scoped" }), { jurisdiction: undefined });
  assert.equal(scoped.eligible, false);
  const broad = eligOf(makeApprovedRegistry({ applicabilityScope: "broad" }), { jurisdiction: undefined });
  assert.equal(broad.eligible, true);
});

// -------------------------------------------------- versioning & staleness

test("case 12 — adding a new ReferenceVersion marks dependent claims needs-revision", () => {
  const reg = makeApprovedRegistry();
  const before = JSON.stringify(reg);
  const { registry, newVersion, staledClaimIds } = addVersion(reg, {
    sourceId: "src:fictional-council:child-tasks",
    versionLabel: "2027 edition",
    sourceText: "Revised fictional guidance text for 2027.",
    enteredDate: "2027-03-01T00:00:00.000Z",
  });
  assert.equal(JSON.stringify(reg), before, "addVersion does not mutate the input registry");
  assert.equal(newVersion.ordinal, 2);
  assert.ok(staledClaimIds.includes("claim:fictional-editor:child-tasks"));
  const claim = registry.claims.find((c) => c.id === "claim:fictional-editor:child-tasks")!;
  assert.equal(claim.status, "needs-revision");
});

test("case 13 — old version and its evidence spans remain immutable after a new version", () => {
  const reg = makeApprovedRegistry();
  const oldVersion = JSON.stringify(reg.versions[0]);
  const oldSpan = JSON.stringify(reg.spans[0]);
  const { registry } = addVersion(reg, {
    sourceId: "src:fictional-council:child-tasks",
    versionLabel: "2027 edition",
    sourceText: "Revised text.",
    enteredDate: "2027-03-01T00:00:00.000Z",
  });
  const preservedOld = registry.versions.find((v) => v.id === CHILD_TASKS_VERSION_ID)!;
  // Old version text/hash/ordinal are untouched; only status/supersededBy set.
  assert.equal(preservedOld.contentHash, JSON.parse(oldVersion).contentHash);
  assert.equal(preservedOld.sourceText, JSON.parse(oldVersion).sourceText);
  assert.equal(preservedOld.status, "superseded");
  assert.equal(registry.spans.find((s) => s.id === CHILD_TASKS_SPAN_ID)!.exactText, JSON.parse(oldSpan).exactText);
});

test("stale claim after a new version cannot satisfy authoritative support", () => {
  const { registry } = addVersion(makeApprovedRegistry(), {
    sourceId: "src:fictional-council:child-tasks",
    versionLabel: "2027 edition",
    sourceText: "Revised text.",
    enteredDate: "2027-03-01T00:00:00.000Z",
  });
  const payload = buildClaimPayload(registry, registry.claims[0])!;
  const r = evaluateAuthoritativeEligibility(payload, {
    risk: "developmental", domain: "child development", jurisdiction: "US", now: TEST_NOW,
  });
  assert.equal(r.eligible, false, "needs-revision claim is not approved");
});

// -------------------------------------------------- EvidencePacket integration

test("case 1 (integration) — eligible authoritative claim satisfies high-stakes coverage", () => {
  const packet = retrieve(devQuery(), corpusWith(), translationRecords, 12, TEST_NOW);
  assert.equal(packet.authoritativeSummary?.present, true);
  assert.equal(packet.authoritativeSummary?.eligibleClaimCount >= 1, true);
  assert.notEqual(packet.coverage, "authoritative-support-required");
  const claimHit = packet.hits.find((h) => h.unit.kind === "curated-claim");
  assert.ok(claimHit, "the curated claim was retrieved");
  assert.equal(claimHit!.authoritativeEligibility?.eligible, true);
});

test("EvidencePacket BEFORE any eligible authority stays authoritative-support-required", () => {
  // Production corpus (no eligible authoritative claim).
  const prodCorpus = buildCorpus(systems, lists, creators);
  const packet = retrieve(devQuery(), prodCorpus, translationRecords, 12, TEST_NOW);
  assert.equal(packet.coverage, "authoritative-support-required");
  assert.equal(packet.authoritativeSummary?.present, false);
});

test("case 11 — unresolved material conflict → warnings + qualified coverage (not sufficient)", () => {
  const packet = retrieve(devQuery(), corpusWith(makeConflictRegistry()), translationRecords, 12, TEST_NOW);
  assert.ok(packet.warnings.some((w) => /conflict/i.test(w)), "a conflict warning is present");
  assert.notEqual(packet.coverage, "sufficient-for-household-exploration");
  // Conflicted claims are ineligible → cannot be presented as uncontested.
  assert.equal(packet.authoritativeSummary?.present, false);
});

test("case 14 — public-safe retrieval EXCLUDES draft claims", () => {
  const reg = makeApprovedRegistry({ claimStatus: "draft" });
  const packet = retrieve(devQuery({ representationPolicy: "public-safe" }), corpusWith(reg), translationRecords, 12, TEST_NOW);
  assert.equal(packet.hits.some((h) => h.unit.kind === "curated-claim"), false, "no draft claim in public-safe");
  assert.equal(packet.coverage, "authoritative-support-required");
});

test("case 15 — editorial inspection SHOWS drafts with status + warnings", () => {
  const reg = makeApprovedRegistry({ claimStatus: "draft" });
  const packet = retrieve(devQuery({ representationPolicy: "editorial-inspection" }), corpusWith(reg), translationRecords, 12, TEST_NOW);
  const claimHit = packet.hits.find((h) => h.unit.kind === "curated-claim");
  assert.ok(claimHit, "draft claim visible in editorial inspection");
  assert.equal(claimHit!.authoritativeEligibility?.eligible, false, "a draft is not eligible");
  assert.ok(claimHit!.warnings.some((w) => /editorial inspection only/i.test(w)));
  // Even in editorial inspection, an unapproved draft cannot satisfy support.
  assert.equal(packet.coverage, "authoritative-support-required");
});

// -------------------------------------------------- fixture separation

test("case 16 — no test fixture leaks into the production corpus", async () => {
  const { knowledgeCorpus } = await import("../src/data/knowledge-corpus.ts");
  const serialized = JSON.stringify(knowledgeCorpus);
  assert.ok(!/Fictional/i.test(serialized), "no fictional test publisher/source in production corpus");
  // Production has no eligible authoritative claim for the developmental query.
  const packet = retrieve(devQuery(), knowledgeCorpus, translationRecords, 12, TEST_NOW);
  assert.equal(packet.coverage, "authoritative-support-required");
  assert.equal(packet.authoritativeSummary?.present, false);
});

test("production platform-internal claim is present but NOT authoritative", async () => {
  const { knowledgeCorpus } = await import("../src/data/knowledge-corpus.ts");
  const claimUnits = knowledgeCorpus.filter((u) => u.kind === "curated-claim");
  assert.equal(claimUnits.length, 1, "only the platform-internal claim exists in production");
  assert.equal(claimUnits[0].claim!.assessment.status, "unassessed");
});

// -------------------------------------------------- determinism & immutability

test("repeated retrieval produces identical packets (JSON)", () => {
  const c = corpusWith();
  const a = JSON.stringify(retrieve(devQuery(), c, translationRecords, 12, TEST_NOW));
  const b = JSON.stringify(retrieve(devQuery(), c, translationRecords, 12, TEST_NOW));
  assert.equal(a, b);
});

test("retrieval does not mutate reference content or canonical systems", () => {
  const reg = makeApprovedRegistry();
  const regBefore = JSON.stringify(reg);
  const sysBefore = JSON.stringify(systems);
  const c = corpusWith(reg);
  retrieve(devQuery(), c, translationRecords, 12, TEST_NOW);
  retrieve(devQuery({ representationPolicy: "editorial-inspection" }), c, translationRecords, 12, TEST_NOW);
  assert.equal(JSON.stringify(reg), regBefore, "reference registry unchanged");
  assert.equal(JSON.stringify(systems), sysBefore, "canonical systems unchanged");
});

test("eligibility reasons are populated for an ineligible claim", () => {
  const r = eligOf(makeApprovedRegistry({ claimStatus: "in-review" }));
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.length > 0);
  assert.ok(r.checks.length >= 10, "all checks reported");
});
