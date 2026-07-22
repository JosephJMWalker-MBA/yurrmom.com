# Vertical Slice — Implementation Scope

This document turns the **Suggested first milestone** in
[`03-fable-context.md`](03-fable-context.md) into a precise, buildable scope. It
exists to prevent two opposite failures:

1. Building too much — attempting real retailer carts, live social publishing, AI
   media generation, Printful sync, and production auth in the first pass.
2. Building a **lie** — a polished interface that *implies* those integrations work
   when they do not.

The governing rule is [`00-non-negotiables.md`](00-non-negotiables.md) §12:
> A smaller truthful system is preferable to a polished interface that falsely
> implies unsupported automation.

Everything below is classified into four tiers:

- **REQUIRED NOW** — must function end-to-end on seeded data.
- **SEEDED SIMULATION** — realistic demo data that makes the thesis legible; real
  in the sense that the data and flows are genuine, but the *content* is authored
  demo content, clearly framed as such where a user could otherwise be misled.
- **ADAPTER PLACEHOLDER** — an integration boundary that exists in code and UI with
  an **explicit, honest state** (e.g. "planned," "export-only," "not connected"),
  performing no fake action.
- **DEFERRED** — explicitly out of scope for the slice; not stubbed in the UI as if
  imminent.

---

## The milestone, restated

From [`03-fable-context.md`](03-fable-context.md), the slice must make these feel real:

1. A visitor discovers YurrMom through a current fictional roast / funny campaign.
2. The visitor moves from entertainment into a useful creator system.
3. The visitor can inspect a portable list and choose an **honest** shopping/export
   action.
4. A creator can create a household system with structured content.
5. The creator can prepare **editable** channel variants from that source.
6. Visitors can discover original YurrMom merchandise.

Plus the milestone list: homepage, one complete creator profile, three complete
systems, one portable-list handoff, creator system editor, Content Studio with
three editable assets, roast participation + moderation, shop presentation.

---

## REQUIRED NOW — must function end to end

These work for real against the local data store and the seeded content. No
hand-waving.

### Public experience
- **Homepage** expressing the full thesis *through use* (see
  [`06-information-architecture.md`](06-information-architecture.md)): roast hook →
  bridge to usefulness → find-help-by-situation → featured systems → popular
  portable lists → creator invitation → merchandise → mission/trust.
- **Find Help** discovery: filter/browse seeded systems by situation, household
  type, constraint, and task. Filtering genuinely works over seeded data.
- **Household System page**: title/promise, creator + household context, story,
  included lists/recipes/routines/products, constraints/substitutions, "last
  updated," save/adapt action, honest shopping/export options, affiliate
  disclosure, related content.
- **Portable List page**: distinguishes required need → preferred product →
  acceptable substitutions → quantity/recurrence → notes → retailer offers.
  Working actions: **print**, **copy**, **structured export (e.g. CSV/JSON)**,
  **check off** items. Retailer links **open** (they are real outbound URLs the
  creator supplied); anything beyond opening a link is adapter/deferred.
- **Creator profile**: context-first (household type, specialties, diet, stores,
  budget, schedule) over follower counts; lists their systems.
- **Roast page**: prompt image + premise (clearly fictional), entry list, voting,
  entry submission, reporting, visible moderation status.
- **Shop**: browse seeded merchandise; product page with brand presentation and
  variants — presentation is real; fulfillment is an adapter (below).

### Creator workspace
- **Create/Edit System**: structured editor producing real canonical objects —
  household context, problem/promise, story, lists + list items (with preferred
  product, substitutions, quantity, recurrence, notes), routines, recipes,
  products with the creator's own retailer offers/attribution, media references,
  disclosures. Draft → publish lifecycle works.
- **Content Studio**: select source objects → generate **editable** draft assets
  for three channel types (e.g. short-video script, IG caption/carousel outline,
  newsletter section). Generation is **template-based** in the slice (structured
  source → structured template), fully editable, with visible provenance back to
  the source system. **Not** live AI.
- **Distribution**: list destinations, each showing an **explicit honest state**
  (connected/export-only/manual-copy/planned). "Manual copy/download" and "export"
  genuinely work; "connected & publishable" is **not shown as available** unless a
  real integration exists (it does not in the slice).

### Administration
- **Moderation queue**: pending roast entries + reported items; approve / reject-
  remove / escalate; actions logged. Works over real submissions and seeded reports.
- **Featured content** and **Roast prompts** management: curate what the public
  surfaces; create/retire fictional prompts.
- **Taxonomy** management for the situation/household/constraint/task facets that
  power Find Help.

### System-wide
- **Portable list model** implemented as the stable core (list → item requirement →
  product reference → retailer offer) — this is the architectural spine and must be
  real even where downstream commerce is adapter-only.
- **Provenance & disclosure** rendering everywhere relevant (affiliate disclosure,
  fictional-content labels, source→derivative links).
- **Mobile-first** responsive behavior for every public screen and core creator
  capture (per [`04-user-journeys.md`](04-user-journeys.md)).
- **Accessibility** baseline (semantic structure, keyboard, contrast, labels) —
  first-class, not a later pass.

---

