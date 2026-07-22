# User Journeys

This document defines the complete end-to-end journeys for the primary actors on
YurrMom. Each journey is written to be testable: it states the user's **starting
condition**, **desired outcome**, **major steps**, **trust requirements**,
**failure points**, and **mobile behavior**.

These journeys govern the vertical slice (see [`05-vertical-slice.md`](05-vertical-slice.md))
and the information architecture (see [`06-information-architecture.md`](06-information-architecture.md)).
Where a journey depends on a capability that is not yet real (retailer carts,
social publishing, AI generation, Printful sync, authentication), the journey
must degrade to an **honest adapter state** rather than pretending. This is a
non-negotiable (see [`00-non-negotiables.md`](00-non-negotiables.md) §12).

---

## Cross-cutting principles for all journeys

- **Knowledge before commerce.** No journey may terminate at a checkout as its
  point. The point is always the transferred household system; commerce is a
  downstream handoff the user opts into.
- **No dead ends into fake capability.** Every action either works, exports
  honestly, or is clearly labeled as "planned / not yet connected."
- **Stress-legible.** A tired caregiver on a phone at 11pm must be able to scan,
  understand, and act. Copy is short; the primary action is obvious; secondary
  actions never crowd it.
- **Provenance is always visible.** A creator's affiliate destination, an
  affiliate disclosure, and the fictional nature of roast content are never
  hidden to make a screen cleaner.

---

## Journey 1 — Stressed household visitor seeking help

**Persona:** A first-time parent, a newly diagnosed celiac household, a caregiver,
or a teacher setting up a classroom. Arrives with a concrete, urgent question and
low patience.

**Starting condition:** Lands on Home, a **Find Help** entry, or a shared system
link (often from a text message or social post). Unauthenticated. On a phone.
Emotional state: overwhelmed, skeptical of "another mom site."

**Desired outcome:** Find a household system that resembles their real
circumstances, understand *why it works*, and leave with something actionable — a
saved system, a printed/exported list, or a shopping handoff — without having to
reinvent the approach themselves.

**Major steps:**

1. Enters via situation-based discovery ("first baby," "gluten-free pantry,"
   "family of six laundry," "classroom setup," "tight budget this month").
2. Scans **Find Help** results filtered by situation, household type, constraint,
   or task. Results are systems, not products.
3. Opens a **Household System page**. Reads the concise promise, the creator's
   household context (so they can judge relevance), and the story of *why* it
   exists and what failed before it worked.
4. Inspects the included **portable list(s)**: required need → creator's preferred
   product → acceptable substitutions → quantity/recurrence → notes.
5. Chooses an honest action: **Save** the system, **adapt** a list, **print/export**
   it, **copy** it, or **open a retailer link** the creator attached.
6. Optionally follows related systems or the creator's other work.

**Trust requirements:**

- Household context must be specific enough to answer "is this person like me?"
  (size, stage, diet/medical, budget, stores, schedule).
- Affiliate disclosure must be visible wherever a retailer link exists.
- The distinction between the creator's preferred product and *acceptable
  substitutions* must be explicit, so the visitor never feels locked into one SKU
  or one retailer.
- "Last updated" / update history signals the system is maintained, not stale.

**Possible failure points:**

- **Relevance mismatch:** results feel generic or aimed at a different household →
  visitor bounces. Mitigation: situation-first filtering, honest context on cards.
- **Save requires account:** forcing sign-up before any value destroys the stressed
  visitor. Mitigation: allow *anonymous/local save* (device-scoped) with an
  optional later upgrade to an account. **This is an architectural decision that
  requires approval — see [`08-build-plan.md`](08-build-plan.md).**
- **Fake commerce:** a "Send to cart" button that silently does nothing erodes all
  trust. Mitigation: only expose actions that truly work; label the rest.
- **Overload:** dense product grid reads as an affiliate blog. Mitigation: system
  and story first; products nested inside list items.

**Mobile behavior:** This is the primary mobile journey. Situation chips are
thumb-reachable. System page is a vertical read with a sticky primary action.
Lists support checkoff while physically shopping. Export/copy/print are one tap.
No horizontal dashboards.

