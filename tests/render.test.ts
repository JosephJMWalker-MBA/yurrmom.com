/**
 * Phase 7 domain tests — Constrained Model-Assisted Answer Rendering.
 *
 * Uses the committed tooling (node:test via tsx). All provider behavior is
 * exercised with FAKE providers — no network, no OpenAI SDK import.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { buildCorpus, retrieve, type EvidencePacket } from "../src/domain/knowledge/index.ts";
import { projectRegistryClaims } from "../src/domain/reference/index.ts";
import {
  answerRequestToQuery,
  buildCandidateJsonSchema,
  buildRenderContract,
  compileRenderedAnswer,
  fingerprintCandidate,
  planAnswer,
  validateCompositionCandidate,
  validateRenderedAnswer,
  wrapPointText,
  type AnswerPlan,
  type AnswerRequest,
  type CompositionCandidate,
  type ModelCompositionProvider,
  type ProviderResult,
  type RenderContract,
} from "../src/domain/answer/index.ts";
import { executeConstrainedRendering } from "../src/server/render-pipeline.ts";
import { systems } from "../src/data/systems.ts";
import { lists } from "../src/data/lists.ts";
import { creators } from "../src/data/creators.ts";
import { translationRecords } from "../src/data/translations.ts";
import { makeApprovedRegistry, makeConflictRegistry, TEST_NOW } from "./fixtures/reference-fixtures.ts";

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

function planFor(request: AnswerRequest, corpus = prodCorpus): { plan: AnswerPlan; packet: EvidencePacket } {
  const packet = retrieve(answerRequestToQuery(request), corpus, translationRecords, 12, TEST_NOW);
  return { plan: planAnswer(request, packet, { now: TEST_NOW }), packet };
}

function corpusWithAuthority(reg = makeApprovedRegistry()) {
  return buildCorpus(systems, lists, creators, projectRegistryClaims(reg));
}

/**
 * A cooperative fake provider that composes a well-formed candidate from the
 * contract: every mandatory section, required substantive points ordered, no
 * optional overflow.
 */
function goodCandidate(contract: RenderContract): CompositionCandidate {
  const substantive = contract.permittedPoints.filter((p) =>
    ["household-method", "creator-experience", "direct-response", "definition"].includes(p.role),
  );
  const authoritative = contract.permittedPoints.filter((p) => p.role === "authoritative-guidance");
  const sections: CompositionCandidate["sections"] = [];
  if (substantive.length > 0)
    sections.push({ sectionTemplateId: "what-the-household-does", orderedPointIds: substantive.slice(0, contract.optionalPointCap + substantive.filter((p) => contract.mandatoryPointIds.includes(p.id)).length).map((p) => p.id) });
  if (authoritative.length > 0)
    sections.push({ sectionTemplateId: "what-reviewed-guidance-supports", orderedPointIds: authoritative.map((p) => p.id) });
  if (contract.mandatoryQualificationTexts.length > 0) sections.push({ sectionTemplateId: "important-limits", orderedPointIds: [] });
  if (contract.conflictsToDisclose.length > 0) sections.push({ sectionTemplateId: "where-sources-disagree", orderedPointIds: [] });
  if (mustMissing(contract)) sections.push({ sectionTemplateId: "what-is-missing", orderedPointIds: [] });
  if (contract.escalationType !== "none") sections.push({ sectionTemplateId: "next-safe-step", orderedPointIds: [] });
  sections.push({ sectionTemplateId: "sources", orderedPointIds: [] });

  return {
    schemaVersion: "composition-candidate/1",
    planId: contract.planId,
    planFingerprint: contract.planFingerprint,
    styleId: contract.allowedStyleIds[0],
    titleTemplateId: contract.allowedTitleTemplateIds[0],
    introTemplateId: contract.allowedIntroTemplateIds[0],
    sections,
    conclusionTemplateId: contract.allowedConclusionTemplateIds[0],
    citationStyleId: contract.allowedCitationStyleIds[0],
    refusal: false,
  };
}

function mustMissing(c: RenderContract): boolean {
  return ["abstain-authoritative-support-required", "abstain-insufficient-evidence", "escalate-to-qualified-professional"].includes(c.disposition);
}