## SEEDED SIMULATION — realistic demo data

The product must be evaluable end-to-end, which requires substantial authored demo
content. This content is *genuine data flowing through real features*; it is demo in
that YurrMom authored it. Framing rule: never let seeded content imply a live
external fact (real inventory, real price, real published post) it cannot back up.

Required seed set:
- **≥1 complete creator profile** (target 2–3 for a believable directory) with full
  household context.
- **3 complete household systems**, each with: context, promise, story, ≥1 portable
  list with realistic item requirements, preferred products, substitutions,
  quantities/recurrence, ≥1 routine or recipe, media placeholders, disclosures, and
  the creator's own (real, openable) retailer/affiliate destinations.
- **≥1 current roast prompt** with a clearly fictional/synthetic adult character and
  several seeded entries + votes (to make ranking legible), plus at least one seeded
  report to exercise moderation.
- **Seeded merchandise** items with variants and brand-forward copy/imagery.
- **Taxonomy** seed: the situation/household/constraint/task facets used by Find Help.
- **Seeded moderation history** to demonstrate the audit log.

Demo characters used as roast subjects must be synthetic and labeled; they must not
depict identifiable real people.

---

## ADAPTER PLACEHOLDER — boundaries that exist honestly but do not fake action

Each of these is a real seam in the architecture (interface + explicit state
surfaced in the UI). None performs a fake success.

- **Retailer / cart integration adapter.** The slice supports *opening a retailer
  link* and *exporting* a list. It does **not** claim cart sync, live inventory, or
  live pricing. Any such capability appears as state `planned` / `unavailable`.
- **Social publishing adapter** (TikTok, Instagram, YouTube Shorts, Pinterest,
  Facebook, newsletter, blog). States: `manual-copy` / `export-only` / `planned`.
  No destination is shown as `connected & publishable` in the slice.
- **AI generation adapter** (roast character imagery; Content Studio assist). The
  slice uses **seeded imagery** and **template-based** asset drafting. A labeled
  adapter seam exists so real generation can later plug in — but the slice must not
  present itself as "an AI content generator."
- **Printful fulfillment adapter.** Shop presentation is real; the purchase/
  fulfillment path is an adapter with an honest state. Real Printful connection only
  if credentials exist **and** it is approved (see Open Decisions).
- **Payment adapter.** Required for any real purchase; treated as an external,
  security-sensitive boundary. Placeholder state in the slice.
- **Authentication adapter.** Creator/admin identity in the slice may use a
  minimal/dev-seeded mechanism behind an auth interface; production auth vendor is
  not hard-coded. (Visitor "save" behavior is an Open Decision.)

---

## DEFERRED — explicitly out of scope for the slice

Not built, and **not** stubbed in the UI as though imminent:

- Real retailer cart synchronization, universal checkout, live inventory/pricing.
- Live social publishing to any external platform.
- Live AI image/media/text generation in production.
- Real payment processing and order management.
- Personal-shopping / grocery-delivery service integrations.
- Real Printful order fulfillment (unless approved with credentials).
- Production-grade authentication/authorization vendor integration, account
  recovery, etc.
- Follower graphs, DMs, notifications, and other general social-network machinery
  (explicit anti-goal — YurrMom is not a mom social network).
- Analytics/performance dashboards for creators (Content Studio step 9 "review
  performance" is deferred beyond a placeholder).
- Optional agency/creator paid services.

---

## What must function end-to-end vs. what must not be misrepresented

**Must genuinely work (a reviewer can complete these with no fiction):**
- Discover a system from the roast/home funnel and read why it works.
- Inspect a portable list; print / copy / export / check off; open a creator's
  retailer link.
- Create and publish a structured household system as a creator.
- Produce and edit three channel assets from that system, with visible provenance.
- Submit a roast entry, vote, and report; have an admin moderate it.
- Browse merchandise and view a product with variants.

**Must NOT be represented as integrated (honest states only):**
- Sending a list into a retailer cart / delivery service as a completed action.
- Publishing an asset directly to any social platform.
- Generating roast art or Studio copy with a live AI model.
- Completing a real merchandise purchase / fulfillment (unless approved + credentialed).
- Any live price, stock, or "posted successfully" signal the adapter cannot confirm.

The test: if a reviewer clicks it and it "works," it is REQUIRED NOW and it truly
works. If it is a boundary we cannot yet cross, it wears its adapter state on its
sleeve. There is no third category where the UI implies success without delivering it.

---

## Open decisions gating the slice (require explicit approval)

Carried into [`08-build-plan.md`](08-build-plan.md); flagged here because they change
the slice's shape:

1. **Anonymous visitor "save/adapt."** Can a stressed, unauthenticated visitor save
   or adapt a system (device-local) before any account exists? Recommended: yes,
   local/session save with optional later account upgrade. Needs approval.
2. **Real Printful in the slice.** Placeholder-only, or real connection when
   credentials exist? Recommended: placeholder for the slice; real behind approval.
3. **Content Studio generation mechanism.** Confirm **template-based** for the slice
   (recommended) vs. wiring a live AI adapter now.
4. **Persistence & stack** choices — see [`08-build-plan.md`](08-build-plan.md).
