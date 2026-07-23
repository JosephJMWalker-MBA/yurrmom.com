# 12 — Constrained Model-Assisted Rendering Contract (Phase 7)

Status: implemented on branch `PHASE-7`. Aligned with `src/domain/answer/`
(`templates`, `render-contract`, `candidate`, `validate-candidate`, `compile`,
`validate-rendered`, `provider`), `src/server/`
(`render-config`, `render-pipeline`, `openai-provider`, `diagnostics`),
`src/app/api/studio/render-answer/route.ts`, the Plan Inspector in
`src/ui/studio/evidence-explorer.tsx`, `tests/render.test.ts`, and
`tests/openai-adapter.test.ts`.

## Purpose

Add the first live language-model integration as a **replaceable presentation
component**. The model may organize and compose from pre-approved plan elements;
it may not retrieve, plan, judge authority, classify risk, generate citations,
write trusted factual propositions, or answer independently. The trusted final
answer is compiled **deterministically** from the AnswerPlan.

## Why the model is only a composition selector

Free-form model prose could paraphrase evidence, drop a limitation, soften a
conflict, or invent authority. So the model returns a **structured
CompositionCandidate** — IDs only (styles, templates, ordered point IDs) plus a
refusal flag. It selects permitted optional points, orders permitted points,
groups them into sections, and picks reviewed template/style/citation IDs. It
adds **no factual sentences**. Every sentence in the output is an exact
`AnswerPoint.proposition` (or exact limitation/conflict/escalation text) wrapped
by a fixed template; citations come from `AnswerPlan.citationMap`.

## Trust-boundary diagram

```
Browser ──AnswerRequest(JSON only)──▶ /api/studio/render-answer (server, local-dev only)
                                          │
      (server rebuilds from TRUSTED data; never trusts a client plan)
                                          ▼
   retrieve() → EvidencePacket → planAnswer() → validateAnswerPlan()   [Phase 4–6]
                                          │  (stop if invalid)
                                          ▼
                          buildRenderContract(plan)  ── minimal, no packet/scores/commerce
                                          ▼
   ModelCompositionProvider.compose(RenderContract)  ── ONE attempt, no tools, no retry
                                          ▼
                       CompositionCandidate (IDs only, untrusted)
                                          ▼
             validateCompositionCandidate(candidate, contract)   ── fail closed
                                          ▼
                 compileRenderedAnswer(plan, candidate)   ── exact props + citations
                                          ▼
             validateRenderedAnswer(rendered, plan, candidate)   ── mechanical
                                          ▼
                 reject → deterministic preview fallback   |   accept → display
```

The provider receives **only** the RenderContract. It never sees canonical
creator objects, a raw EvidencePacket, the reference registry, retailer offers,
affiliate metadata, localStorage, credentials, or hidden state.

## Server pipeline

`executeConstrainedRendering(answerRequest, deps)` (`src/server/render-pipeline.ts`):
validates the request upstream (route), builds the KnowledgeQuery, runs
production retrieval, plans, **revalidates the plan with `validateAnswerPlan`
(never trusting `plan.validation` from elsewhere)**, stops if invalid, builds the
RenderContract, invokes the provider once, handles refusal/failure by falling
back, validates the candidate, compiles, validates the final answer, and returns
`rendered` / `fallback` / `plan-invalid`. It reuses Phase 4–6 functions and
duplicates none.

## RenderContract

Derived only from a **valid** plan (`buildRenderContract` throws otherwise).
Contains: schema version, plan ID/fingerprint, policy version, user question,
requested locale, communication depth, disposition, coverage, permitted points
(id, exact proposition, role, support class, required/optional, prescriptive
flag, citation labels, applicability, warnings), mandatory/optional/prohibited
point IDs, lived-experience & authoritative availability, conflicts to disclose,
mandatory qualification texts, required warnings, escalation type + exact
wording, prohibited assertion codes, the optional-point cap, and the allowed
style/title/intro/section/conclusion/citation-style menus (title/intro menus are
constrained by disposition). It contains **no retrieval scores, no packet, no
commerce data**, and no instruction to "improve/expand/complete" evidence.

## CompositionCandidate

`{ schemaVersion, planId, planFingerprint, styleId, titleTemplateId,
introTemplateId, sections: [{ sectionTemplateId, orderedPointIds }],
conclusionTemplateId, citationStyleId, refusal, refusalReason? }`. It supplies
**no** citation labels, propositions, warnings, qualifications, escalation
wording, attribution, URLs, medical/legal text, markdown, HTML, JS, or tool
requests. `buildCandidateJsonSchema(contract)` produces strict Structured-Output
JSON Schema whose point-ID and template-ID fields are enum-constrained to the
current plan's actual values.

## Fixed templates

A small reviewed registry (`templates.ts`): styles `warm-clear | plain-direct |
calm-editorial`; titles `question-focused | household-exploration |
qualified-guidance | insufficient-evidence | professional-escalation |
conflicting-evidence`; intros `direct-opening | experience-framing | scope-first
| abstention-first | conflict-first`; sections `what-the-household-does |
what-reviewed-guidance-supports | important-limits | what-is-missing |
where-sources-disagree | next-safe-step | sources`; conclusions `no-conclusion |
experience-not-universal | scope-reminder | professional-follow-up |
evidence-insufficient`. Substantive sections are model-filled; the rest are
compiler-owned (content from trusted plan fields). Templates are deterministic
functions over trusted fields; the model picks IDs, never text.

## Candidate validation

