# Build Plan

This document recommends a technology stack, proposes a directory structure, breaks
implementation into small ordered phases, specifies seeded demo data, bakes in
testing/accessibility/moderation/disclosures/adapters from the start, and lists the
**architectural decisions that require explicit approval before implementation**.

It is the bridge from synthesis to code. No production application code should be
written until the approval-gated decisions (§7) are resolved.

Governing constraints: [`00-non-negotiables.md`](00-non-negotiables.md) (esp. §10
flexibility/adapters, §12 narrowest coherent foundation) and the vertical-slice tiers
in [`05-vertical-slice.md`](05-vertical-slice.md).

---

## 1. Recommended technology stack

Selection criteria, in priority order: **mobile-first polish**, **provider
independence via adapters** (non-negotiable §10), **fast iteration on a seeded
prototype**, **accessibility**, and **a stable domain core that outlives any
integration**.

### Recommendation (default)
- **Framework:** **Next.js (App Router) + React + TypeScript.** Server components
  for fast, SEO-able public pages (discovery matters); client interactivity for
  Content Studio, list checkoff, roast voting. TypeScript makes the domain model's
  separations enforceable at the type level.
- **Styling:** **Tailwind CSS** + a small set of components (e.g. Radix primitives
  or shadcn/ui) for accessible, mobile-first UI without a heavy design system. Brand:
  confident/funny/human, scannable under stress — not enterprise dashboard, not
  pastel parenting template.
- **Data (slice):** **Prisma + SQLite** for the slice (zero-ops, seed-friendly),
  with a schema written to migrate cleanly to **PostgreSQL** for anything beyond the
  prototype. The **repository/data-access layer is abstracted** so the store is
  replaceable.
- **Adapters:** each external boundary (retailer, social, AI, Printful, payment,
  auth) is a **TypeScript interface** with a **seeded/placeholder implementation**
  and an explicit capability state. No concrete vendor imported outside its adapter.
- **Auth (slice):** minimal/dev-seeded behind an `AuthAdapter`; production vendor
  deferred (§7).
- **Testing:** **Vitest** (unit/domain), **Playwright** (end-to-end journeys),
  **axe** (accessibility) in CI.
- **Content/media:** local seeded assets in the slice behind a `MediaAdapter`;
  remote storage deferred.

### Why not alternatives (brief)
- A generic CMS or a Printful storefront template would pre-bias the product toward
  a forbidden shape. The domain model is bespoke; the stack must serve *it*.
- A separate SPA + standalone API adds ceremony without buying the slice anything;
  Next.js co-locates public rendering and the small API surface we need.

This stack is a **recommendation pending approval** (§7). The domain model,
adapters, phases, and seed data below are stack-agnostic and hold regardless.

---

## 2. Proposed directory structure

```
yurrmom.com/
├─ docs/                         # governing product context (00–08)
├─ prisma/                       # schema + migrations + seed (if Prisma chosen)
│   ├─ schema.prisma
│   └─ seed.ts
├─ src/
│   ├─ app/                      # Next.js routes
│   │   ├─ (public)/             # Home, Find Help, Lists & Systems, Creators, Roast, Shop, About
│   │   ├─ (creator)/            # Overview, Systems, Lists, Content Studio, Distribution, Profile, Connections
│   │   └─ (admin)/              # Moderation, Featured, Roast prompts, Merchandise, Integrations, Taxonomy
│   ├─ domain/                   # entities, types, lifecycle, invariants (NO framework/vendor imports)
│   │   ├─ knowledge/            # HouseholdSystem, List, ListItem, ProductReference, RetailerOffer, ...
│   │   ├─ distribution/         # DistributionAsset, DistributionDestination
│   │   ├─ roast/                # RoastPrompt, RoastEntry, Vote
│   │   ├─ commerce/             # MerchandiseProduct, Variant
│   │   └─ moderation/           # Report, ModerationAction
│   ├─ data/                     # repository interfaces + Prisma/SQLite implementation
│   ├─ adapters/                 # one folder per boundary; interface + placeholder impl + state
│   │   ├─ retailer/
│   │   ├─ social/
│   │   ├─ ai/
│   │   ├─ printful/
│   │   ├─ payment/
│   │   ├─ auth/
│   │   └─ media/
│   ├─ services/                 # use-cases wiring domain + data + adapters (e.g. distribution, moderation)
│   ├─ ui/                       # shared components, brand system, accessibility primitives
│   └─ lib/                      # cross-cutting helpers (provenance/disclosure rendering, exporters)
├─ tests/
│   ├─ unit/                     # Vitest domain/invariant tests
│   ├─ e2e/                      # Playwright journey tests
│   └─ a11y/                     # axe checks
└─ ...config
```

Rule: **`domain/` imports nothing from `adapters/`, `data/`, or a framework.** The
four separations from [`07-domain-model.md`](07-domain-model.md) are enforced by
module boundaries, not just discipline.

