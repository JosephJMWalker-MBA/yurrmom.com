# 13 — Content Studio & Honest Distribution Contract (Phase 8)

Status: implemented on branch `PHASE-8`. Aligned with `src/domain/distribution/`
(`types`, `ids`, `sensitivity`, `templates`, `create`, `edit`, `validate`,
`staleness`, `export`, `destinations`), `src/data/distribution-seed.ts`,
`src/data/distribution-repo.ts`, `src/ui/studio/use-distribution.ts`,
`src/ui/studio/content-overview.tsx`, `src/ui/studio/content-create.tsx`,
`src/ui/studio/content-editor.tsx`, the `/studio/content*` routes, and
`tests/distribution.test.ts`.

## Purpose

Let a creator document a household system **once** and turn that canonical
knowledge into editable, channel-specific **distribution assets** — short-form
video scripts, social posts, Pinterest pins, newsletter sections, blog drafts —
**without copying and rebuilding the idea**. This is a creator workflow, not an
autonomous content generator. There is no model call, no image/video generation,
and no external publishing anywhere in this phase.

## Pipeline

```
Canonical HouseholdSystem
  → creator selects source material          (SourceSelection)
  → deterministic channel template           (DISTRIBUTION_TEMPLATES)
  → editable DistributionAsset draft          (createDistributionAsset)
  → provenance & disclosure validation        (validateDistributionAsset)
  → ready-for-export state                     (markReady, fail-closed)
  → manual copy or file export                 (exportAsset)
  → optional future destination adapter        (DESTINATION registry, all planned)
```

## Canonical-versus-derivative boundary

The `HouseholdSystem` is **canonical**. A `DistributionAsset` is a **derivative**.
A derivative must never: overwrite the canonical system, become a new source of
truth, silently lose provenance, invent a household result, broaden a limitation,
remove a required disclosure, or present translated / edited text as the
creator's original words. Creation and editing are **read-only over the canonical
system** — they touch only the asset. (Test: _creation is read-only over the
canonical system (no mutation)_.)

## DistributionAsset

Deterministic ID (`da:{systemSlug}:{assetType}:{templateId}:{assetLocale}:{selectionHash}`,
hashed with the shared FNV-1a `contentHash`), creator handle, source system slug
+ version + locale, asset type + channel + locale, internal name, status,
selected `sourceRefs`, `blocks`, `disclosures`, baked `requiredDisclosureKinds`,
`provenance`, timestamps (`createdAt` / `updatedAt` / optional `exportedAt`),
`origin` (`production-seed` | `local-device`), and the last `validation` result.

Statuses: `draft`, `ready`, `exported`, `needs-review`, `stale`, `archived`.

## Structured content blocks

Assets are **structured block lists**, not one opaque text field. Block kinds:
`hook`, `title`, `setup`, `household-context`, `problem`, `method`, `step`,
`list-item`, `creator-experience`, `caution`, `limitation`, `disclosure`,
`call-to-action`, `caption`, `visual-direction`, `spoken-line`, `on-screen-text`,
`subject-line`, `preview-text`, `body`, `source-note`.

Each block records its provenance: `source-backed` (exact canonical text, carries
a `DistributionSourceRef`), `creator-authored`, `creator-authored-derivative`
(a source-backed block the creator has edited), `deterministic-template` (fixed
framing language), or `translated-derivative`. Blocks are `required` or optional
and `editable` or not.

`DistributionSourceRef` carries: source object type, source object ID, source
version, owning system, exact source-backed text, source locale, translation
status, and provenance type — so every source-backed block is traceable to a
canonical object at a specific version.

## Deterministic templates

`DISTRIBUTION_TEMPLATES` is a small, **versioned, replaceable** registry
(`TEMPLATE_REGISTRY_VERSION`). Templates: `video-problem-method`,
`video-one-household-rule`, `social-context-method`, `social-list-explainer`,
`pin-practical-system`, `newsletter-household-note`, `blog-system-story`. A
template organizes selected canonical material, inserts fixed framing language,
preserves exact source-backed statements, exposes editable creator fields,
enforces required disclosures, and is channel- and locale-aware. Templates are
pure functions over trusted fields — they **never call a model** and never invent
a result or broaden a limitation.

## Source selection

`SourceSelection` lets the creator pick problem/promise, household context, story
sections, portable-list items, routines, recipes, observed outcomes, limitations,
applicability, and disclosures. Selection preserves source identity and version.
The editor labels each block as exact source material, template framing, or
creator-edited, and shows which disclosures must remain. Ontology terminology is
not exposed in the UI.

## Edit provenance

Edits modify only the asset. Editing a `source-backed` (or `translated-derivative`)
block flips it to `creator-authored-derivative`, sets `editedFromExact`, and drops
the exact-quote claim while keeping the source link for traceability. Editing a
ready/exported asset returns it to `draft`. Required blocks cannot be silently
removed (`removeBlock` refuses them); `reorderBlocks` never drops blocks.

## Validation (`validateDistributionAsset(asset, currentSource)`)

