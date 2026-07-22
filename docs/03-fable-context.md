# Fable 5 Context Brief

## Assignment

Build the first coherent version of YurrMom.com.

Do not reduce the concept to any of the following:

- a generic affiliate storefront
- a social feed for mothers
- an inventory-management application
- a meme site
- a Printful store with content added around it
- an AI content generator

YurrMom is a platform for capturing, distributing, and acting on practical household experience.

## Product north star

A creator should be able to explain a household system once, attach the lists and knowledge that make it useful, and then prepare content for YurrMom and the external channels where they already publish.

A household visitor should be able to find a system relevant to their circumstances, understand why it works, save or adapt its lists, and continue into the shopping or delivery services they prefer.

## First-build objective

Create a polished, navigable product foundation that communicates the complete thesis while implementing only the narrowest credible workflows.

The first build should make these experiences feel real:

1. A visitor discovers YurrMom through a current fictional roast or funny campaign
2. The visitor moves from entertainment into a useful creator system
3. The visitor can inspect a portable list and choose an honest shopping/export action
4. A creator can create a household system with structured content
5. The creator can prepare editable channel variants from that source
6. Visitors can discover original YurrMom merchandise

External retailer carts, direct social publishing, AI media generation, and Printful synchronization may require credentials or approvals. Build these behind clearly labeled adapter states and realistic demo data rather than pretending unsupported actions work.

## Recommended information architecture

### Public navigation

- Home
- Find Help
- Lists & Systems
- Creators
- Roast
- Shop
- About

### Creator workspace

- Overview
- Systems
- Lists
- Content Studio
- Distribution
- Profile
- Connections

### Administration

- Moderation
- Featured content
- Roast prompts
- Merchandise
- Integrations
- Taxonomy

## Homepage behavior

The homepage must explain YurrMom through use, not a long manifesto.

Recommended sequence:

1. **Current roast / entertainment hook** — fast, funny, clearly fictional
2. **Immediate bridge to usefulness** — “Now steal a system that actually works” or equivalent brand-appropriate language
3. **Find help by situation** — first baby, dietary constraints, family size, classroom, caregiving, budget, schedule
4. **Featured household systems** — visually rich cards showing creator context and what the system includes
5. **Popular portable lists** — show that lists are actionable and adaptable
6. **Creator invitation** — explain create once / publish everywhere and no commission on affiliate earnings
7. **YurrMom merchandise** — original brand products as a distinct revenue surface
8. **Mission / trust** — why the platform exists and how creators retain ownership

## Core public screens

### Household system page

Must show:

- title and concise promise
- creator and household context
- story / why this exists
- included lists, recipes, routines, and products
- constraints and substitutions
- update history or “last updated”
- save / adapt action
- shopping and export options
- affiliate disclosure where relevant
- related systems and creator content

### Portable list page

Must distinguish:

- required item or need
- creator’s preferred product
- acceptable substitutions
- quantity and recurrence
- notes on use
- retailer-specific offers

Provide useful actions such as print, copy, export, check off, and open retailer links. Label future integrations honestly.

### Creator profile

Prioritize relevance over popularity.

Show contextual attributes such as household type, practical specialties, dietary constraints, stores used, budget orientation, and schedule—not merely follower counts.

### Roast page

Use clearly fictional AI-generated adult characters or situations. Include:

- prompt image and premise
- comment submission
- ranking or voting
- reporting
- moderation status
- links into related creators, systems, campaigns, or merchandise

The tone can be bold, but the mechanics should reward cleverness rather than cruelty.

### Shop

Present original YurrMom merchandise with strong brand personality. Keep it visually and economically distinct from creator affiliate links.

## Core creator screens

### Create system

A structured editor for:

- household context
- problem / promise
- story and lessons learned
- lists
- routines
- recipes
- products
- substitutions
- media
- disclosures

The experience should feel more like documenting a proven operating method than writing a generic blog post.

### Content Studio

Allow the creator to select source objects and prepare editable outputs such as:

- short-video script
- Instagram caption or carousel outline
- Pinterest pin copy
- Facebook post
- newsletter section
- blog draft
- affiliate-link landing copy

Do not automatically publish without review. Show where each asset came from and keep links back to the canonical system.

### Distribution

Represent destination capabilities explicitly:

- connected and publishable
- connected but export-only
- manual copy/download
- planned integration

Creators should be able to choose their preferred link destination and attribution per asset where appropriate.

## Initial data model guidance

At minimum, plan for:

- User
- CreatorProfile
- HouseholdContext
- HouseholdSystem
- List
- ListItem
- ProductReference
- RetailerOffer
- Recipe
- Routine
- StorySection
- MediaAsset
- DistributionAsset
- DistributionDestination
- AffiliateDisclosure
- RoastPrompt
- RoastEntry
- Vote
- Report
- MerchandiseProduct

Keep product identity separate from retailer offers. Keep canonical knowledge separate from generated distribution assets.

## Visual direction

YurrMom should not look like a sterile enterprise dashboard or a pastel parenting template.

The brand should be:

- confident
- funny
- human
- useful
- slightly irreverent
- easy to scan under stress

Public pages can carry energetic editorial personality. Creator tools should become calmer and more structured without feeling disconnected from the brand.

Use strong hierarchy, generous spacing, clear actions, and mobile-first patterns. Avoid dense dashboards and button overload.

## Mobile priority

A large share of visitors and creators will use phones.

Mobile must support:

- quick entertainment consumption
- search and filtering
- list checkoff while shopping
- saving and adapting systems
- creator capture of an idea, story, product, or list item
- copy/export/share workflows

Do not simply compress the desktop dashboard.

## Technical principles

- Use replaceable adapters for retailers, affiliate networks, social destinations, AI providers, and Printful
- Do not imply universal inventory, pricing, or cart accuracy
- Preserve creator-entered source data when generating derivatives
- Make disclosures and provenance visible
- Design moderation and reporting as first-class capabilities
- Favor a stable domain model over premature external integrations
- Seed the product with realistic demo households, systems, lists, roasts, and merchandise so the concept can be evaluated end to end

## Suggested first milestone

Deliver a vertical slice using seeded data:

1. Homepage with roast hook, useful systems, creator invitation, and merch
2. One complete creator profile
3. Three complete household systems with lists and products
4. One portable-list handoff flow
5. Creator system editor
6. Content Studio generating or templating three editable channel assets
7. Roast participation and moderation flow
8. Shop presentation with Printful adapter placeholder or real connection when credentials exist

## Acceptance test

A reviewer unfamiliar with YurrMom should be able to use the prototype and accurately conclude:

> “This helps people package real household experience into useful systems and lists, distribute that knowledge across channels, and act on it through existing shopping infrastructure. Humor brings people in, creators keep their affiliate economics, and YurrMom earns from its own merchandise.”

If the prototype instead communicates “affiliate blog,” “mom social network,” “inventory app,” or “meme store,” the product thesis has been lost.
