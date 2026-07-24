# 14 — Moderation, Curation & Platform Administration Contract (Phase 9)

Status: implemented on branch `PHASE-9`. Aligned with `src/domain/moderation/`
(`types`, `provenance`, `transitions`, `policy`, `votes`, `submit`, `public`,
`reports`, `queue`, `actions`, `featured`, `taxonomy`, `integrations`),
`src/data/moderation-seed.ts`, `src/data/moderation-repo.ts`,
`src/ui/client/use-public-roast.ts`, `src/ui/client/roast-board.tsx`,
`src/ui/studio/use-moderation.ts`, `src/ui/studio/admin/*`, the
`/studio/admin*` routes, and `tests/moderation.test.ts`.

## Purpose

The operational governance a creator platform needs before it can safely take
public submissions: receive roast submissions privately, receive reports,
prioritize a deterministic moderation queue, approve/remove/escalate with an
immutable audit trail, enforce fictional-subject provenance, manage prompts,
curate featured content, manage taxonomy, and inspect integration capability
honestly. This is a **device-local prototype** — not production moderation
infrastructure, and with **no automated moderation model** anywhere.

## Canonical roast vs. public projection

The internal `RoastPromptRecord` / `RoastEntryRecord` / `Report` /
`ModerationAction` objects are canonical governance state. The public `/roast`
page never consumes them directly — it consumes `projectPublicRoast(prompt,
entries, votes)`, which returns only an **active** prompt, its **approved**
entries (with a derived score), the validated fiction label, and public bridges.
It structurally excludes pending/removed/escalated entries, report details,
reporter references, moderator rationale, audit history, and internal notes. A
non-active prompt projects to `null`.

## Fictional-subject boundary

Roast subjects are fictional **by construction**. `FictionKind` is
`synthetic-illustration | ai-generated-fiction | archetype` — there is no
`real-person` variant, in the type system or the data. `FictionProvenance`
additionally carries a source note, attribution, a **fictional-subject
affirmation**, an **identifiable-person exclusion affirmation**, and a required
public label. `promptCanActivate` gates activation: an invalid provenance (or a
missing required label) blocks a prompt from becoming `active`.

## Entry lifecycle

Statuses: `pending → approved → removed → escalated`. New submissions are
**always `pending`** (`buildPendingEntry` has no status parameter). Transitions
are centralized in `transitions.ts`:

- `pending → approved | removed | escalated`
- `approved → removed | escalated`
- `removed → pending` (never straight to approved — must return through review)
- `escalated → pending | removed | approved` (**approved requires an explicit
  reviewed affirmation**)

Only `approved` entries ever project publicly.

## Submission

`buildPendingEntry` trims input, enforces min/max length, rejects
empty/whitespace and HTML/script, requires the fictional-target affirmation, and
returns a `pending`, never-public, never-auto-approved entry. The public board
shows the submitter their own pending entry, clearly labeled "pending review —
not public", and never implies publication succeeded or that a moderator has
seen it.

## Voting

`toggleVote` applies only to **approved** entries, at most one per entry per
local device (toggling removes it). The public score is always **derived**
(`deriveVoteScore` = baseline + live votes), never stored, never able to change
moderation priority or make pending content public.

## Reporting

A `Report` is an **allegation**, not a verdict. `createReport` never hides
content and guards against a single local reporter stacking duplicate **open**
reports for the same target+reason. Reporter references are internal only and
never reach the public projection. Reports remain inspectable after resolution.

## Moderation policy

`MODERATION_POLICY` (versioned, `moderation-policy/2026-07-1`) provides **review
criteria, not verdicts**. It distinguishes the fiction boundary, identifiable
real-person targeting, protected-trait attacks, harassment/cruelty, sexual
content, minor safety, PII/doxxing, threats/violence, spam/manipulation, and —
explicitly separate — *ordinary weak or unfunny* submissions. "Not funny" is not
a safety violation. The system never classifies intent, identity, illegality, or
protected-trait membership.

## Deterministic queue

`buildModerationQueue(store)` emits `QueueItem`s in explicit **bands** with a
stated reason — never an opaque score:

- **urgent** — PII/doxxing, minor-safety, threat/violence, or real-person
  reports; a prompt missing valid fiction provenance.
- **high** — hate/protected-trait, sexual-content, harassment reports; escalated
  entries.
- **normal** — new pending submissions; other open reports.
- **low** — spam/manipulation; draft prompts awaiting activation.

Within a band: **oldest-unresolved-first, then deterministic id**. Priority never
considers votes, popularity, follower count, affiliate value, controversy, or
engagement. Report volume is not truth — a report's band comes from its reason
category; stacking reports never escalates the band.

## Moderation actions & audit

Every consequential change flows through `actions.ts` (`moderateEntry`,
`resolveReport`, `setPromptStatus`, `setFeatured`, `mutateTaxonomy`). Each: (1)
requires a non-empty **rationale**, (2) checks the transition is legal, (3)
records the actual **prior and resulting** status, and (4) appends an immutable
`ModerationAction` with a monotonic `seq`. Existing actions are never edited or
deleted; operations return a **new** store (inputs immutable). Removal changes
state but preserves the entry and history. Approving resolves **only explicitly
selected** related reports. Escalation means "internal review required" — it is
not an accusation and triggers no external reporting. Timestamps are injectable
for deterministic tests.

