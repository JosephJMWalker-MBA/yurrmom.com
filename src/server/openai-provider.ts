/**
 * OpenAI composition provider (Phase 7) — SERVER ONLY.
 *
 * The only vendor-specific code. Uses the official OpenAI SDK's Responses API
 * with strict JSON-schema Structured Outputs. The SDK is imported lazily inside
 * the default client factory, so tests (which inject a fake client) never load
 * it and never make a network call.
 *
 * Hard constraints (Phase 7): store:false, no tools, no web/file/code search,
 * no background mode, no streaming, bounded output tokens, a request timeout,
 * exactly one attempt, no retry, no conversation state, no base-URL override.
 * The API key is read from the environment on the server and never leaves it.
 */
import {
  buildCandidateJsonSchema,
  buildProviderInstruction,
  COMPOSITION_CANDIDATE_SCHEMA,
  type CompositionCandidate,
  type ModelCompositionProvider,
  type ProviderConfiguration,
  type ProviderResult,
  type RenderContract,
} from "@/domain/answer";
import { RENDER_LIMITS } from "./render-config";

/** Minimal shape we use — avoids importing SDK types into the signature. */
interface OpenAILikeClient {
  responses: {
    create(args: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<OpenAIResponseLike>;
  };
}
interface OpenAIResponseLike {
  id?: string;
  _request_id?: string;
  status?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export interface OpenAIProviderOptions {
  model: string;
  apiKey: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  /** Injectable for tests — defaults to a lazily-imported real OpenAI client. */
  clientFactory?: () => Promise<OpenAILikeClient>;
  enabled?: boolean;
}

export class OpenAICompositionProvider implements ModelCompositionProvider {
  name = "openai";
  private readonly model: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxOutputTokens: number;
  private readonly clientFactory: () => Promise<OpenAILikeClient>;
  private readonly enabled: boolean;

  constructor(opts: OpenAIProviderOptions) {
    this.model = opts.model;
    this.apiKey = opts.apiKey;
    this.timeoutMs = opts.timeoutMs ?? RENDER_LIMITS.providerTimeoutMs;
    this.maxOutputTokens = opts.maxOutputTokens ?? RENDER_LIMITS.maxOutputTokens;
    this.enabled = opts.enabled ?? true;
    this.clientFactory =
      opts.clientFactory ??
      (async () => {
        // Lazy import: the SDK never loads unless a real request is made.
        const mod = (await import("openai")) as unknown as { default: new (o: { apiKey: string }) => OpenAILikeClient };
        return new mod.default({ apiKey: this.apiKey });
      });
  }

  configuration(): ProviderConfiguration {
    return {
      provider: "openai",
      model: this.model,
      credentialsPresent: this.apiKey.length > 0,
      enabled: this.enabled && this.model.length > 0 && this.apiKey.length > 0,
      localOnly: true,
    };
  }

  async compose(contract: RenderContract): Promise<ProviderResult> {
    const instruction = buildProviderInstruction(contract);
    const schema = buildCandidateJsonSchema(contract);
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const client = await this.clientFactory();
      const response = await client.responses.create(
        {
          model: this.model,
          input: [
            { role: "system", content: instruction.system },
            { role: "user", content: instruction.developer },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "composition_candidate",
              schema,
              strict: true,
            },
          },
          store: false,
          max_output_tokens: this.maxOutputTokens,
          // Explicitly no tools, no web/file search, no background, no streaming.
          tools: [],
        },
        { signal: controller.signal },
      );

      const latencyMs = Date.now() - started;
      const requestId = response._request_id ?? response.id;

      if (response.status === "incomplete") {
        return fail("invalid-structured-output", "Provider returned an incomplete response.", requestId, latencyMs);
      }

      // Handle an explicit refusal content item.
      const refusalText = response.output
        ?.flatMap((o) => o.content ?? [])
        .find((c) => c.type === "refusal")?.refusal;
      if (refusalText) {
        return {
          ok: true,
          candidate: refusalCandidate(contract, refusalText),
          meta: { provider: "openai", model: this.model, requestId, latencyMs, tokenUsage: usage(response) },
        };
      }

