# 09 — Knowledge Retrieval Contract (Phase 4)

Status: implemented on branch `PHASE-4`. Aligned with the code in
`src/domain/knowledge/*`, `src/data/knowledge-corpus.ts`,
`src/data/evaluation-cases.ts`, and `tests/knowledge.test.ts`.

## Purpose

Phase 4 proves that canonical household systems can be turned into
**trustworthy, searchable evidence** without flattening their meaning or losing
provenance. The output of retrieval is an **evidence packet**, not an AI answer.

It answers, for any query:

- What source-backed material matched, and **why**?
- Who contributed it, and is it original / translated / adapted / generated?
- In what language was it authored, and is a translation current and approved?
- Which household circumstances does it apply to, and what limitations were stated?
- Does the available evidence support the **kind** of guidance being requested?

It never invents a claim the canonical source did not make.

This phase does **not** build: a chatbot, natural-language answer generation,
an LLM/embedding/vector integration, live translation, external corpus
ingestion, child profiles, Cred at Home scoring, production auth, or a public
search product.

## Canonical-source boundary

- Canonical creator content (`src/data/systems.ts`, `lists.ts`,
  `translations.ts`) remains the single source of truth.
- **Projection is strictly read-only.** It never mutates a system, list, item,
  story, routine, recipe, or translation record. (Enforced by a frozen-input
  test.)
- KnowledgeUnits are **derived views**, never canonical. Generated summaries do
  not exist — a unit's text is always exact source-backed text.
- Translation status and staleness always travel with translated content
  (reusing the Phase 3 selectors in `src/domain/translation.ts`).

## KnowledgeUnit structure

A `KnowledgeUnit` (`src/domain/knowledge/unit.ts`) is the smallest source-backed
segment retrieval can return. It retains:

`id` (deterministic, stable per source object + version), `kind`,
`sourceObjectType`, `sourceObjectId`, `ownerSystemSlug`, `ownerSystemTitle`,
`sourceVersion`, `creatorHandle`, `originalAuthorHandle`, `displayText` (exact),
optional structured `listItem`, `sourceLocale`, `effectiveLocale`,
`provenanceSourceType`, `livedExperience`, `derivation`
(`original|adapted|translated|generated`), `reviewStatus`, `facets`,
`applicability`, `limitations`, `publicHref`, `studioHref`, and an
`indexTokens`/`indexText` match index.

**ID scheme:** `ku:{systemSlug}:v{version}:{kind}:{localKey}`. Stable for the
same source object and version; a version bump intentionally changes the ID.

**Commerce exclusion (structural affiliate neutrality):** retailer offers,
URLs, affiliate flags, prices, and availability are **never** projected into a
unit. Because they are absent from the knowledge object, they cannot influence
relevance. A unit keeps the product *identity* (`preferredName`, knowledge) but
not the *offer* (commerce).

## Projection rules

Per system (`projectSystem`):

- one `problem-promise` unit (promise + problem)
- one `audience` unit (when `audience` present)
- one `limitations` unit (when `limitations` or `facets.applicability` present)
- one `observed-outcome` unit (when `observedResults` present)
- one `story-section` unit per story section
- one `list-item` unit per portable-list item — the need / preferred product /
  substitutions / quantity / recurrence / required-optional-situational
  importance / notes distinction is **preserved as structure**, not collapsed
- one `routine` unit per routine (steps preserved; Cred metadata → facets)
- one `recipe` unit per recipe

Every unit inherits its system's facets via the Phase 3 `facetsOf()` seam, plus
`situationTags` become `household-circumstance` facets. Routine units also carry
their Cred `skillTaught`/`supervisionLevel` as facets.

## Retrieval ranking

Deterministic, transparent, dependency-free (`src/domain/knowledge/retrieval.ts`).
Each query field contributes independently; contributions sum to a score:

| Signal | Weight |
|---|---|
| Exact phrase (whole normalized query is a substring of the unit index) | +6.0 |
| Each distinct query token present in the unit index | +1.0 |
| `householdDomain` filter matches a `household-domain` facet | +2.5 |
| `developmentalStage` filter matches a `developmental-stage` facet | +2.5 |
| Each `householdCircumstances` entry matches | +2.0 |
| Each `constraints` entry matches a `constraint` facet | +2.0 |
| `taskOrSkill` matches a `task`/`skill-taught`/`purpose` facet or a token | +2.5 |
| `systemScope` == `ownerSystemSlug` | +3.0 |
| `creatorScope` == `creatorHandle` | +3.0 |