---

## Journey 2 — Creator documenting a proven household system

**Persona:** A parent, teacher, dietitian, caregiver, or organizer who already has
a working method and possibly an existing audience and affiliate relationships.

**Starting condition:** Authenticated creator (or invited demo creator in the
slice) in the **Creator Workspace**. Wants to capture a method they already run —
not write a blog post.

**Desired outcome:** A canonical **Household System** exists in YurrMom as the
durable source of truth: context, problem/promise, story/lessons, lists, routines,
recipes, products, substitutions, media, and disclosures — reusable and portable,
owned by them.

**Major steps:**

1. Opens **Systems → Create system** in the workspace.
2. Defines or selects a **Household Context** (size, stage, diet/medical, budget,
   climate, stores used, schedule, caregiving). This is reusable across systems.
3. States the **problem and promise** in plain language.
4. Adds **structured content**: lists (with item requirements, preferred products,
   substitutions, quantities, recurrence), routines, recipes.
5. Attaches **product references** and, per product, their own approved **retailer
   offers / affiliate destinations** and attribution.
6. Writes the **story**: what happened, what failed, what changed with experience.
7. Adds **media** and required **disclosures**.
8. Saves as draft; publishes to their YurrMom profile when ready.

**Trust requirements:**

- The creator owns the system, its identity, its audience relationship, and its
  affiliate economics. YurrMom takes **no commission** on their affiliate earnings
  and must never obscure or reroute their links.
- Source data the creator enters is preserved verbatim and is never overwritten by
  generated derivatives (see Journey 3).
- Disclosures and attribution are first-class fields, not afterthoughts.

**Possible failure points:**

- **Feels like a blog editor:** if capture is a big empty text box, the structured
  knowledge graph is lost and the product collapses into a social feed. Mitigation:
  structured editor that documents a *method* (context → promise → lists → why).
- **Product/offer conflation:** letting a creator paste a single retailer URL as
  "the product" destroys portability. Mitigation: product identity is separate
  from retailer offers in the model (see [`07-domain-model.md`](07-domain-model.md)).
- **Effort/reward gap:** structured capture is more work than a caption. The payoff
  (Journey 3 distribution) must be visible early or creators won't originate here.

**Mobile behavior:** Creators capture ideas on phones — a product seen in a store,
a substitution that worked, a quick story. Mobile must support *incremental*
capture (add one list item, one story note, one photo to an existing system)
without forcing the full desktop editor. Full structural editing may be
desktop-optimized but must not be desktop-only for core capture.

---

## Journey 3 — Creator preparing content for external channels

**Persona:** Same creator as Journey 2, now wanting reach. They already publish on
TikTok, Instagram, YouTube Shorts, Pinterest, Facebook, newsletters, or a blog.

**Starting condition:** At least one published/complete Household System exists.
Creator opens **Content Studio**.

**Desired outcome:** Editable, channel-appropriate **distribution assets** derived
from the canonical system — a short-video script, IG caption/carousel outline,
Pinterest pin copy, Facebook post, newsletter section, blog draft, affiliate
landing copy — which they review, edit, and send/export to the channels they
already use, with links back to the canonical system.

**Major steps:**

1. In **Content Studio**, selects source objects (a system, a list, a story, a
   recipe).
2. Chooses target channels / asset types.
3. YurrMom produces **editable draft assets** from the structured source
   (templated in the slice; AI-assisted only behind a labeled adapter later).
4. Creator **reviews and edits** every asset. Nothing auto-publishes.
5. Chooses per-asset **link destination and attribution** (their own affiliate
   destination where relevant).
6. Goes to **Distribution** and acts according to each destination's honest state:
   **connected & publishable**, **connected export-only**, **manual copy/download**,
   or **planned**.

**Trust requirements:**

- **Capture once; publish everywhere** must be real *for the honest states*. The
  canonical system stays the source of truth; assets are derivatives that link
  back.
- **No silent auto-publish.** A destination is only shown as "publishable" if the
  integration truly works. Otherwise it is export/copy/planned.