**Fail-closed. Never repairs.** Detects at least: missing source system, source
version mismatch, stale source, missing required block, missing provenance,
missing affiliate disclosure, missing medical / developmental caution, translated
content misrepresented as original, unapproved-translation publication source,
required limitation removed, unsupported retailer claim, guaranteed / unverified
result, fictional roast content mixed into guidance, duplicate block IDs, invalid
template / channel combination, empty exportable content, unsafe HTML or script,
malformed external URL, and source-link mismatch (wrong system or a future
version). Required-disclosure enforcement uses the **baked `requiredDisclosureKinds`**
(captured at creation from the source) unioned with medical/developmental cautions
re-derived from the current source — so a removed disclosure is caught even if the
disclosure object itself is deleted. The source-backed limitation check targets the
limitation block that carries a `limitations` source ref, so the always-present
"experience, not universal" framing block cannot satisfy it.

## Staleness

When the canonical system version moves past the version an asset was built from,
`assetStaleness` reports it, `markStale` sets `status: "stale"` +
`reviewState: "needs-review"` (history and creator edits preserved), and export is
blocked. `reviewStaleAsset` re-baselines the source version and returns the asset
to `draft` for re-validation — it does **not** rewrite creator edits and nothing
auto-republishes.

## Translation readiness

Assets retain source locale, asset locale, translation status, translation source
version, translator/provider attribution, review state, and caution notes. A
localized asset can be created **only** from an approved/current translation;
`createDistributionAsset` refuses a missing or non-approved translation, and
validation rejects a machine draft used as a publication source. There is no live
translation generation. The seeded celiac asset is therefore built from the
**English original** — the only Spanish translation in the corpus is a
machine-draft (`tr-celiac-es-001`), which is inspectable but never a publication
source.

## Affiliate & platform disclosures

Creator affiliate links remain the creator's; yurrmom.com takes **0%** of creator
affiliate earnings. Affiliate relationships are disclosed
(`creator-affiliate` + `platform-relationship`), a household **need** stays
distinct from a **preferred product** (list-item blocks state the need, not the
product), and affiliate URLs are **never rewritten, cloaked, or injected** into
asset bodies — they stay verbatim at the source. When a system's kit has no
affiliate offers, a `no-affiliate` disclosure is used instead.

## Destination capabilities

`DISTRIBUTION_DESTINATIONS` is a provider-independent boundary with honest
capability states: `manual-copy` (clipboard), `export-only` (file download),
`planned` (TikTok / Instagram / Facebook / Pinterest / newsletter — no connection
exists), `unavailable`, `connected-draft-only`, `connected-publishable`. In this
phase **no destination is `connected-publishable`** and `canPublish()` always
returns `false`. The UI never suggests anything was posted externally.

## Export formats

`exportAsset(asset, format)` renders `markdown`, `text`, or `json`, plus
copy-to-clipboard. Every export is labeled **"Content preview — not published"**
and carries a footer: source system + version, creator, asset locale, translation
status, template + version, origin (derivative, not a source of truth), and every
required disclosure. Export is refused for stale/invalid assets
(`isExportable` is false). Export is manual — it moves bytes to the creator only,
never to an external service.

## Local persistence

`LocalDistributionRepository` mirrors the reference/workspace repository seam:
device-local `localStorage` behind an interface (`load` / `save` / `reset` /
`upsert` / `remove` / `get`), seeded from the demo assets **relabeled
`local-device`**, with deterministic reset. There is no server, no database, and
no publishing. The interface is the single replacement point for a future
backend; a production database is intentionally **not** introduced here.

## Studio workflow

- `/studio/content` — overview: drafts with status pills, source + version,
  disclosure counts, validity, a create action, and a device-local reset.
- `/studio/content/new` — create flow: choose system → format → template → select
  source material → name → create.
- `/studio/content/[id]` — editor: structured blocks with provenance labels,
  edit / remove (optional) blocks, channel-aware preview labeled
  "Content preview — not published", validation panel, required disclosures,
  provenance summary, mark-ready (fail-closed), export/copy, and the stale-review
  flow with export blocked until reviewed.

## Safety rules

The Content Studio does not invent outcomes, imply professional authority, remove
medical/developmental cautions, guarantee a method, present one household's method
as universal, hide translation status, convert product preference into household
necessity, publish automatically, claim an external connection, modify canonical
content, or merge roast fiction into household guidance.

## Architectural decisions

- **Baked `requiredDisclosureKinds`.** Required disclosures are computed once at
  creation from the source and stored on the asset, so validation is
  self-contained (no data-layer coupling) and catches an outright-deleted
  disclosure object. Medical/developmental cautions are additionally re-derived
  from the current source so a later-sensitised source still enforces them.
- **Seeds built through the domain layer.** `distribution-seed.ts` calls
  `createDistributionAsset` rather than hand-writing asset JSON, so seeds can
  never drift from the templates/validator.
- **Canonical source read from `@/data`.** The Studio validates/staleness-checks
  against `getSystem(slug)` (the current canonical version), keeping the asset a
  strict derivative.

## Known limitations / deferred capabilities

- No direct social publishing, OAuth, TikTok/Meta/Pinterest/email APIs,
  scheduling, automatic posting, analytics, paid ads, or content calendar.
- No model-generated factual claims, LLM call, public chatbot, or image/video
  generation.
- No production authentication or cloud persistence; identity is the seeded
  creator and persistence is device-local.
- No in-Studio translation authoring; localized assets require an
  already-approved translation, and none is seeded (the celiac Spanish draft is
  machine-draft only), so the localized-create path is exercised by tests, not by
  a seeded asset.
- Character-count guidance is minimal (textarea sizing) rather than
  per-channel limit enforcement.
```
