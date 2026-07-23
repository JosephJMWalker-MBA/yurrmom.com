# 11 — Grounded Answer Plan Contract (Phase 6)

Status: implemented on branch `PHASE-6`. Aligned with `src/domain/answer/*`,
`src/data/answer-plan-cases.ts`, the Plan Inspector in
`src/ui/studio/evidence-explorer.tsx`, and `tests/answer-plan.test.ts`.

## Purpose

Transform an `EvidencePacket` (Phase 4/5) into a deterministic, inspectable
**`AnswerPlan`** — an *answer contract* that constrains what a future renderer
or language model may say. This phase does **not** produce conversational prose.
It defines which evidence-backed points may be communicated, how they must be
qualified, which citations support each point, which distinctions must stay
visible, when the system must abstain, when it must recommend professional
escalation, and what a renderer is forbidden from asserting.

Out of scope (not built): a chatbot, public assistant UI, LLM/model SDK,
generated natural-language answers, embeddings, vector search, model-based
summarization or risk classification, family/child profiling, diagnosis, legal
conclusions, emergency-service integration, live translation, external fetching,
personalization from private data, production auth.

## Why an AnswerPlan exists

A future model must never receive an EvidencePacket with only "answer helpfully."
It must receive a constrained plan that states what is supported, what kind of
support it is, what is uncertain, what limitations apply, what conflicts exist,
which citations must appear, whether advice is allowed, and when abstention or
escalation is required. **The model must not be allowed to outrun the evidence.**

## Request contract

`AnswerRequest` (`types.ts`) holds only caller-supplied fields: question,
requested locale, representation policy, guidance-risk category (**never
inferred**), optional household circumstances / developmental stage / domain /
constraints / task-or-skill / jurisdiction / system or creator scope, and a
communication depth (`brief | standard | detailed`). `answerRequestToQuery()`
builds the existing `KnowledgeQuery`; the planner reuses Phase 4 retrieval and
normalization rather than duplicating them.

## Disposition policy

Deterministic (`decideDisposition`):

- No hits / `insufficient` coverage → `abstain-insufficient-evidence`.
- Unresolved material conflict → `conflicted-guidance`.
- High-stakes with an eligible authoritative claim → `supported-guidance`.
- High-stakes, no eligible authority: `safety-critical` →
  `escalate-to-qualified-professional`; otherwise
  `abstain-authoritative-support-required`. In both cases an escalation
  directive is attached and prescriptive points are prohibited.
- Ordinary household: `sufficient` → `household-exploration`; `partial` →
  `qualified-household-exploration`. Creator experience is used **as
  experience**, never as universal instruction (creator points are never
  prescriptive).

High-stakes categories: medical, developmental, mental-health, legal,
safety-critical.

## AnswerPoint contract

Each `AnswerPoint` carries an id, role, proposition, support class, supporting
hit IDs, citation IDs, source/effective locale, applicability, limitations,
warnings, `prescriptiveAllowed`, and an omission rule (`required` /
`optional` / `prohibited-from-omission`). Roles: direct-response,
household-method, creator-experience, authoritative-guidance, definition,
limitation, caution, alternative, conflict, missing-evidence, escalation.
Support classes: creator-original, creator-approved-translation,
reviewed-translation, curated-authoritative, professional-experience,
platform-synthesis, unsupported. **No confidence or truth score exists.**

## Statement-derivation rules

No LLM or opaque summarizer manufactures points. Permitted sources: exact
`KnowledgeUnit.displayText`, structured list-item fields, routine/recipe
structure preserved by projection, approved curated-claim statements, exact
evidence-span text, and deterministic policy templates. Constructions are
conservative and mechanically checkable (exact excerpts, field-preserving
statements, deterministic wrappers). No broad paraphrase.

## Support ledger

For every point (`SupportLedgerEntry`): proposition, supporting hit IDs and unit
IDs, source object + version, support relation (`directly-states | supports |
defines | qualifies | limits | contradicts | illustrates | background-only`),
authoritative eligibility and interpretation level (when relevant), citation
IDs, support warnings. Rules enforced by the validator: `background-only` /
`illustrates` cannot support a prescriptive claim; lived experience cannot
support an authoritative point; editorial inference cannot be the sole
high-stakes support; a stale/withdrawn/unapproved/expired/out-of-scope claim
cannot support current authoritative guidance; **a match score is not a support
relation.**

## Citation map

Deterministic `CitationMap`: each entry has a stable label (`1`, `2`, …), the
hit and unit IDs, source object + version, title, attribution (creator/editor/
publisher/organization), source type, exact excerpt, evidence locator + hash
(when available), locale, translation status, review status, authoritative
eligibility, applicability, limitations, link, and licensing note. Labels are
sequential and stable for the same ordered packet + plan. A future renderer can
render `[1]` or "According to Dee Alvarez's household system…"; Phase 6 does not
generate final prose.

## Citation requirements