`validateCompositionCandidate` fails closed and detects: schema/plan-ID/
fingerprint mismatch; unknown or disposition-inappropriate style/title/intro/
conclusion/section IDs; unknown/absent/prohibited/duplicate points; incompatible
section placement; lived-experience-when-disallowed; authoritative-without-
support; prescriptive-when-prohibited; optional-cap exceeded (by depth: brief 2 /
standard 4 / detailed 8); required conflict/missing-evidence/escalation/limits/
sources sections omitted; refusal-with-content; empty composition; unsupported
citation style; mandatory-section-carrying-points. It never repairs.

## Deterministic compilation

`compileRenderedAnswer(plan, candidate, providerMeta)` renders each substantive
point as its **exact** proposition wrapped by role: creator experience → `One
household reports: {proposition} [n]`; authoritative → `{proposition} [n]`;
limitation → `Important limitation: {text}`; missing/conflict/escalation → exact
text. Citations are taken from `AnswerPlan.citationMap`, never the candidate. The
result carries schema version, IDs, plan/candidate/final fingerprints, title,
intro, sections, conclusion, citations, mandatory qualifications, escalation
disclosure, safe provider metadata, and a final fingerprint (volatile provider
latency/requestId are excluded from the content hash).

## Final validation

`validateRenderedAnswer` is mechanical and detects: fingerprint mismatches;
missing/duplicate/unsupported points; altered proposition (re-derives the
template output); missing/altered/mis-attached citations; missing mandatory
qualification; altered escalation wording; omitted conflict/missing-authority/
translation caution; missing provider metadata; HTML/script injection; a link
not from the citation map; prescriptive phrasing where prohibited. A rejected
answer is never displayed partially.

## Provider interface

`ModelCompositionProvider` (async, provider-independent), plus
`ProviderConfiguration`, `ProviderCapability`
(`not-configured | disabled | local-development-only | ready | in-progress |
provider-refusal | invalid-structured-output | candidate-rejected |
validated-candidate | provider-error | timeout`), `ProviderResult`,
`ProviderFailure`, and the versioned `buildProviderInstruction(contract)`. The
domain layer imports **no** vendor SDK.

## OpenAI adapter

`src/server/openai-provider.ts` (server-only) implements the interface with the
official SDK's **Responses API** and strict JSON-schema Structured Outputs:
`store: false`, `tools: []`, no web/file/code search, no background mode, no
streaming, bounded `max_output_tokens`, a request timeout via `AbortController`,
**exactly one attempt** (no retry), no conversation state, no previous-response
chaining, no base-URL override. The SDK is imported lazily inside the default
client factory, so tests (which inject a fake client) never load it. The API key
is read from `OPENAI_API_KEY` on the server only. Handled: refusal, incomplete
response, timeout, HTTP failure, malformed output, schema/shape mismatch, missing
usage, request ID, 401/404/429 → safe reasons (no stack traces, no secrets).

## Environment setup

`.env.example` ships placeholders only. Local setup: (1) copy `.env.example` to
`.env.local` (gitignored); (2) `ANSWER_RENDERER_ENABLED=true`; (3)
`ANSWER_RENDERER_PROVIDER=openai`; (4) add `OPENAI_API_KEY`; (5) set
`OPENAI_MODEL` explicitly (**no default**); (6) restart `npm run dev`. When the
provider is not configured, the app continues on the deterministic preview.

## Privacy & logging

The provider receives only the minimal RenderContract. Diagnostics
(`src/server/diagnostics.ts`) retain only: timestamp, provider, configured model
string, plan/candidate/final fingerprints, status, latency, token usage, request
ID, validation error codes. Never logged: API keys, full prompts, full source
text, complete model outputs, user-entered household details, provider response
bodies. Dev console output is concise and redacted. No rendering history is
persisted.

## Cost & abuse boundaries

Production authentication does not exist, so: the live route is **disabled in
production**; the UI is labeled local-development-only; one click = at most one
model request; the button is disabled while a request is active; a request body
limit and a server timeout are enforced; there is no auto-render on query
changes, no retry, no batching, no pre-rendering, and the route is not a public
product feature.

## Studio interface

A contained "Live constrained renderer" section inside `/studio/intelligence`
(no new top-level nav). It shows feature status, the local-only notice, provider,
configured model string, plan validity, a render button (one request), the
in-progress state, the pipeline `Valid plan → provider → candidate validation →
deterministic compilation → final validation`, the rendered answer or labeled
fallback, candidate/final validation, rejection reasons, citations, safe provider
metadata, and fingerprints. It is analytical — no chat bubbles, avatar, typing
animation, multi-turn history, "Ask yurrmom.com", or language implying the model
reasoned over sources.

## Fallback behavior

The deterministic preview is always the fallback and is clearly labeled. It is
used when: the renderer is disabled, the provider is not configured, the API key
or model is missing, in production, or on provider refusal/timeout/error/
malformed output, or when the candidate or final output is invalid. A rejected
candidate is never partially displayed as trusted output.

## Production-disable policy

`getRenderFeatureStatus()` returns disabled whenever `NODE_ENV === "production"`,
the flag is off, the provider is not a live one, credentials are absent, or the
model is unset. `POST /api/studio/render-answer` returns `403 disabled-in-
production` in production.

## Known limitations

- The model can only reorder/group approved points and pick templates; it cannot
  compose multi-point narrative prose.
- Candidate JSON-schema enum constraints reduce but do not eliminate the need for
  deterministic validation, which remains the authority.
- The deterministic preview text is scaffolding, not polished prose.
- One provider is implemented (OpenAI); the interface supports others later.

## Deferred capabilities

Streaming, multi-turn, provider fallback chains, prompt-management SaaS,
fine-tuning, a public deployable endpoint, production auth, and any model role
beyond composition selection.