      const text =
        response.output_text ??
        response.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text;
      if (!text) {
        return fail("invalid-structured-output", "Provider returned no structured output.", requestId, latencyMs);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return fail("invalid-structured-output", "Provider output was not valid JSON.", requestId, latencyMs);
      }

      const candidate = coerceCandidate(parsed);
      if (!candidate) {
        return fail("invalid-structured-output", "Provider output did not match the candidate shape.", requestId, latencyMs);
      }

      return {
        ok: true,
        candidate,
        meta: { provider: "openai", model: this.model, requestId, latencyMs, tokenUsage: usage(response) },
      };
    } catch (e) {
      const latencyMs = Date.now() - started;
      if (e instanceof Error && (e.name === "AbortError" || /abort/i.test(e.message))) {
        return fail("timeout", "Provider request timed out.", undefined, latencyMs);
      }
      // Never leak a stack trace or credentials; return a safe reason.
      const status = (e as { status?: number })?.status;
      const reason =
        status === 401 ? "Invalid provider credentials." :
        status === 404 ? "Configured model is unavailable." :
        status === 429 ? "Provider rate limit reached." :
        "Provider request failed.";
      return fail("provider-error", reason, undefined, latencyMs);
    } finally {
      clearTimeout(timer);
    }
  }
}

function fail(
  capability: Extract<ProviderResult, { ok: false }>["capability"],
  reason: string,
  requestId?: string,
  latencyMs?: number,
): ProviderResult {
  return { ok: false, capability, reason, requestId, latencyMs };
}

function usage(r: OpenAIResponseLike): { input?: number; output?: number } | undefined {
  if (!r.usage) return undefined;
  return { input: r.usage.input_tokens, output: r.usage.output_tokens };
}

function refusalCandidate(contract: RenderContract, reason: string): CompositionCandidate {
  return {
    schemaVersion: COMPOSITION_CANDIDATE_SCHEMA,
    planId: contract.planId,
    planFingerprint: contract.planFingerprint,
    styleId: contract.allowedStyleIds[0],
    titleTemplateId: contract.allowedTitleTemplateIds[0],
    introTemplateId: contract.allowedIntroTemplateIds[0],
    sections: [],
    conclusionTemplateId: contract.allowedConclusionTemplateIds[0],
    citationStyleId: contract.allowedCitationStyleIds[0],
    refusal: true,
    refusalReason: reason.slice(0, 200),
  };
}

/** Shape-coerce parsed JSON into a CompositionCandidate (no trust — validated later). */
function coerceCandidate(parsed: unknown): CompositionCandidate | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  if (
    typeof p.schemaVersion !== "string" ||
    typeof p.planId !== "string" ||
    typeof p.planFingerprint !== "string" ||
    typeof p.styleId !== "string" ||
    typeof p.titleTemplateId !== "string" ||
    typeof p.introTemplateId !== "string" ||
    !Array.isArray(p.sections) ||
    typeof p.conclusionTemplateId !== "string" ||
    typeof p.citationStyleId !== "string" ||
    typeof p.refusal !== "boolean"
  ) {
    return null;
  }
  const sections = (p.sections as unknown[]).map((s) => {
    const so = s as Record<string, unknown>;
    return {
      sectionTemplateId: String(so.sectionTemplateId ?? ""),
      orderedPointIds: Array.isArray(so.orderedPointIds) ? (so.orderedPointIds as unknown[]).map(String) : [],
    };
  });
  return {
    schemaVersion: p.schemaVersion,
    planId: p.planId,
    planFingerprint: p.planFingerprint,
    styleId: p.styleId,
    titleTemplateId: p.titleTemplateId,
    introTemplateId: p.introTemplateId,
    sections,
    conclusionTemplateId: p.conclusionTemplateId,
    citationStyleId: p.citationStyleId,
    refusal: p.refusal,
    refusalReason: typeof p.refusalReason === "string" ? p.refusalReason : undefined,
  };
}