Every substantive point must have ≥1 citation unless it is a fixed platform
safety warning, abstention explanation, escalation directive, or missing-evidence
statement. Authoritative points must cite an eligible curated claim, its source
version, and ≥1 exact supporting `EvidenceSpan` with a complete locator.
Creator-experience points cite the creator-authored unit, its owning system +
version, the actual source locale, and translation status when translated.
**Citation laundering** (a citation attached to a proposition it does not
support) is rejected by the validator.

## Qualification and limitation rules

Deterministic aggregation of creator/curated limitations, exclusions,
jurisdiction limits, developmental applicability, household circumstances,
translation cautions, stale/unapproved translations, unresolved conflicts,
missing authority, and incomplete coverage. Distinct meanings are preserved;
only exact-equal strings are collapsed. Mandatory qualifications must appear in
any eventual answer (surfaced via `plan.limitations` and
`rendererConstraints.mandatoryQualificationTexts`).

## Conflict behavior

An unresolved `conflicts-with` relationship: makes each conflicting claim
ineligible, produces a mandatory conflict disclosure and a `conflict` point,
sets `mustDiscloseConflict`, and drives `conflicted-guidance`. Neither side may
be presented as uncontested. The validator fails a plan that omits a present
conflict. The platform never algorithmically resolves the disagreement.

## Abstention and escalation

`EscalationDirective`: type (`none | qualified-professional |
pediatric-or-developmental-professional | licensed-medical-professional |
licensed-mental-health-professional | qualified-legal-professional |
immediate-safety-response`), risk category, reason, neutral required wording
(no hotlines, no diagnosis), whether household examples may still be shown, and
whether prescriptive points are prohibited. Escalation is not a diagnosis.

## Prohibited assertions

Derived deterministically from packet + policy. Always includes: no universal
applicability, no score-as-truth, no affiliate-as-epistemic-superiority, no
child-character judgment. Conditionally: no diagnose (medical/mental-health), no
legal conclusion (legal), no experience-as-professional, no
translation-approval-implied / no exact-translation-equivalence, no omit
limitations, no omit conflicts, no authority-outside-scope, no
inference-as-direct, no absence-as-proof, and no unsupported high-stakes
prescription.

## Validation contract

`validateAnswerPlan(plan, packet)` never repairs; it returns structured errors +
warnings. It detects: point cites a hit not in the packet; citation does not map
to the point's support (laundering); substantive point uncited; authoritative
point without eligible authority or without exact evidence; high-stakes
prescriptive point without authority; stale/withdrawn/unapproved authority;
inference as sole high-stakes support; experience mislabeled as authority;
translation status omitted / caution omitted; conflict disclosure omitted;
mandatory limitation omitted; required abstention/escalation omitted; missing
required prohibition; packet-fingerprint mismatch; duplicate/unstable citation
labels.

## Fingerprints

`fingerprintPacket`, `planFingerprint`, and `citationMapFingerprint` use a
canonical, key-order-independent stringify + FNV-1a over stable content fields
only. **Timestamps are excluded.** A repeated request over an identical packet
and policy produces an identical plan except for an explicitly injected
`createdAt`. Commerce fields are structurally absent from units, so affiliate
value cannot enter any fingerprint.

## Renderer boundary

`AnswerRendererAdapter` accepts an `AnswerPlan` — **never** a raw EvidencePacket.
Capability states: `unavailable | deterministic-preview-only |
external-model-not-connected | review-required | validated-output-available`.
This phase ships only `DeterministicPreviewRenderer`: a structured, non-
conversational preview; no vendor SDK, no model call, no "Generate answer"
action, no provider config. It refuses to render an invalid plan.

## Studio Plan Inspector

A panel within `/studio/intelligence` (no new top-level nav item). A reviewer
runs/selects a packet, builds the deterministic plan, and inspects disposition,
authoritative points, lived experience (separated), qualifications, missing
evidence, conflicts, escalation, prohibited assertions, the citation map,
validation, and the deterministic preview. It is analytical — no chat bubbles,
avatars, typing indicators, "Ask yurrmom.com", or "Generate AI answer".

## Production vs test-fixture policy

Production requests run over production data, which contains no fabricated
authoritative sources — so the developmental and celiac-medical cases abstain /
escalate. Eligible-authority and conflict behavior is exercised only with the
Phase 5 test-only fictional fixtures (`tests/fixtures/reference-fixtures.ts`),
which never enter production corpus construction; a test asserts no `Fictional`
string appears in a production plan.

## Known limitations

- Propositions are conservative, field-preserving constructions; the planner
  does not compose multi-unit narratives.
- Support relations for creator content are assigned by unit kind, not by
  sentence-level analysis.
- Qualification de-duplication is exact-string only (by design, to preserve
  distinct meanings).
- The preview is deliberately non-conversational scaffolding, not prose.

## Deferred capabilities

A constrained model renderer behind the adapter; sentence-level entailment
checking; multi-unit synthesis under stricter proofs; locale-negotiated
rendering; and anything the phase excludes (chatbot, model/embedding SDKs,
answer-generation API, personalization).
