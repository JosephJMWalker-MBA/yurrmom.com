# Domain Model

This document refines the initial data-model guidance in
[`03-fable-context.md`](03-fable-context.md) and [`02-platform-model.md`](02-platform-model.md)
into entities, relationships, lifecycle states, ownership rules, and **provenance
boundaries**.

Four separations are load-bearing and must survive every future change. They are the
reason YurrMom is not "a generic affiliate storefront," "a social feed," "an
inventory app," or "a meme store":

1. **Household knowledge** (canonical) vs. **generated distribution assets** (derivatives).
2. **Product identity** vs. **retailer-specific offers**.
3. **Creator affiliate economics** vs. **YurrMom merchandise revenue**.
4. **Fictional roast content** vs. **identifiable real people**.

Field lists below are the conceptual minimum, not a migration. Types are indicative.

---

## Entity map (overview)

```
User ──1:0..1── CreatorProfile ──1:N── HouseholdContext
                      │                      │
                      │ owns                 │ interpreted-by
                      ▼                      ▼
                 HouseholdSystem ◀──uses── (context)
                   ├─1:N─ List ──1:N─ ListItem ──0:N─ ProductReference ──1:N─ RetailerOffer
                   │                        └─0:N─ Substitution                     │
                   ├─1:N─ Recipe                                              AffiliateDisclosure
                   ├─1:N─ Routine
                   ├─1:N─ StorySection
                   ├─0:N─ MediaAsset
                   └─derives─▶ DistributionAsset ──targets──▶ DistributionDestination

Roast:   RoastPrompt ──1:N─ RoastEntry ──0:N─ Vote
                              └────────── 0:N ─ Report ─────────────┐
                                                                    ▼
Commerce (YurrMom-owned):   MerchandiseProduct ──1:N─ MerchandiseVariant ── FulfillmentAdapterRef

Moderation/audit:   Report · ModerationAction (over RoastEntry, RoastPrompt, etc.)
```

---

## Knowledge domain (the durable asset)

### User
Account/identity root. Auth is behind an **adapter** (not a hard-coded vendor).
- `id`, `displayName`, `email`, `roles` (`visitor` | `creator` | `admin`),
  `authProviderRef`, `createdAt`.
- A `visitor` may have **no** User in the slice (anonymous/local save is an open
  decision — see [`05-vertical-slice.md`](05-vertical-slice.md) / [`08-build-plan.md`](08-build-plan.md)).

### CreatorProfile
Public, context-first identity. **Owned by the User**; YurrMom does not own the
creator's brand, audience, content, or affiliate accounts (non-negotiable §3).
- `id`, `userId`, `handle`, `displayName`, `bio`, `specialties[]`,
  `externalChannels[]` (links out), `budgetOrientation`, `storesUsed[]`,
  `avatarMediaId`, `createdAt`.
- Emphasize **relevance attributes** over follower counts (there is no follower
  graph — see anti-goals).

### HouseholdContext
The reusable interpretive frame that makes advice judgeable ("is this like me?").
Separated from CreatorProfile so one creator can document multiple households/stages
and so visitors can match on context.
- `id`, `creatorProfileId`, `label`, `householdSize`, `ageRanges[]`,
  `diet[]`, `allergies[]`, `medicalConstraints[]`, `budgetOrientation`, `climate`,
  `schedule`, `caregivingResponsibilities[]`, `storesUsed[]`.
- Referenced by HouseholdSystem (a system is interpreted *through* a context).

### HouseholdSystem  ← **primary knowledge object**
A repeatable way of handling a household responsibility. This is the unit the whole
product exists to preserve.
- `id`, `creatorProfileId`, `householdContextId`, `title`, `promise` (concise),
  `problemStatement`, `status` (see lifecycle), `lastUpdatedAt`, `version`,
  `disclosures[]`, `taxonomyRefs[]` (situation/household/constraint/task facets).
- Aggregates: `lists[]`, `recipes[]`, `routines[]`, `storySections[]`,
  `mediaAssets[]`, `productReferences[]` (via lists).

### List (portable)
A portable collection of needs/actions. **Must not be owned by a retailer**
(non-negotiable §5). This is the actionable/exportable unit and the commerce-handoff
boundary.
- `id`, `systemId`, `title`, `notes`, `recurrenceDefault`, `items[]`.

### ListItem (Item requirement)
The *need*, expressed independently of any product — the heart of portability.
- `id`, `listId`, `genericName`, `quantity`, `unit`, `preference`, `constraints[]`,
  `creatorExplanation`, `recurrence`, `substitutions[]` (Substitution),
  `productReferences[]` (0..N — a need can exist with **no** product).
- Ordering: the item requirement is primary; products are optional refinements
  under it. Never invert this (products holding needs = the affiliate-blog failure).