---

## 3. Ordered implementation phases

Small, verifiable increments. Each phase ends in something a reviewer can exercise.
Cross-cutting concerns (§4) are **built into every phase**, not appended.

**Phase 0 — Foundation & seams.**
Project scaffold, domain types for all entities (from
[`07-domain-model.md`](07-domain-model.md)), repository interfaces, adapter
interfaces + placeholder implementations with explicit capability states, brand/UI
primitives, CI with Vitest + Playwright + axe. Deliverable: empty-but-honest skeleton
that compiles and enforces the module boundary.

**Phase 1 — Knowledge core (source of truth).**
HouseholdSystem + Context + List/ListItem/Substitution + ProductReference/
RetailerOffer + Recipe/Routine/StorySection + disclosures, with lifecycle/versioning.
Seed the 3 systems + creator(s). Deliverable: canonical objects exist and are queryable.

**Phase 2 — Public discovery & system/list pages.**
Find Help (situation/household/constraint/task filtering over taxonomy), System page,
Portable List page with **working** print/copy/export/checkoff and outbound retailer
links; affiliate disclosures + provenance rendered. Deliverable: Journey 1 works
end-to-end.

**Phase 3 — Homepage & roast funnel.**
Homepage "through use" sequence; Roast page (prompt, entries, voting, submission →
`pending`, reporting); designed bridges into systems/creators/shop. Deliverable:
Journeys 4 + the funnel bridge work.

**Phase 4 — Creator workspace: document once.**
Structured Create/Edit System editor (context → promise → story → lists → products/
offers → media → disclosures), draft→publish. Mobile incremental capture.
Deliverable: Journey 2 works.

**Phase 5 — Content Studio & Distribution (honest).**
Select sources → **template-based** editable assets for 3 channel types with
provenance links; Distribution destinations with explicit states (no fake publish);
Connections surface. Deliverable: Journey 3 works honestly.

**Phase 6 — Admin & moderation.**
Moderation queue (pending + reports, prioritized), approve/remove/escalate with
audit log; Roast prompts, Featured content, Taxonomy, Integrations status.
Deliverable: Journey 6 works; roast content is safe by construction + review.

**Phase 7 — Shop & commerce adapters.**
Shop browse + Merchandise item/variants (real presentation); Printful + payment
**adapters** with honest states (real checkout only if approved + credentialed, §7).
Deliverable: Journey 5 presentation works; commerce boundary is honest.

**Phase 8 — Hardening.**
Full journey e2e coverage, a11y audit pass, disclosure/provenance audit,
mobile polish, seed-data review for truthfulness. Deliverable: acceptance test in
[`03-fable-context.md`](03-fable-context.md) passes.

---

## 4. Cross-cutting requirements (present from Phase 0)

- **Testing:** unit tests for domain invariants (esp. the four separations and
  lifecycle rules); Playwright e2e per journey; axe in CI. A phase isn't "done"
  without its tests.
- **Accessibility:** semantic HTML, keyboard operability, contrast, labeled
  controls, `altText` on media (a domain field), focus management. Stress-legibility
  and a11y reinforce each other. First-class, not a later pass.
- **Moderation:** reporting/review/removal + audit log designed in from Phase 0's
  entities; RoastEntry defaults to `pending`; roast fictionality enforced structurally.
- **Disclosures & provenance:** affiliate disclosures, fictional-content labels, and
  source→derivative links are rendered wherever relevant, driven by domain fields —
  never optional chrome.
- **Adapter boundaries:** every external capability wears its state
  (`connected-publishable` | `connected-export-only` | `manual-copy` | `planned` |
  `unavailable`) in both data and UI. Nothing implies success it can't deliver.
- **Mobile-first:** each public screen and core creator capture is designed for the
  phone first, not a compressed desktop dashboard.

---

## 5. Seeded demo-data requirements

