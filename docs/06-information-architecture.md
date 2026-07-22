# Information Architecture

This document defines the navigation, page hierarchy, and key transitions for
YurrMom's three surfaces — **public site**, **creator workspace**, and
**administration** — and explains how the homepage communicates the full thesis
**through use rather than a manifesto**.

It builds on the recommended IA in [`03-fable-context.md`](03-fable-context.md) and
serves the journeys in [`04-user-journeys.md`](04-user-journeys.md). The organizing
principle from [`00-non-negotiables.md`](00-non-negotiables.md): **knowledge before
commerce, systems before products, entertainment as the doorway.**

---

## Three surfaces, deliberately distinct

| Surface | Audience | Voice | Primary job |
|---|---|---|---|
| **Public site** | Visitors, shoppers, roast audience | Confident, funny, human, scannable under stress | Discover & act on household systems; enter via entertainment; discover merch |
| **Creator workspace** | Authenticated creators | Calmer, structured, still on-brand | Document systems once; distribute everywhere honestly |
| **Administration** | Moderators/admins | Utilitarian, auditable | Keep roast safe; curate; maintain taxonomy |

The public site carries editorial energy; the workspace becomes calmer and more
structured without feeling like a different product; admin is functional. All three
share the brand system but not the same density.

---

## 1. Public navigation

Top-level nav (from [`03-fable-context.md`](03-fable-context.md)):

```
Home · Find Help · Lists & Systems · Creators · Roast · Shop · About
```

Two public *modes* run through this nav without being confused with each other
(per [`02-platform-model.md`](02-platform-model.md)):

- **Discover & laugh** — Home roast hook, **Roast**, funny ads, **Shop**.
- **Solve a real problem** — **Find Help**, **Lists & Systems**, **Creators**.

The two modes are bridged intentionally (entertainment → usefulness), never merged
into an undifferentiated feed.

### Page hierarchy (public)

```
Home
Find Help                         (situation-first discovery)
  └─ Results (filtered by situation / household type / constraint / task)
       └─ Household System page
            ├─ Portable List page
            │    └─ Retailer offer (outbound link) · export · print · copy · checkoff
            ├─ Recipe / Routine detail
            └─ → Creator profile · related systems
Lists & Systems                   (browse the knowledge library)
  ├─ Systems index
  │    └─ Household System page  (shared with Find Help)
  └─ Lists index
       └─ Portable List page
Creators
  └─ Creator profile             (context-first)
       └─ Creator's systems / lists
Roast
  ├─ Current roast prompt
  │    ├─ Entries + voting + submit
  │    ├─ Report
  │    └─ Bridge → systems / creators / shop
  └─ Past roasts / campaigns
Shop
  ├─ Collections (themed / seasonal)
  └─ Merchandise item (variants) → Printful/payment adapter
About
  └─ Mission / trust / creator promise (the manifesto lives HERE, not on Home)
```

Key relationships:
- **Find Help** and **Lists & Systems** both resolve to the same canonical
  **Household System** and **Portable List** pages — discovery paths differ, the
  destination object is one source of truth.
- A **Household System** always exposes its **creator** (context/relevance) and its
  **lists** (action). A **List** always traces back to its system and creator.
- **Roast** and **Shop** are the "discover & laugh" spine but each contains designed
  bridges into the "solve a real problem" spine.

---

## 2. Creator workspace

Nav (from [`03-fable-context.md`](03-fable-context.md)):

```
Overview · Systems · Lists · Content Studio · Distribution · Profile · Connections
```

### Hierarchy (creator)

```
Overview                          (what to do next; not an analytics dashboard in the slice)
Systems
  ├─ Systems list (draft / published)
  └─ Create / Edit System         (structured editor)
       ├─ Household Context (reusable)
       ├─ Problem / Promise
       ├─ Story / lessons
       ├─ Lists → List items (preferred product · substitutions · qty · recurrence · notes)
       ├─ Routines · Recipes
       ├─ Products → creator's Retailer offers / affiliate destinations
       ├─ Media
       └─ Disclosures
Lists
  └─ List editor (reused inside System editor; also standalone)
Content Studio
  ├─ Select source objects (system / list / story / recipe)
  ├─ Choose channel asset types
  └─ Editable draft assets  (provenance link back to source)
Distribution
  └─ Destinations with explicit state: connected&publishable · export-only · manual-copy · planned
Profile
  └─ Public creator profile fields (context-first)
Connections
  └─ Adapter connection states (retailers, social, affiliate, payment/Printful where relevant)
```

Flow spine: **Systems (document once)** → **Content Studio (derive editable
assets)** → **Distribution (act honestly)**. The canonical system is always the
source of truth; Studio outputs are derivatives that link back and never overwrite
source data (see [`07-domain-model.md`](07-domain-model.md)).

