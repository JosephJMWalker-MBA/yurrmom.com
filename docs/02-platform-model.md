# Platform Model

## Three reinforcing layers

### 1. Household knowledge

The mission layer contains the durable, reusable value:

- household systems
- lists
- routines
- recipes
- product selections
- substitutions
- schedules
- constraints
- stories and explanations
- updates based on experience

### 2. Creator operating system

The product layer helps a creator turn experience into structured knowledge and channel-specific media.

A representative workflow:

1. Define the household context
2. Create or update a system
3. Add lists, routines, recipes, products, and substitutions
4. Explain why the system works
5. Add media or record a story
6. Prepare content variants
7. Publish on YurrMom
8. Send or export variants to external channels
9. Review performance and improve the canonical system

The system remains the source of truth. Social posts are distribution artifacts.

### 3. Discovery and monetization

The growth and sustainability layer includes:

- roast competitions using fictional AI-generated adult characters
- funny ads and short-form entertainment
- creator cross-promotion
- searchable household guidance
- YurrMom Printful merchandise
- potential optional agency services

## Core domain objects

### Creator

A person or organization sharing practical experience. A creator may be a mother, father, teacher, caregiver, organizer, dietitian, family member, or other household expert.

### Household profile

Context that makes advice interpretable, such as household size, age ranges, diet, allergies, budget, schedule, climate, stores used, and caregiving responsibilities.

### Household system

The primary knowledge object. It describes a repeatable way of handling a household responsibility or life situation.

### List

A portable collection of needed items or actions. Lists may contain products, generic item requirements, quantities, preferred substitutions, recurrence, and notes.

### Product reference

A product used to implement a list or system. The internal model must separate the product’s identity from retailer-specific offers and affiliate destinations.

### Retailer offer

A retailer-specific way to obtain a product, including URL, availability, pack size, price when permitted, affiliate attribution, and integration status.

### Recipe

Ingredients, instructions, timing, servings, constraints, substitutions, and connections to lists or meal systems.

### Routine

A repeatable sequence tied to timing, frequency, roles, or triggers.

### Story

The creator’s explanation of what happened, why the system exists, what failed, and what was learned.

### Distribution asset

A generated or edited expression intended for a particular channel: caption, short script, carousel, pin, newsletter section, blog article, video prompt, thumbnail brief, or link page.

### Roast prompt

A fictional adult character, scene, or archetype designed to invite humorous community responses under clear moderation rules.

### Merchandise item

An original YurrMom design connected to Printful products and storefront presentation.

## Portable list architecture

A YurrMom list should describe intent independently from commerce.

Conceptually:

```text
List
 ├─ Item requirement
 │   ├─ generic name
 │   ├─ quantity / unit
 │   ├─ preference and constraints
 │   ├─ creator explanation
 │   ├─ acceptable substitutions
 │   └─ product references
 │       └─ retailer offers
```

This allows the same list to support:

- print or PDF
- manual checkoff
- copy and paste
- CSV or structured export
- retailer deep links
- affiliate destinations
- future cart integrations
- personal-shopping services
- local-store substitution

The first implementation should not claim universal cart synchronization. It should establish this stable model and provide useful handoffs that are technically honest.

## Creator distribution architecture

The canonical system should feed a content workspace.

```text
Household system
  ↓
Structured source material
  ↓
Channel brief
  ↓
Creator review and editing
  ↓
Published/exported asset
```

Generated content must remain editable. External publishing integrations should be adapters with explicit states such as:

- connected
- export only
- manual copy
- planned
- unavailable

Do not represent a platform as directly publishable unless the integration truly works.

## Public experience

The public site should support two modes without confusing them:

### Discover and laugh

A visitor can quickly enter through entertainment, current roasts, funny ads, and merchandise.

### Solve a real problem

A visitor can search or browse by:

- situation
- household type
- constraint
- task
- creator
- system
- list
- recipe
- product

Entertainment should create obvious paths into useful content.

## Creator economics

YurrMom does not take a commission from creator affiliate earnings.

The creator can associate their own approved destinations with product references. Attribution and disclosures must be visible. The platform may offer optional services later, but those must be separate from the core creator promise.

## YurrMom economics

The native monetization engine is original merchandise fulfilled through Printful. Merchandise can be discovered through:

- the shop
- relevant comedy content
- roast themes
- seasonal collections
- creator-friendly cross-promotion that does not replace creator links

## Moderation boundaries

Roast content should be:

- fictional or synthetic by default
- limited to adults
- free of private identifying information
- focused on behavior and recognizable situations
- protected against threats, hate, sexual harassment, and coordinated targeting

Community ranking should reward wit rather than cruelty. Product design should make reporting, review, and removal practical from the beginning.
