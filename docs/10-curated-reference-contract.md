# 10 — Curated Reference Contract (Phase 5)

Status: implemented on branch `PHASE-5`. Aligned with `src/domain/reference/*`,
`src/domain/knowledge/eligibility.ts`, the retrieval integration in
`src/domain/knowledge/retrieval.ts`, `src/data/reference-registry.ts`,
`src/data/reference-repo.ts`, `src/adapters/reference-ingestion.ts`,
`src/ui/studio/reference-desk.tsx`, and `tests/references.test.ts`.

## Purpose

Define how *legitimate* reference material may enter the household-knowledge
corpus with source identity, exact evidence, citations, versioning, scoped
authority, applicability, limitations, editorial review, conflicts, currency,
and complete provenance — so that a Phase 4 EvidencePacket can gain
**authoritative support honestly**, never by prestige.

This phase does **not** build a chatbot, generated answers, an LLM/embedding/
vector integration, automatic claim extraction or truth verification, live URL
fetching, web scraping, PDF parsing, external sync, public search, child
profiles, Cred at Home scoring, or production authentication.

## Why authority is scoped

> "Published by an authoritative organization" does not mean universally true,
> applicable everywhere, applicable forever, authoritative in every domain, or
> sufficient for every user or risk category.

Authority is therefore scoped by publisher, subject domain, jurisdiction,
intended audience, publication/effective dates, document version, guidance-risk
category, applicability/exclusions, and editorial review state. The platform may
say *"this claim has been reviewed and approved for platform use within this
stated scope."* It must never say *"this is objectively true because an
authoritative source published it."* There is **no universal authority score and
no truth score** anywhere in the model.

## Publisher / Source / Version

- **ReferencePublisher** — stable identity + `organizationType` (descriptive
  metadata; publisher type alone grants **no** authority).
- **ReferenceSource** — the continuing publication identity: title, publisher,
  category, subject domains, audience, locale, jurisdictions, usage/licensing
  notes, and active/superseded/withdrawn status.
- **ReferenceVersion** — an **immutable** snapshot: label, publication/effective/
  entered/review-due dates, `contentHash` (FNV-1a, dependency-free), status,
  supersedes/superseded-by links, exact source text, change notes. Adding a new
  version never overwrites an old one (`addVersion` is a pure transform).

## Evidence-span contract

An **EvidenceSpan** is an immutable, source-backed excerpt: exact text, `textHash`,
section path, a `CitationLocator` (page / section / paragraph / line range / URL
fragment / table-or-figure), locale, editorial notes, timestamp. Exact text and
locator always travel together. Evidence is never created by summarizing a whole
document, and a span is never silently changed after a claim cites it (a byte
change changes its hash and its deterministic ID).

## Claim contract

A **CuratedClaim** is an editorially reviewable proposition connected to exact
evidence — a distinct object from the source text; its wording never replaces the
evidence. It carries statement, claim type, locale, risk categories, subject
domains, audience, developmental applicability, household circumstances,
constraints, jurisdiction, applicability scope, applicability, exclusions,
limitations, effective/review-due dates, status, version, editor identity,
timestamps, and the `dependsOnVersionId` staleness anchor. Claims are never
auto-extracted from imported text; an editor authors and reviews them.

## Interpretation levels

Every claim states how far it moves from the evidence:
`direct-statement` (very close to cited wording), `faithful-paraphrase`
(restates meaning, preserves scope and limitations), or `editorial-inference`
(**labeled as inference**). An editorial inference may appear in editorial
inspection but **cannot independently satisfy** authoritative support for a
high-stakes query. Not all reviewed claims are described as direct source
statements.

## Claim ↔ evidence and claim ↔ claim relations

- `ClaimEvidenceLink`: `supports | qualifies | contradicts | background |
  defines | limits`. A claim needs at least one `supports`/`defines` link before
  approval. Qualifying/limiting evidence is never discarded because supporting
  evidence exists.
- `ClaimRelationship`: `supports | qualifies | conflicts-with | alternative-to |
  supersedes | superseded-by`, each with a `resolved` flag.

## Authority assessment

`AuthorityAssessment` is **scoped**, attached to a Source (optionally pinned to a
Version): status (`unassessed | approved-for-scope | needs-review |
rejected-for-authoritative-use | expired`), recognized domains, recognized
jurisdictions (may include `global`), supported risk categories, audience,
effective scope, limitations, assessor, assessment date, review-due date. An
assessment never implies authority outside its recorded scope. A pediatric
association assessed for US child-development guidance is **not** thereby
authoritative for legal advice, retailer recommendations, budgeting, another
country's regulations, or every diagnosis.

## Review workflow