## Prompt administration

Inspect prompts; a draft may activate only when `promptCanActivate` validates;
an active prompt may retire (staying historically inspectable but removed from
public discovery). Status changes are audited. No prompt imagery or character
copy is AI-generated, and no identifiable real-person sourcing is possible.

## Feature curation

`FeaturedPlacement` is a **separate** record — featuring never mutates a
canonical system or creator and implies no endorsement. Only `active` placements
within their `[startAt, endAt)` window render, in a deterministic order
(`displayOrder`, then id). Expired/retired placements never render.
Feature/unfeature/reorder require a rationale and an audit event. Affiliate
earnings and follower popularity never influence order.

## Taxonomy management

`TaxonomyTerm` records the facet families systems already use. Administration
**never rewrites canonical system content**. Duplicate canonical keys and
replacement loops are rejected (`validateTaxonomy`). Deprecating a term may
suggest a replacement but mutates nothing. Usage is **derived** from canonical
systems (`deriveTaxonomyUsage` over `facetsOf`), never entered by hand. Ontology
terminology stays inside admin tools.

## Integration capability overview

`describeIntegrations(signals)` builds a read-only, honest, local-only overview
of every boundary: retailer links, distribution destinations, model renderer,
translation, reference ingestion, fulfillment, payment, authentication, media
storage. Capability truth is sourced from the actual adapters where one exists
(the distribution destination registry; `getRenderFeatureStatus()` for the
model renderer) rather than duplicated as UI copy. **No secret is ever shown** —
`credentialsConfigured` is a boolean only; keys, tokens, and values never
appear. No integration reports a capability the app lacks; nothing is
`connected-publishable`.

## Repositories & local persistence

`LocalModerationRepository` mirrors the reference/distribution repos: one
device-local `localStorage` store behind an interface (`load`/`save`/`reset`),
seeded from the fixtures and **relabeled `local-device`**, corruption-safe
(malformed payload → fresh seed), with deterministic reset. There is no server,
database, shared moderation, or production auth. The interface is the single
replacement point for a future backend. The public projection is computed
independently of storage internals.

## Privacy

Reporter identity/details never appear publicly or in any projection. Moderator
rationale and audit history are admin-only. Removed content is never shown
publicly (but is preserved in the record). Escalation is never surfaced as an
accusation.

## Safety constraints

The system never: infers whether a named person is real, searches for a person,
decides protected-trait membership, detects age from text, classifies illegal
content, claims a report is verified, exposes reporter/moderator data, exposes
removed content publicly, erases audit history, turns escalation into an
accusation, auto-reports externally, treats report volume or votes as proof,
lets roast fiction enter household-guidance retrieval, lets moderation fixtures
enter canonical household knowledge, or lets pending roast content enter
distribution assets.

## Seeded demonstrations

Active "Deb" prompt (migrated from the seed) + a draft "Gary" prompt (activation
demo) + an expired placement. Entries: six approved, a harmless **pending**
submission, an approved entry **reported for a real-person boundary** (urgent), a
**synthetic PII fixture** containing no real data (urgent report, pending, never
public), an **escalated** entry (high), and a **removed** entry (history
preserved). Immutable audit history seeds approval, removal, escalation, report
resolution, and a feature placement. Featured: an active household system, an
active creator, an expired placement. Taxonomy: active terms, an alias example,
and a deprecated term with a replacement.

## Architectural decisions

- **One store, grouped operations.** A single `ModerationStore` with one
  `localStorage` key and pure domain operations that return a new store — simpler
  persistence, easy immutability, and the public projection stays independent.
- **Baseline + live vote model.** Seeded engagement is a `baselineScore`; live
  votes are recorded `VoteRecord`s. The public score is derived from both, so
  "score is derived" holds without seeding hundreds of vote records.
- **Public projection runs both server- and client-side.** The `/roast` server
  page renders the seed projection (SSR baseline); the client board overlays the
  device-local store, so a locally-approved entry appears after refresh.
- **Integrations sourced from adapters.** Capability truth comes from the
  distribution registry and the render feature status, not hard-coded copy.

## Known limitations / deferred production capabilities

- No production authentication, roles, permissions, accounts, bans, suspensions,
  or appeals. The admin identity is a labeled prototype (`moderation-desk`).
- No cloud persistence or database; state is device-local only.
- No automated/AI moderation, toxicity/sentiment scoring, image recognition,
  biometric/identity/age detection, real-person search, or automated
  law-enforcement reporting.
- No direct social publishing, OAuth, production notifications, or background
  moderation jobs.
- No payment/commerce administration and no general-purpose CMS.
- Prompt creation/editing of new drafts from the UI is minimal (the seed carries
  a draft to demonstrate activation); full draft authoring is deferred.
- Cross-device synchronization is out of scope — "same device after refresh" is
  the sync boundary.
```