- Provenance: each asset shows which system/objects it came from.
- This is **not** an "AI content generator." Generation, when present, is an
  assist behind an adapter, always editable, never the product's identity.

**Possible failure points:**

- **Overclaiming publish:** the single most damaging failure — a "Publish to
  TikTok" button that doesn't. Mitigation: adapter states enforced in UI and data
  model.
- **Derivative overwrites source:** regenerating an asset must never mutate the
  creator's canonical entries. Mitigation: strict source/derivative separation.
- **Generic output:** templated assets that ignore household context read as spam.
  Mitigation: drive templates from the structured context and story.

**Mobile behavior:** Reviewing/editing/copying an asset and pasting it into a
native social app is a common mobile flow. "Copy for Instagram," "download pin
image," and "share" must be one-tap on mobile. Full multi-asset Studio layout may
be richer on desktop.

---

## Journey 4 — Visitor entering through the roast funnel

**Persona:** Someone who was *not* searching for household help. Arrived from a
shared roast, a funny ad, or a meme link. Curious, entertained, low intent.

**Starting condition:** Unauthenticated, on a phone, arriving at the **Roast** page
or Home's roast hook.

**Desired outcome (platform's):** Convert entertainment attention into a step
toward usefulness — a creator, a system, a list, or merchandise — without breaking
the fun. **Entertainment is the doorway, not the destination.**

**Major steps:**

1. Sees a current roast: a **clearly fictional / AI-generated adult character or
   archetype** with a premise. Fictional-content labeling is visible.
2. Reads top entries, votes, or submits a witty entry (submission enters
   moderation; see Journey 6).
3. Encounters an **intentional bridge to usefulness** — e.g. "Now steal a system
   that actually works" — linking the roast's theme to real household systems,
   creators, or merch.
4. Optionally follows into **Find Help**, a **creator**, or the **Shop**.

**Trust requirements:**

- Roast subjects must be unmistakably **fictional/synthetic adults or archetypes** —
  never identifiable private people, never children, never protected traits.
- Voting/ranking rewards **wit, not cruelty**. Reporting is always one tap away.
- The bridge to usefulness must feel earned/brand-appropriate, not like a
  bait-and-switch ad.

**Possible failure points:**

- **Entertainment becomes the whole identity:** if the funnel never bridges, the
  platform is "a meme site" — an explicit anti-goal. Mitigation: every roast surface
  has a designed path into systems/creators/merch.
- **Moderation gap on submission:** unmoderated entries can produce harassment or
  real-person targeting. Mitigation: submissions are pending by default; moderation
  is first-class (Journey 6).
- **Ambiguous fiction:** a synthetic character that reads as a real person creates
  reputational and legal risk. Mitigation: provenance boundary — roast characters
  are a distinct entity that cannot reference identifiable real people (see
  [`07-domain-model.md`](07-domain-model.md)).

**Mobile behavior:** The roast is a fast, vertical, swipeable, shareable mobile
experience. Vote and share are thumb-first. Submitting an entry is a short form.
Sharing out (and the bridge back in) are the two most important mobile actions.

---

## Journey 5 — Shopper discovering YurrMom merchandise

**Persona:** A visitor who resonates with the brand's voice (often arriving via
roast/comedy) or an existing fan. Intent ranges from browsing to buying.

**Starting condition:** Enters **Shop** from Home, a roast theme, a seasonal
campaign, or creator cross-promotion. May be authenticated or not.

**Desired outcome:** Discover and (eventually) purchase **original YurrMom
merchandise** — the platform's native revenue — presented with strong brand
personality and kept **visually and economically distinct** from creator affiliate
links.

**Major steps:**

1. Browses the Shop or a themed/seasonal collection.
2. Opens a **Merchandise item** with brand-forward presentation.
3. Selects options (size/color/variant).
4. Proceeds toward purchase via the **Printful fulfillment adapter**.

**Trust requirements:**

- Merchandise revenue must be clearly **YurrMom's own** — never presented as, or
  mixed with, a creator's affiliate product. This separation protects the "no
  commission on creator earnings" promise from ambiguity.