Lifecycle: `draft → evidence-linked → in-review → approved`, with
`needs-revision`, `superseded`, `withdrawn`. Transitions are constrained
(`canTransition`). Approval is manual and guarded (`evaluateApprovalGuard`): it
blocks unless a supporting/defining link exists, every cited span has a complete
citation locator, and every checklist item is affirmed (evidence attached,
citation complete, wording matches, **not broader than evidence**, source scope
covers domain, jurisdiction preserved, audience preserved, source limitations
preserved, version/currency reviewed, licensing recorded, conflicts considered).
A seeded editorial identity (`editorial-desk`) is used and labeled honestly; no
production roles or auth exist. **"Approved" = approved for platform use within
the recorded scope**, not universal truth.

## Versioning and staleness

Adding a `ReferenceVersion` preserves the old version and its spans (immutable),
links supersedes/superseded-by, marks the old version `superseded`, and flags
every claim that depended on it as `needs-revision`. Approval is **never**
transferred to a new version, and claims are **never** auto-rewritten. Stale
claims cannot satisfy authoritative support; their history stays inspectable.

## Conflicts

An unresolved `conflicts-with` relationship keeps a claim from being presented as
uncontested: it makes the claim **ineligible** for authoritative support,
produces an EvidencePacket conflict warning, and qualifies coverage. The platform
does not algorithmically resolve scientific/developmental/medical/legal/safety
disagreements.

## Authoritative eligibility

`evaluateAuthoritativeEligibility(claimPayload, ctx)` is deterministic and
returns per-check pass/fail with reasons, plus source scope, query scope, and
warnings. A claim is eligible only when **all** hold: approved; not editorial
inference; has a supporting/defining citation that is complete; comes from an
active source version and active source; has a current `approved-for-scope`
assessment (not expired); is current (not past review-due; effective date
reached); the query domain is within the **assessment's** recognized domains
(a claim cannot self-grant domain scope); jurisdiction matches or the claim
declares broad/global applicability; the risk category is supported by **both**
assessment and claim; and there is no unresolved disqualifying conflict. A
`SourceType` value alone is **no longer** sufficient (the Phase 4 shortcut is
removed).

## Retrieval integration

Approved (or, for editorial inspection, non-withdrawn) claims project into
`curated-claim` KnowledgeUnits carrying claim id/version, statement, source
version, evidence-span citations with exact excerpts and locators, interpretation
level, authority assessment snapshot, review status, source locale, effective and
review-due dates, applicability, limitations, conflicts, and a Studio deep link.
Retailer/commerce data is never present. In retrieval:

- **public-safe** excludes any curated-claim unit whose status ≠ `approved`.
- **editorial-inspection** shows drafts/superseded/needs-revision with full
  status and warnings.
- High-stakes coverage (`medical | developmental | mental-health | legal |
  safety-critical`) is `authoritative-support-required` **unless** at least one
  retrieved curated claim is *eligible* per the policy above. Personal experience
  still appears, labeled as experience. The packet's `authoritativeSummary`
  reports required/present, eligible count, ineligible reasons, and conflict
  warnings.

## Licensing and citation responsibilities

Source `usageNotes` (licensing) travel to the projected unit. Citations (exact
text + locator + hash) travel with the claim and its unit so any downstream
surface can attribute precisely. Editors are responsible for recording licensing
and for entering only material they may curate; the platform performs no fetching
or scraping.

## Production seed policy

Production data contains **no fabricated authoritative guidance**. The production
registry holds exactly one platform-internal documentation source whose
assessment is deliberately `unassessed` — it can never satisfy high-stakes
coverage. Synthetic authoritative fixtures exist **only** under `tests/fixtures`
(fictional names, `origin: "test-fixture"`), are imported by no `src/` file, and
so cannot leak into corpus construction. The developmental query "what chores are
appropriate for a four-year-old?" therefore stays `authoritative-support-required`
in production until a real, reviewed, in-scope source is entered by an editor.

## Ingestion boundary

`ManualIngestionAdapter` supports manual entry and optional local-JSON import
only — capability states `manual-entry | local-import |
external-fetch-unavailable | parsing-unavailable | review-required`. It produces
review-required candidates, never approved knowledge. No web fetch, no scraping,
no PDF, no vendor SDK.

## Known limitations

- Eligibility text matching (domain/jurisdiction) uses the Phase 4 naive
  tokenizer; it is explainable, not linguistically complete.
- The registry is device-local behind a repository interface; there is no shared
  publishing. Local data is always labeled `local-device`.
- Assessment currency is date-based (`reviewDueDate`); there is no automated
  re-review scheduling.
- One assessment per source (optionally version-pinned) is modeled; multiple
  concurrent scoped assessments per source are not.

## Deferred capabilities

Automatic claim extraction, automated truth/authority scoring, live fetching /
scraping / PDF parsing, external-source synchronization, embeddings/vector
retrieval, a real backend and multi-user editorial roles/auth, cross-source
synthesis, and any public-facing reference search.