**Connections** is where adapter states are owned by the creator; **Distribution**
consumes those states per asset. Keeping them separate prevents the UI from implying
a publish capability that a connection doesn't actually grant.

---

## 3. Administration

Nav (from [`03-fable-context.md`](03-fable-context.md)):

```
Moderation · Featured content · Roast prompts · Merchandise · Integrations · Taxonomy
```

### Hierarchy (admin)

```
Moderation
  ├─ Queue (pending entries + reports, prioritized)
  └─ Item review → approve / reject-remove / escalate (audit-logged)
Featured content
  └─ Curate featured systems / creators (respecting economic boundaries)
Roast prompts
  └─ Create / retire fictional prompts + characters
Merchandise
  └─ Curate merch catalog / collections / placement
Integrations
  └─ Global adapter status (retailers, social, AI, Printful, payment, auth)
Taxonomy
  └─ Situations · household types · constraints · tasks (powers Find Help)
```

Moderation and reporting are **first-class** (a non-negotiable). Every consequential
admin action is auditable. Featuring must not blur creator-affiliate vs.
YurrMom-merch economics.

---

## 4. Key transitions between the six domains

The IA's job is to keep these six domains distinct while wiring the transitions the
thesis depends on:

**Entertainment ↔ Knowledge**
- Roast/home hook → "steal a system that works" → Household System / Find Help.
- A system's theme can surface a related roast/campaign for shareability.

**Entertainment → Creators**
- Roast bridges to creators whose systems fit the roast's theme (behavior → real help).

**Knowledge ↔ Creators**
- Every System exposes its Creator; every Creator profile lists their Systems.
- Relevance (household context) is the connective tissue, not popularity.

**Knowledge → Lists**
- Systems contain portable Lists; Lists are the actionable, exportable unit and are
  the boundary where commerce handoffs occur.

**Lists → Distribution (commerce/handoff)**
- List → export/print/copy/checkoff (real) and → retailer offer outbound link
  (real); deeper cart/delivery integration is adapter-stated.

**Creators → Distribution (channels)**
- System → Content Studio → channel assets → Distribution destinations (honest
  states). This is the "capture once, publish everywhere" path.

**Anything → Merchandise**
- Shop is reachable from Home, Roast themes, seasonal campaigns, and creator-
  friendly cross-promotion — but always as a **distinct** surface, economically and
  visually separated from creator affiliate links.

Two separations the IA must never collapse:
1. **Household knowledge** (canonical systems/lists) vs. **distribution assets**
   (channel derivatives).
2. **Creator affiliate economics** vs. **YurrMom merchandise revenue**.

---

## 5. How the homepage communicates the thesis through use

The homepage is **not a manifesto**. It teaches the thesis by letting the visitor
*do* the thesis in one scroll. The manifesto lives on **About**. Recommended
sequence (from [`03-fable-context.md`](03-fable-context.md)), with the *use* each
section demonstrates:

1. **Current roast / entertainment hook** — fast, funny, clearly fictional.
   *Use demonstrated:* entertainment is the doorway; it's shareable and low-friction.
2. **Immediate bridge to usefulness** — e.g. "Now steal a system that actually
   works." *Use:* the doorway leads somewhere useful — the anti-"meme site" move.
3. **Find help by situation** — first baby, dietary constraints, family size,
   classroom, caregiving, budget, schedule. *Use:* the visitor can self-identify and
   start solving immediately (knowledge before commerce).
4. **Featured household systems** — rich cards showing creator context + what's
   included. *Use:* systems (not products) are the unit; relevance is visible.
5. **Popular portable lists** — *Use:* lists are actionable and adaptable, and
   portable — not owned by a retailer.
6. **Creator invitation** — "create once / publish everywhere" and "no commission on
   affiliate earnings." *Use:* the creator value proposition and the economic promise
   are stated as an invitation to act, not a pitch.
7. **YurrMom merchandise** — original brand products as a **distinct** revenue
   surface. *Use:* native monetization that doesn't touch creator earnings.
8. **Mission / trust** — brief; why the platform exists and how creators keep
   ownership. *Use:* the trust close — and the pointer to About for the full story.

Design constraints on the homepage (from [`03-fable-context.md`](03-fable-context.md)
visual direction + mobile priority):
- Strong hierarchy, generous spacing, one obvious primary action per section.
- Scannable under stress; no dense dashboards or button overload.
- Mobile-first: the sequence reads as a natural vertical scroll; the roast hook and
  situation chips are thumb-reachable; every "act" (save, find help, open a system)
  is one tap.
- The homepage must, by the acceptance test in [`03-fable-context.md`](03-fable-context.md),
  make a first-time visitor understand: *humor brings people in, creators keep their
  affiliate economics, YurrMom earns from its own merch, and the real value is
  packaging household experience into useful, portable systems.*