`sourceTypeFilters` is a **hard eligibility filter** (no score effect).
Ordering: **score DESC, then `unit.id` ASC** (lexicographic) — a fully
deterministic tiebreak. Zero-score units are dropped. Text normalization is a
small, transparent lowercase + punctuation-strip + stopword + naive singular
fold (`text.ts`) — no stemmer, no dependency.

Every hit reports `score`, `rank`, the matched unit, human-readable `reasons`,
provenance, `warnings`, and a `localeStatus`.

## Translation representation policies

The representation layer (`representation.ts`) **wraps** the Phase 3
`bestRepresentationForLocale` selector; it never reimplements selection and
never mutates a record.

- **public-safe:** eligible primary representations are the creator-authored
  original, or a **current creator-approved / reviewed** translation. Machine
  drafts, human drafts, and stale translations are **withheld** as primary —
  retrieval falls back to the original, keeps its real locale, states that no
  approved translation is available, and **never claims equivalence**. The
  withheld draft is still reported to exist (`unapprovedOrStalePresent`).
- **editorial-inspection:** may surface machine/human/stale translations, but
  each carries its actual status, attribution, source version, and caution
  notes.

## High-stakes evidence policy

`guidanceRisk` is **supplied by the caller, never inferred** (no AI, no
heuristics). Categories: `ordinary-household`, `medical`, `developmental`,
`mental-health`, `legal`, `safety-critical`.

For any high-stakes category:

- Lived family experience may still appear, **clearly labeled** as experience
  (per-hit warning), and is **never** treated as authoritative guidance.
- The packet coverage is `authoritative-support-required` **unless** at least
  one matched unit carries an authoritative source type (`sourced-reference` or
  `professional-guidance`).
- Absence of evidence is reported as insufficiency — it is **never** turned into
  advice.

No fake authoritative sources exist in the seed. The developmental case
("chores appropriate for a four-year-old?") therefore correctly reports
`authoritative-support-required`. That is a successful, honest result.

## EvidencePacket contract

`EvidencePacket` (`query.ts`) contains: the `NormalizedQuery` echo, `mode`,
`requestedLocale`, `guidanceRisk`, ranked `hits`, `sourceTypeSummary`,
`localeSummary`, `coverage`
(`sufficient-for-household-exploration|partial|insufficient|authoritative-support-required`),
`warnings`, aggregated stated `limitations`, and an optional
`insufficientSupportReason`.

It is **not an answer**: no synthesized advice, recommendations, or
conversational prose. The Studio Evidence Explorer (`/studio/intelligence`)
renders it analytically — no chat bubbles, no assistant persona, no typing
animation.

## Architectural invariants (enforced by tests)

- Canonical content is the source of truth; projection is read-only.
- Search units never overwrite source content; generated summaries are not
  canonical (and none are produced).
- Translation status and staleness travel with translated content.
- Personal experience is never silently promoted into authoritative guidance.
- Retrieval produces evidence, not answers; match score ≠ truth.
- Popularity, affiliate value, retailer availability, and price do not affect
  epistemic rank (structurally — commerce is not in a unit).
- Every result is traceable to a source object and version.
- No child data is created or stored.
- No external model or provider is required.

## Known limitations

- Normalization is deliberately naive (single-language token matching, crude
  singular fold). It is explainable, not linguistically complete.
- Facets are inherited at system granularity, so a unit can match on a facet
  that describes its system rather than that exact segment; provenance and the
  owning system are always shown so a reviewer can judge.
- The corpus is built once at module load from seeded data; there is no
  incremental indexing.
- Studio-side local edits (Phase 2 localStorage drafts) are **not** reflected in
  the server-built corpus; retrieval reads the committed seed.

## Explicitly deferred

Chatbot / NL answer generation; LLM, embeddings, vector search; live
translation generation; external corpus ingestion; ranking learned from usage;
cross-system synthesis; per-segment (rather than per-system) facets and
translations; public-facing search; Cred at Home scoring; child profiles;
production authentication.