### Substitution
An acceptable alternative for a ListItem, preserving creator intent.
- `id`, `listItemId`, `genericName` | `productReferenceId`, `note`, `tradeoff`.

### ProductReference  ← identity, NOT an offer
The product's **identity**, deliberately separate from where/how to buy it.
- `id`, `canonicalName`, `brand?`, `descriptor`, `attributes{}`, `mediaId?`.
- Has 1:N **RetailerOffer**. Owns none of them exclusively; the same product can be
  bought many ways.

### RetailerOffer  ← retailer-specific way to obtain a product
- `id`, `productReferenceId`, `retailerName`, `url`, `packSize?`,
  `priceWhenPermitted?`, `availabilityNote?`, `affiliateAttribution?`
  (belongs to the **creator**), `integrationStatus`
  (`link-only` | `export` | `planned` | `connected`), `disclosureId?`.
- **Separation 2 lives here:** identity (ProductReference) ≠ offer (RetailerOffer).
  A price/availability is a property of an *offer at a retailer*, never of the
  product itself, and is only shown when honest and permitted (no implied universal
  pricing/inventory — non-negotiable §6, technical principles).

### Recipe / Routine / StorySection / MediaAsset
- **Recipe:** `ingredients[]` (may reference ListItems), `instructions`, `timing`,
  `servings`, `constraints[]`, `substitutions[]`, `systemId`.
- **Routine:** `sequence[]`, `frequency`, `roles[]`, `triggers[]`, `systemId`.
- **StorySection:** `systemId`, `heading`, `body` (what happened / what failed /
  what changed) — the "why," creator-authored, verbatim-preserved.
- **MediaAsset:** `id`, `type`, `ref` (storage/adapter ref), `provenance`
  (`creator-uploaded` | `seeded` | `ai-generated`), `altText` (accessibility).

### AffiliateDisclosure
First-class, not decoration. Attached where a creator earns from a link.
- `id`, `scope` (offer/system/asset), `text`, `required` (bool), `visibleAt[]`.

---

## Distribution domain (derivatives — never the source of truth)

### DistributionAsset  ← **Separation 1**
A channel-specific expression *derived from* canonical knowledge. Editable. Links
back to its source. **Never mutates** the source objects.
- `id`, `sourceRefs[]` (systemId/listId/storyId/recipeId — provenance),
  `channelType` (`short-video-script` | `ig-caption` | `ig-carousel` |
  `pinterest-pin` | `facebook-post` | `newsletter-section` | `blog-draft` |
  `affiliate-landing`), `content` (editable), `generationMethod`
  (`template` | `ai-assisted` | `manual`), `linkDestinationRef?`,
  `attributionRef?`, `status` (draft/edited/ready), `createdFromVersion`
  (the source system version it derived from).
- Rule: regenerating an asset creates/updates the asset only; creator source data is
  immutable to this process. This preserves "capture once" without derivative
  drift corrupting the knowledge graph (non-negotiable §11, technical principles).

### DistributionDestination
A channel target and its **honest capability state** (non-negotiable §12).
- `id`, `creatorProfileId`, `channel`, `state`
  (`connected-publishable` | `connected-export-only` | `manual-copy` | `planned` |
  `unavailable`), `adapterRef`.
- UI must render exactly this state. `connected-publishable` may only be set by a
  real, working integration — not present in the slice.

---

## Roast domain (entertainment — the doorway)

### RoastPrompt  ← **Separation 4 (provenance boundary)**
A fictional adult character / scene / archetype inviting humorous responses.
- `id`, `title`, `premise`, `characterMediaId`,
  `characterProvenance` (`synthetic` | `ai-generated` | `archetype` — **never**
  `real-person`), `fictionLabelRequired` (always true), `status`
  (draft/active/retired), `moderationPolicyRef`, `bridgeRefs[]` (systems/creators/
  merch to surface).
- **Hard rule:** a RoastPrompt cannot reference or depict an identifiable private
  person. Fictionality is a structural property, not a moderation afterthought.

### RoastEntry
A community submission against a prompt.
- `id`, `promptId`, `authorUserId?`, `body`, `status`
  (`pending` | `approved` | `removed` | `escalated`), `createdAt`,
  `voteScore` (derived).
- **Default `pending`**; not public until moderated (see Moderation).

### Vote
- `id`, `entryId`, `voterRef`, `value`. Ranking should reward **wit, not cruelty**
  (a product/ranking design constraint, enforced in surfacing logic).

---

## Commerce domain (YurrMom-owned — **Separation 3**)

### MerchandiseProduct
Original YurrMom design; the **native** revenue engine. Economically and visually
distinct from creator affiliate links.
- `id`, `title`, `brandStory`, `collection?`, `seasonalTags[]`, `mediaIds[]`,
  `variants[]`, `printfulProductRef` (adapter), `status`.