To make the thesis evaluable end-to-end (data is genuine; content is authored demo,
never implying a live external fact it can't back):

- **Creators:** 1 required, 2–3 recommended, each with full HouseholdContext and
  context-first profile.
- **Household systems:** **3 complete**, spanning distinct situations (e.g. newborn
  routine, celiac-safe pantry, family-of-six laundry), each with story, ≥1 portable
  list with realistic item requirements / preferred products / substitutions /
  quantities / recurrence / notes, ≥1 routine or recipe, media placeholders,
  disclosures, and the creator's own **real, openable** retailer/affiliate links.
- **Roast:** ≥1 active prompt with a **synthetic/labeled** fictional adult character,
  several seeded entries + votes, and ≥1 seeded report to exercise moderation.
- **Merchandise:** several seeded items with variants and brand-forward copy/imagery.
- **Taxonomy:** the situation/household/constraint/task facets powering Find Help.
- **Moderation history:** seeded ModerationActions to demonstrate the audit trail.
- **Distribution assets:** ≥1 seeded per channel type to show provenance back to a
  system.

Seed script lives in `prisma/seed.ts` (or equivalent) and is the canonical demo
fixture used by e2e tests.

---

## 6. Adapter boundaries (explicit list)

| Adapter | Slice behavior | Honest state(s) |
|---|---|---|
| Retailer/cart | open link, export list | `link-only` / `export` / `planned` |
| Social publishing | copy/export | `manual-copy` / `export-only` / `planned` |
| AI generation | seeded imagery, template drafting | `planned` (real gen deferred) |
| Printful fulfillment | presentation only (unless approved) | `planned` / (`connected` if approved+credentialed) |
| Payment | none (boundary only) | `planned` |
| Auth | minimal/dev-seeded | dev impl behind interface |
| Media | local seeded assets | local impl behind interface |

No concrete vendor SDK is imported outside its adapter folder.

---

## 7. Architectural decisions requiring explicit approval

These change the shape of the build; **do not silently resolve them**
(per the task's instruction and non-negotiable spirit). Recommendations given, but
approval is required before implementation:

1. **Technology stack.** Approve Next.js + TS + Tailwind + Prisma/SQLite (→Postgres),
   or specify alternatives. *Recommended: approve as proposed.*
2. **Anonymous visitor save/adapt.** May an unauthenticated, stressed visitor save/
   adapt a system (device-local) before any account exists? *Recommended: yes —
   device-local save with optional later account upgrade.* Affects Journey 1 and the
   User/visitor ownership model.
3. **Content Studio generation mechanism for the slice.** *Recommended:
   template-based only* (AI behind an adapter, deferred). Confirm we are **not**
   wiring live AI now — this guards the "not an AI content generator" boundary.
4. **Printful/payment in the slice.** *Recommended: placeholder adapters only;* real
   checkout only if credentials exist **and** it's explicitly approved. Real commerce
   pulls in payment security/compliance out of scope for a prototype.
5. **Authentication approach.** *Recommended: dev-seeded auth behind an `AuthAdapter`
   for the slice;* production vendor deferred. Confirm no production auth vendor is
   hard-coded now.
6. **Persistence target beyond the slice.** Confirm SQLite-for-slice / Postgres-for-
   later, or specify.
7. **Roast character sourcing.** Since live AI generation is deferred (§3), the
   slice's fictional characters must come from **seeded synthetic imagery**. Confirm
   the source of that imagery (authored/stock-synthetic) so no roast subject risks
   depicting a real person (provenance boundary 4).

---

## 8. Contradictions & weak assumptions surfaced (do not silently resolve)

Called out per the task's instruction to challenge, not paper over:

- **"Roast uses AI-generated characters" vs. "not an AI content generator."** These
  coexist only if AI generation is an *adapter* and the slice ships **seeded**
  synthetic characters. If a reviewer expects live generation, that's a scope
  conflict — resolve via decision §3/§7.
- **"Content Studio generates variants" vs. "not an AI content generator."** Same
  resolution: generation is a labeled assist, template-based in the slice, always
  editable, never the product's identity.
- **"No commission on creator affiliate earnings" + "merch is the primary revenue"
  vs. real infrastructure/AI costs.** The business model assumes merch funds the
  platform while creators keep 100% of affiliate income. Early on, merch revenue may
  not cover AI/infra costs. This is a **business-model risk to acknowledge**, not an
  engineering decision — flagged so no one quietly introduces an affiliate cut to
  "fix" economics, which would violate non-negotiable §3.
- **"Stressed visitor should save/adapt" vs. auth being deferred.** A save that
  requires sign-up breaks the primary journey. Forces decision §2 before Phase 2.
- **"Portable lists" + "connect existing infrastructure" vs. reviewer expectations
  of cart sync.** The slice deliberately ships *export + link-open + checkoff*, not
  cart sync. If stakeholders expect one-click "send to Instacart," that expectation
  must be corrected against non-negotiable §6 and the adapter states — not silently
  built as a fake.
- **Anti-social-network stance vs. "community roast competitions" + voting.** Voting/
  reporting is community machinery; we must implement it **without** drifting into
  follower graphs, feeds, or DMs (encoded as anti-goals in
  [`07-domain-model.md`](07-domain-model.md)).

---

## 9. Definition of done for the slice

The slice is complete when a reviewer unfamiliar with YurrMom can run the seeded
prototype, complete Journeys 1–6 (with adapter-bound steps honestly labeled), and
conclude exactly the statement in the acceptance test of
[`03-fable-context.md`](03-fable-context.md) — and **not** conclude "affiliate blog,"
"mom social network," "inventory app," or "meme store." Every cross-cutting
requirement in §4 is met, and nothing in the UI implies a capability the adapters do
not truly provide.