function fakeProvider(fn: (c: RenderContract) => ProviderResult | Promise<ProviderResult>): ModelCompositionProvider {
  return {
    name: "fake",
    configuration: () => ({ provider: "fake", model: "fake-model-1", credentialsPresent: true, enabled: true, localOnly: true }),
    compose: async (c) => fn(c),
  };
}

const okResult = (candidate: CompositionCandidate): ProviderResult => ({
  ok: true, candidate, meta: { provider: "fake", model: "fake-model-1", requestId: "req_1", latencyMs: 5, tokenUsage: { input: 100, output: 50 } },
});

// -------------------------------------------------- RenderContract

test("RenderContract contains no packet, no scores, no commerce", () => {
  const { plan } = planFor(req({ question: "kids help with laundry one washer" }));
  const c = buildRenderContract(plan);
  const s = JSON.stringify(c);
  assert.ok(!/"score"|"rank"|"hits"|"indexTokens"|"retriev/i.test(s), "no retrieval internals");
  // Commerce scan EXCLUDES prohibitedAssertionCodes (which legitimately name
  // "affiliate"/"retailer" as things NOT to do — a safety instruction, not data).
  const withoutCodes = { ...c, prohibitedAssertionCodes: [] };
  const s2 = JSON.stringify(withoutCodes);
  assert.ok(!/offer|affiliate|retailer|\bprice\b|https?:\/\//i.test(s2), "no commerce data or URLs");
  assert.ok(!("hits" in (c as unknown as Record<string, unknown>)), "no packet hits");
});

test("RenderContract fingerprint is deterministic", () => {
  const { plan } = planFor(req({ question: "kids help with laundry one washer" }));
  assert.equal(buildRenderContract(plan).contractFingerprint, buildRenderContract(plan).contractFingerprint);
});

test("buildRenderContract refuses an invalid plan", () => {
  const { plan } = planFor(req({ question: "kids help with laundry one washer" }));
  const bad = { ...plan, validation: { valid: false, errors: [{ code: "x", message: "y" }], warnings: [] } };
  assert.throws(() => buildRenderContract(bad));
});

test("candidate JSON schema constrains point IDs and template IDs", () => {
  const { plan } = planFor(req({ question: "kids help with laundry one washer" }));
  const c = buildRenderContract(plan);
  const schema = buildCandidateJsonSchema(c) as Record<string, unknown>;
  const props = (schema.properties as Record<string, { enum?: string[] }>);
  assert.deepEqual(props.planFingerprint.enum, [c.planFingerprint]);
  assert.deepEqual(props.styleId.enum, c.allowedStyleIds);
});

// -------------------------------------------------- valid candidate → compile → validate

test("valid candidate compiles; propositions & citations are exact", () => {
  const { plan } = planFor(req({ question: "How can kids help with laundry when a family has one washer?" }));
  const contract = buildRenderContract(plan);
  const candidate = goodCandidate(contract);
  assert.equal(validateCompositionCandidate(candidate, contract).valid, true);
  const rendered = compileRenderedAnswer(plan, candidate, { renderer: "test", provider: "fake", model: "fake-model-1" });
  const v = validateRenderedAnswer(rendered, plan, candidate);
  assert.equal(v.valid, true, JSON.stringify(v.errors));
  // every rendered point uses the EXACT wrapper text
  for (const s of rendered.sections) for (const it of s.items.filter((i) => i.kind === "point")) {
    const p = plan.permittedAnswerPoints.find((x) => x.id === it.pointId)!;
    assert.equal(it.text, wrapPointText(p));
  }
  // citations come from the plan
  const citeLabels = rendered.citations.map((c) => c.label);
  assert.deepEqual(citeLabels, plan.citationMap.map((c) => c.label));
});

test("candidate & final fingerprints are stable", () => {
  const { plan } = planFor(req({ question: "kids help with laundry one washer" }));
  const contract = buildRenderContract(plan);
  const cand = goodCandidate(contract);
  assert.equal(fingerprintCandidate(cand), fingerprintCandidate(cand));
  const meta = { renderer: "test", provider: "fake", model: "fake-model-1" };
  assert.equal(compileRenderedAnswer(plan, cand, meta).finalFingerprint, compileRenderedAnswer(plan, cand, meta).finalFingerprint);
});

// -------------------------------------------------- adversarial candidates (fail closed)

function mutate(base: CompositionCandidate, fn: (c: CompositionCandidate) => void): CompositionCandidate {
  const c = structuredClone(base);
  fn(c);
  return c;
}

test("adversarial candidates all fail closed", () => {
  const { plan } = planFor(req({ question: "How can kids help with laundry when a family has one washer?" }));
  const contract = buildRenderContract(plan);
  const base = goodCandidate(contract);
  const anyPoint = base.sections.find((s) => s.orderedPointIds.length > 0)!.orderedPointIds[0];

  const cases: [string, CompositionCandidate][] = [
    ["change plan fingerprint", mutate(base, (c) => (c.planFingerprint = "deadbeef"))],
    ["nonexistent point", mutate(base, (c) => c.sections[0].orderedPointIds.push("pt:does-not-exist"))],
    ["duplicate point", mutate(base, (c) => c.sections[0].orderedPointIds.push(anyPoint))],
    ["invalid template", mutate(base, (c) => (c.sections[0].sectionTemplateId = "totally-made-up"))],
    ["invalid style", mutate(base, (c) => (c.styleId = "neon-loud"))],
    ["omit sources", mutate(base, (c) => (c.sections = c.sections.filter((s) => s.sectionTemplateId !== "sources")))],
    ["mandatory section carries points", mutate(base, (c) => { const s = c.sections.find((x) => x.sectionTemplateId === "sources")!; s.orderedPointIds = [anyPoint]; })],
    ["refusal with content", mutate(base, (c) => (c.refusal = true))],
    ["incompatible section", mutate(base, (c) => (c.sections[0].sectionTemplateId = "what-reviewed-guidance-supports"))],
  ];

  for (const [name, cand] of cases) {
    const v = validateCompositionCandidate(cand, contract);
    assert.equal(v.valid, false, `expected rejection: ${name}`);
  }
});

test("optional-cap exceeded fails", () => {
  const { plan } = planFor(req({ question: "How can kids help with laundry when a family has one washer?", depth: "brief" }));
  const contract = buildRenderContract(plan);
  const optional = contract.optionalPointIds;
  const cand = mutate(goodCandidate(contract), (c) => {
    const s = c.sections.find((x) => x.sectionTemplateId === "what-the-household-does");
    if (s) s.orderedPointIds = [...new Set([...s.orderedPointIds, ...optional])];
  });
  const v = validateCompositionCandidate(cand, contract);
  assert.ok(v.errors.some((e) => e.code === "optional-cap-exceeded" || e.code === "duplicate-point"));
});

test("conflict disposition requires the conflict section", () => {
  const { plan } = planFor(req({ question: "chores four year old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" }), corpusWithAuthority(makeConflictRegistry()));
  const contract = buildRenderContract(plan);
  const cand = mutate(goodCandidate(contract), (c) => (c.sections = c.sections.filter((s) => s.sectionTemplateId !== "where-sources-disagree")));
  const v = validateCompositionCandidate(cand, contract);
  assert.equal(v.valid, false);
  assert.ok(v.errors.some((e) => e.code === "conflict-section-omitted"));
});

// -------------------------------------------------- final-answer tamper detection

test("final validation rejects an altered proposition", () => {
  const { plan } = planFor(req({ question: "How can kids help with laundry when a family has one washer?" }));
  const contract = buildRenderContract(plan);
  const cand = goodCandidate(contract);
  const rendered = compileRenderedAnswer(plan, cand, { renderer: "t", provider: "f", model: "m" });
  const item = rendered.sections.flatMap((s) => s.items).find((i) => i.kind === "point")!;
  item.text = item.text + " and also you should buy premium detergent";
  const v = validateRenderedAnswer(rendered, plan, cand);
  assert.equal(v.valid, false);
  assert.ok(v.errors.some((e) => e.code === "altered-proposition" || e.code === "final-fingerprint-mismatch"));
});

test("final validation rejects HTML/script injection and untrusted links", () => {
  const { plan } = planFor(req({ question: "How can kids help with laundry when a family has one washer?" }));
  const contract = buildRenderContract(plan);
  const cand = goodCandidate(contract);
  const rendered = compileRenderedAnswer(plan, cand, { renderer: "t", provider: "f", model: "m" });
  rendered.intro = "<script>alert(1)</script> visit https://evil.example.com";
  const v = validateRenderedAnswer(rendered, plan, cand);
  assert.equal(v.valid, false);
  assert.ok(v.errors.some((e) => e.code === "html-or-script-injection"));
});

// -------------------------------------------------- pipeline outcomes

test("pipeline with a good provider renders and validates", async () => {
  const out = await executeConstrainedRendering(req({ question: "How can kids help with laundry when a family has one washer?" }), {
    corpus: prodCorpus, translations: translationRecords, now: TEST_NOW,
    provider: fakeProvider((c) => okResult(goodCandidate(c))),
  });
  assert.equal(out.status, "rendered");
  if (out.status === "rendered") {
    assert.equal(out.rendered.validation?.valid, true);
    assert.equal(out.rendered.providerMeta.model, "fake-model-1");
  }
});

test("pipeline falls back on provider refusal", async () => {
  const out = await executeConstrainedRendering(req({ question: "kids help with laundry one washer" }), {
    corpus: prodCorpus, translations: translationRecords, now: TEST_NOW,
    provider: fakeProvider(() => ({ ok: false, capability: "provider-refusal", reason: "refused" })),
  });
  assert.equal(out.status, "fallback");
});

test("pipeline falls back on timeout / error / malformed", async () => {
  for (const cap of ["timeout", "provider-error", "invalid-structured-output"] as const) {
    const out = await executeConstrainedRendering(req({ question: "kids help with laundry one washer" }), {
      corpus: prodCorpus, translations: translationRecords, now: TEST_NOW,
      provider: fakeProvider(() => ({ ok: false, capability: cap, reason: cap })),
    });
    assert.equal(out.status, "fallback");
  }
});

test("pipeline falls back when a candidate is rejected (never partial)", async () => {
  const out = await executeConstrainedRendering(req({ question: "kids help with laundry one washer" }), {
    corpus: prodCorpus, translations: translationRecords, now: TEST_NOW,
    provider: fakeProvider((c) => okResult(mutate(goodCandidate(c), (x) => (x.planFingerprint = "bad")))),
  });
  assert.equal(out.status, "fallback");
  if (out.status === "fallback") assert.ok((out.rejectionCodes ?? []).includes("plan-fingerprint-mismatch"));
});

test("pipeline with no provider uses the deterministic fallback", async () => {
  const out = await executeConstrainedRendering(req({ question: "kids help with laundry one washer" }), { corpus: prodCorpus, translations: translationRecords, now: TEST_NOW });
  assert.equal(out.status, "fallback");
  if (out.status === "fallback") assert.ok(out.preview.text.includes("## Disposition"));
});

test("one provider attempt per action (no retry)", async () => {
  let calls = 0;
  await executeConstrainedRendering(req({ question: "kids help with laundry one washer" }), {
    corpus: prodCorpus, translations: translationRecords, now: TEST_NOW,
    provider: fakeProvider((c) => { calls++; return okResult(goodCandidate(c)); }),
  });
  assert.equal(calls, 1);
});

test("celiac medical: model cannot manufacture authority; escalation exact", async () => {
  const out = await executeConstrainedRendering(req({ question: "How does this family keep a shared kitchen safer for a child with celiac?", guidanceRisk: "medical", systemScope: "celiac-safe-pantry-reset" }), {
    corpus: prodCorpus, translations: translationRecords, now: TEST_NOW,
    provider: fakeProvider((c) => okResult(goodCandidate(c))),
  });
  assert.equal(out.status, "rendered");
  if (out.status === "rendered") {
    assert.equal(out.rendered.escalationDisclosure, out.plan.escalation.requiredWording);
    assert.ok(out.rendered.sections.every((s) => s.templateId !== "what-reviewed-guidance-supports"), "no authoritative section without authority");
  }
});

test("eligible authority: supported guidance renders exact claim proposition", async () => {
  const out = await executeConstrainedRendering(req({ question: "chores appropriate for a four-year-old", developmentalStage: "four-year-old", householdDomain: "child development", jurisdiction: "US", guidanceRisk: "developmental" }), {
    corpus: corpusWithAuthority(), translations: translationRecords, now: TEST_NOW,
    provider: fakeProvider((c) => okResult(goodCandidate(c))),
  });
  assert.equal(out.status, "rendered");
  if (out.status === "rendered") {
    const auth = out.rendered.sections.find((s) => s.templateId === "what-reviewed-guidance-supports");
    assert.ok(auth && auth.items.length > 0);
    const claimPoint = out.plan.authoritativePoints[0];
    assert.ok(auth!.items.some((i) => i.text.includes(claimPoint.proposition)));
  }
});