- **Separation 3:** merchandise revenue is YurrMom's own; it never flows through, or
  mixes with, a creator's affiliate economics. A MerchandiseProduct has no
  affiliate attribution to a creator; a RetailerOffer's affiliate attribution is
  always the creator's. These two revenue paths share no ownership field.

### MerchandiseVariant
- `id`, `merchandiseProductId`, `sku`, `options{size,color,...}`,
  `fulfillmentRef` (Printful adapter), `priceSource` (honest; adapter-provided).

### FulfillmentAdapterRef / PaymentAdapterRef
Boundary objects for Printful fulfillment and payment. Honest state; no fake
checkout in the slice (see [`05-vertical-slice.md`](05-vertical-slice.md)).

---

## Moderation & audit (first-class)

### Report
- `id`, `targetType` (RoastEntry | RoastPrompt | other), `targetId`, `reason`
  (incl. `targets-real-person`, `hate/protected-trait`, `harassment`, `sexual`,
  `minor`, `pii/doxxing`, `other`), `reporterRef`, `status`, `createdAt`.

### ModerationAction
The audit trail. Every consequential admin action is recorded.
- `id`, `actorUserId`, `targetType`, `targetId`, `action`
  (`approve` | `remove` | `escalate` | `retire` | `feature` | `unfeature`),
  `rationale`, `createdAt`.

---

## Lifecycle states

| Entity | States | Notes |
|---|---|---|
| HouseholdSystem | `draft` → `published` → `updated`(versioned) → `archived` | `lastUpdatedAt`/`version` shown publicly ("last updated") |
| List / ListItem | inherit system; independently editable while draft | portability preserved across versions |
| DistributionAsset | `draft` → `edited` → `ready` (→ exported/copied) | never `published` to a platform unless destination is truly `connected-publishable` |
| DistributionDestination | `planned` / `manual-copy` / `connected-export-only` / `connected-publishable` / `unavailable` | UI mirrors state exactly |
| RoastPrompt | `draft` → `active` → `retired` | fiction label always on |
| RoastEntry | `pending` → `approved` \| `removed` \| `escalated` | default `pending`; not public until approved |
| MerchandiseProduct | `draft` → `active` → `retired` | fulfillment/payment via adapter |
| Report | `open` → `reviewing` → `resolved`(action) | drives moderation queue priority |

---

## Ownership rules

- **Creator owns:** CreatorProfile, HouseholdContext, HouseholdSystem and all its
  knowledge children (Lists, Recipes, Routines, StorySections, ProductReferences,
  their RetailerOffers), DistributionAssets, and all **affiliate attribution** on
  their offers/assets. YurrMom takes **no commission** on these earnings and must
  not reroute the creator's links (non-negotiables §3, §5).
- **YurrMom owns:** MerchandiseProduct/Variant and their revenue; RoastPrompts;
  Featured/Taxonomy curation; adapter configuration.
- **Visitor owns:** their saved/adapted copies (device-local and/or account-scoped
  per the open decision). Adapting a system creates the visitor's own derivative;
  it never mutates the creator's canonical system.
- **Admin acts on** roast content, features, taxonomy, and integrations — always via
  audited ModerationActions.

---

## Provenance boundaries (must never blur)

1. **Knowledge vs. distribution:** DistributionAsset is always a *derivative* with
   `sourceRefs[]` back to canonical objects and `createdFromVersion`. Generation
   (template or AI) writes only to the asset, never to the source. A reviewer can
   always trace an asset to the system it came from.
2. **Product identity vs. retailer offer:** ProductReference carries identity;
   RetailerOffer carries the buy-path, price (when permitted/honest), availability,
   affiliate attribution, and integration status. Price/stock are never attributes
   of the product itself → no implied universal inventory/pricing.
3. **Creator affiliate vs. YurrMom merch:** the two revenue paths share no ownership
   or attribution field. Affiliate attribution ⇒ creator. Merchandise revenue ⇒
   YurrMom. Cross-promotion may *link* them but must keep them visibly and
   economically distinct.
4. **Fictional roast vs. real people:** `characterProvenance` excludes
   `real-person` by construction; `fictionLabelRequired` is always true; Reports
   include `targets-real-person` and removal is fast. Fictionality is enforced in
   the model, not merely by policy text.

---

## Anti-goals encoded in the model

To keep the product from collapsing into a forbidden shape
([`03-fable-context.md`](03-fable-context.md)):
- **No follower graph, feed, or DM entities** → not a mom social network.
- **No inventory/stock-owning entity** for household products; stock is at most an
  honest adapter-provided note on a RetailerOffer → not an inventory app.
- **Products live under item requirements**, never as top-level catalog rows the
  system exists to serve → not an affiliate storefront.
- **Roast is a bounded funnel entity** with mandatory bridges and fiction
  provenance → not a meme site.
- **MerchandiseProduct is one bounded surface**, not the spine → not a Printful
  store with content bolted on.