- Any pricing/availability shown must be honest about its source; do not imply live
  inventory the adapter can't confirm.

**Possible failure points:**

- **Shop dominates the thesis:** if merch reads as the point, the product becomes "a
  Printful store with content around it" — an explicit anti-goal. Mitigation: Shop
  is a distinct surface, reached *from* content, not the homepage's spine.
- **Fake checkout:** representing purchase/fulfillment as working before Printful is
  truly connected. Mitigation: **Printful adapter placeholder** with an honest state
  (see [`05-vertical-slice.md`](05-vertical-slice.md)); real checkout only when
  credentials exist. **Whether the slice includes real Printful checkout is an
  approval-gated decision.**
- **Payment handling:** purchase requires payment processing — an external, security-
  sensitive integration behind an adapter, not built in the slice.

**Mobile behavior:** Visual, swipeable product presentation; large imagery;
variant pickers that are thumb-friendly. Checkout, when real, is a mobile-optimized
handoff to the fulfillment/payment adapter — never a cramped desktop form.

---

## Journey 6 — Administrator moderating roast submissions and featured content

**Persona:** A YurrMom administrator/moderator responsible for keeping roast
content within boundaries and curating what the public sees.

**Starting condition:** Authenticated admin in the **Administration** area.

**Desired outcome:** Roast entries and prompts stay **fictional, adult, non-doxxing,
behavior-focused, and non-hateful**; reported content is reviewed and removed when
warranted; featured systems/creators/merch are curated; taxonomy stays coherent.

**Major steps:**

1. Opens **Moderation** queue: pending roast entries and reported items, most-urgent
   first.
2. Reviews each against boundaries (fictional target, adult, no PII, no protected-
   trait attacks, no threats/harassment).
3. Takes action: **approve**, **reject/remove**, or **escalate**; actions are logged.
4. Manages **Roast prompts**: creates/retires prompts using fictional/synthetic
   adult characters or archetypes.
5. Curates **Featured content** (systems, creators) and **Merchandise** placement.
6. Maintains **Taxonomy** (situations, household types, constraints, tasks) that
   powers Find Help.

**Trust requirements:**

- Moderation must be **first-class from the beginning**, not retrofitted — reporting,
  review, and removal are core capabilities.
- Actions are auditable (who did what, when, why) to support consistency and appeals.
- Featuring must not blur the creator-affiliate vs. YurrMom-merch economic boundary.

**Possible failure points:**

- **Backlog / no SLA:** unreviewed submissions sit publicly. Mitigation: submissions
  default to pending; queue prioritizes reports; the slice ships a working queue even
  if seeded.
- **Ambiguous rules:** inconsistent calls erode community trust. Mitigation: encode
  the moderation boundaries from [`02-platform-model.md`](02-platform-model.md) as
  explicit, visible criteria in the tool.
- **Real-person leakage:** an entry that names/depicts a real private person. Mitigation:
  reporting reasons include "targets a real person"; removal is fast; provenance rules
  keep roast entities fictional by construction.

**Mobile behavior:** Moderation is primarily a desktop/tablet workflow (denser
review context), but the **queue and single-item approve/reject/remove** should be
usable on mobile so urgent reports can be handled quickly away from a desk. Do not
compress the full admin dashboard onto a phone; expose the urgent path only.

---

## Journey interaction map

The journeys are deliberately linked — this connectivity *is* the thesis expressed
through use:

- **Roast (4)** → bridges into **Find Help / System (1)**, **Creator**, and **Shop (5)**.
- **Visitor (1)** → discovers a **Creator (2)** and their other systems; may enter
  the **Shop (5)**.
- **Creator documents (2)** → feeds **Creator distribution (3)**; published systems
  become discoverable in (1).
- **Creator distribution (3)** → external channels drive new **visitors (1)** and
  **roast (4)** traffic back in.
- **Admin (6)** → gatekeeps roast (4) and curates what (1) and (5) surface.

A reviewer moving through these journeys should conclude exactly what the acceptance
test in [`03-fable-context.md`](03-fable-context.md) demands — and never conclude
"affiliate blog," "mom social network," "inventory app," or "meme store."
