/**
 * Phase 7 — OpenAI adapter request-shape tests. NO network, NO SDK import:
 * a fake client is injected and records the request arguments.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { buildCorpus, retrieve } from "../src/domain/knowledge/index.ts";
import {
  answerRequestToQuery,
  buildRenderContract,
  planAnswer,
  type AnswerRequest,
} from "../src/domain/answer/index.ts";
import { OpenAICompositionProvider } from "../src/server/openai-provider.ts";
import { systems } from "../src/data/systems.ts";
import { lists } from "../src/data/lists.ts";
import { creators } from "../src/data/creators.ts";
import { translationRecords } from "../src/data/translations.ts";
import { TEST_NOW } from "./fixtures/reference-fixtures.ts";

const corpus = buildCorpus(systems, lists, creators);

function contractFor(over: Partial<AnswerRequest> = {}) {
  const request: AnswerRequest = {
    question: "How can kids help with laundry when a family has one washer?",
    requestedLocale: "en", representationPolicy: "public-safe", guidanceRisk: "ordinary-household", depth: "standard",
    ...over,
  };
  const packet = retrieve(answerRequestToQuery(request), corpus, translationRecords, 12, TEST_NOW);
  const plan = planAnswer(request, packet, { now: TEST_NOW });
  return buildRenderContract(plan);
}

function fakeClientCapturing(record: { args?: Record<string, unknown> }) {
  return async () => ({
    responses: {
      create: async (args: Record<string, unknown>) => {
        record.args = args;
        // Return a minimal well-formed structured output (refusal, to avoid
        // needing a full candidate) — the shape test only inspects the request.
        const contractPlanId = String((JSON.parse(String((args.input as { content: string }[])[1].content).split("RENDER_CONTRACT:\n")[1])).planId);
        void contractPlanId;
        return {
          id: "resp_123",
          _request_id: "req_abc",
          status: "completed",
          output_text: JSON.stringify({ refusal: true }),
          usage: { input_tokens: 10, output_tokens: 2 },
        };
      },
    },
  });
}

test("adapter sends store:false, no tools, strict json_schema, and the EXACT model", async () => {
  const contract = contractFor();
  const rec: { args?: Record<string, unknown> } = {};
  const provider = new OpenAICompositionProvider({
    model: "test-model-xyz",
    apiKey: "sk-fake",
    clientFactory: fakeClientCapturing(rec),
  });
  await provider.compose(contract);
  const a = rec.args!;
  assert.equal(a.model, "test-model-xyz", "configured model used exactly");
  assert.equal(a.store, false, "store:false");
  assert.deepEqual(a.tools, [], "no tools");
  assert.ok(typeof a.max_output_tokens === "number", "bounded output tokens");
  const format = (a.text as { format?: { type?: string; strict?: boolean; schema?: unknown } }).format!;
  assert.equal(format.type, "json_schema");
  assert.equal(format.strict, true, "strict structured outputs");
  assert.ok(format.schema, "schema supplied");
  // no streaming / background / base url
  assert.ok(!("stream" in a), "no streaming");
  assert.ok(!("background" in a), "no background mode");
  assert.ok(!("previous_response_id" in a), "no conversation chaining");
});

test("adapter never hard-codes a default model (configuration reflects the configured one)", () => {
  const provider = new OpenAICompositionProvider({ model: "explicit-model", apiKey: "sk-fake", clientFactory: async () => ({ responses: { create: async () => ({}) } }) });
  assert.equal(provider.configuration().model, "explicit-model");
  const empty = new OpenAICompositionProvider({ model: "", apiKey: "sk-fake", clientFactory: async () => ({ responses: { create: async () => ({}) } }) });
  assert.equal(empty.configuration().enabled, false, "no model → not enabled");
});

test("adapter maps a refusal content item to a refusal candidate", async () => {
  const contract = contractFor();
  const provider = new OpenAICompositionProvider({
    model: "m", apiKey: "sk-fake",
    clientFactory: async () => ({ responses: { create: async () => ({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "cannot comply" }] }] }) } }),
  });
  const res = await provider.compose(contract);
  assert.ok(res.ok && res.candidate.refusal === true);
});

test("adapter maps malformed JSON to invalid-structured-output failure", async () => {
  const contract = contractFor();
  const provider = new OpenAICompositionProvider({
    model: "m", apiKey: "sk-fake",
    clientFactory: async () => ({ responses: { create: async () => ({ status: "completed", output_text: "{ not json" }) } }),
  });
  const res = await provider.compose(contract);
  assert.ok(!res.ok && res.capability === "invalid-structured-output");
});

test("adapter maps an incomplete response to a failure", async () => {
  const contract = contractFor();
  const provider = new OpenAICompositionProvider({
    model: "m", apiKey: "sk-fake",
    clientFactory: async () => ({ responses: { create: async () => ({ status: "incomplete" }) } }),
  });
  const res = await provider.compose(contract);
  assert.ok(!res.ok && res.capability === "invalid-structured-output");
});

test("adapter maps a 401 to a safe invalid-credentials reason (no stack/secret)", async () => {
  const contract = contractFor();
  const provider = new OpenAICompositionProvider({
    model: "m", apiKey: "sk-fake",
    clientFactory: async () => ({ responses: { create: async () => { const e = new Error("boom"); (e as { status?: number }).status = 401; throw e; } } }),
  });
  const res = await provider.compose(contract);
  assert.ok(!res.ok && res.capability === "provider-error");
  assert.ok(/credential/i.test(res.reason) && !/boom/.test(res.reason));
});

test("adapter times out via abort", async () => {
  const contract = contractFor();
  const provider = new OpenAICompositionProvider({
    model: "m", apiKey: "sk-fake", timeoutMs: 10,
    clientFactory: async () => ({ responses: { create: (_a: unknown, opts?: { signal?: AbortSignal }) => new Promise((_res, rej) => { opts?.signal?.addEventListener("abort", () => { const e = new Error("aborted"); e.name = "AbortError"; rej(e); }); }) } }),
  });
  const res = await provider.compose(contract);
  assert.ok(!res.ok && res.capability === "timeout");
});
