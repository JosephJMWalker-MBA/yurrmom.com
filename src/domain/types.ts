/**
 * Domain types for the public vertical slice.
 *
 * This is the public-rendering subset of docs/07-domain-model.md. The four
 * load-bearing separations are preserved structurally:
 *
 *  1. Household knowledge (canonical) vs. distribution assets — the latter are
 *     not rendered in this slice, so they simply do not appear here.
 *  2. Product identity (ProductPreference.name) vs. retailer-specific offers
 *     (RetailerOffer) — an offer is never the product.
 *  3. Creator affiliate economics (RetailerOffer.affiliate → creator) vs.
 *     yurrmom.com merchandise (MerchItem, no creator attribution field exists).
 *  4. Fictional roast content (RoastPrompt.fiction is mandatory) vs. real
 *     people — there is no way to express a real-person roast subject.
 *
 * No framework imports belong in this module.
 */

// ---------------------------------------------------------------- adapters

/** Honest capability states — the UI must render exactly these, never imply more. */
export type AdapterState =
  | "connected-publishable"
  | "connected-export-only"
  | "manual-copy"
  | "link-only"
  | "export"
  | "planned"
  | "unavailable";

// ---------------------------------------------------------------- creators

export interface HouseholdContext {
  label: string;
  householdSize: string;
  /** Family stage in plain words, e.g. "school-age kids", "newborn weeks". */
  familyStage?: string;
  ageRanges: string[];
  diet: string[];
  constraints: string[];
  budgetOrientation: string;
  schedule: string;
  storesUsed: string[];
  caregiving?: string[];
  /** Climate / location / classroom / other setting context. */
  environment?: string;
  /** Plain-language field for anything the structured fields miss. */
  additionalContext?: string;
}

export interface ExternalChannel {
  label: string;
  url: string;
}

export interface Creator {
  handle: string;
  displayName: string;
  pronouns?: string;
  tagline: string;
  bio: string;
  specialties: string[];
  context: HouseholdContext;
  externalChannels: ExternalChannel[];
  /** Slug refs into systems — creator owns these. */
  systemSlugs: string[];
  accent: "tomato" | "sage" | "mustard";
}

// ---------------------------------------------------------------- knowledge

/**
 * Structured story kinds (Phase 2). The story is captured as typed sections,
 * not one blank blog editor — this is what makes it reusable knowledge.
 */
export type StoryKind =
  | "what-happened"
  | "what-failed"
  | "what-changed"
  | "what-works-now"
  | "lessons-learned"
  | "warnings";

export interface StorySection {
  heading: string;
  body: string;
  /** Optional structured kind; legacy sections may carry heading only. */
  kind?: StoryKind;
}

export interface RoutineStep {
  when: string;
  what: string;
}

/**
 * Cred at Home readiness (Phase 2 extension point). Structural capacity only:
 * a routine may describe the skill it teaches and how competence would be
 * recognized. NO scores, NO automatic child judgments, NO rewards or purchase
 * entitlements exist anywhere in the model — by design (Phase 2 assignment).
 */
export interface CredReadiness {
  skillTaught?: string;
  ageApplicability?: string;
  supervisionLevel?: "none" | "nearby" | "direct";
  demonstrationRequired?: boolean;
  practiceFrequency?: string;
  competenceCriteria?: string;
  evidenceOfCompletion?: string;
}

export interface Routine {
  title: string;
  frequency: string;
  steps: RoutineStep[];
  /** What must be true/ready before this routine can run. */
  prerequisites?: string[];
  note?: string;
  /** Optional Cred at Home readiness — see CredReadiness. */
  cred?: CredReadiness;
}

export interface Recipe {
  title: string;
  servings: string;
  time: string;
  ingredients: string[];
  steps: string[];
  prerequisites?: string[];
  note?: string;
}

// ----------------------------------------------------- provenance & meaning

/**
 * What kind of knowledge this is. Rendered plainly wherever the system is
 * shown, so yurrmom.com never implies medical, legal, nutritional, educational,
 * or developmental authority that has not been established.
 */
export type SourceType =
  | "personal-experience"
  | "professional-guidance"
  | "sourced-reference";

export interface Provenance {
  sourceType: SourceType;
  /** Lived-experience designation: the creator actually runs this system. */
  livedExperience: boolean;
  /** Creator-entered note on where this knowledge comes from. */
  creatorNote?: string;
  /** ISO date the creator last reviewed the content for accuracy. */
  lastReviewed?: string;
}

/**
 * Semantic facets (Phase 2 extension point for household intelligence).
 * Captured through the human editor — never exposed as ontology management.
 * All optional; a grounded assistant can later read these without guessing.
 */
export interface SemanticFacets {
  householdCircumstances?: string[];
  developmentalStage?: string;
  /** Task / household domain, e.g. "kitchen & food safety". */
  domain?: string;
  purpose?: string;
  constraints?: string[];
  skillsTaught?: string[];
  requiredKnowledge?: string[];
  outcomesObserved?: string[];
  evidenceType?: SourceType;
  applicability?: string;
  limitations?: string;
}

export interface HouseholdSystem {
  slug: string;
  creatorHandle: string;
  title: string;
  /** The concise promise — one sentence a stressed person can trust. */
  promise: string;
  problem: string;
  /** Who this system is actually useful for. */
  audience?: string;
  /** Results the creator has actually experienced — observed, not promised. */
  observedResults?: string;
  /** Where this system may NOT apply. Honesty is a feature. */
  limitations?: string;
  situationTags: string[];
  lastUpdated: string; // ISO date
  version: number;
  story: StorySection[];
  listSlugs: string[];
  routines: Routine[];
  recipes: Recipe[];
  /** Affiliate disclosure — rendered wherever offers appear. */
  disclosure?: string;
  provenance?: Provenance;
  facets?: SemanticFacets;
  relatedSystemSlugs: string[];
}

// ------------------------------------------------------------------- lists

/** A retailer-specific way to obtain a product. NOT the product's identity. */
export interface RetailerOffer {
  retailer: string;
  url: string;
  state: Extract<AdapterState, "link-only">;
  /** Affiliate attribution belongs to the CREATOR. yurrmom.com takes 0%. */
  affiliate: boolean;
  note?: string;
}

/** The creator's preferred way to satisfy a need. Identity, not an offer. */
export interface ProductPreference {
  name: string;
  why: string;
  offers: RetailerOffer[];
}

export interface Substitution {
  name: string;
  note: string;
}

/** How central an item is to the system working at all. */
export type ItemImportance = "required" | "optional" | "situational";

/** The NEED comes first. Products are optional refinements underneath it. */
export interface ListItem {
  id: string;
  need: string;
  quantity: string;
  recurrence: string;
  importance?: ItemImportance;
  preferred?: ProductPreference;
  substitutions: Substitution[];
  notes?: string;
}

export interface PortableList {
  slug: string;
  systemSlug: string;
  title: string;
  intro: string;
  items: ListItem[];
}

// ------------------------------------------------------------------- roast

/** Roast subjects are fictional BY CONSTRUCTION — no real-person variant exists. */
export interface RoastFiction {
  kind: "synthetic-illustration" | "archetype";
  label: string;
}

export interface RoastEntry {
  id: string;
  author: string;
  body: string;
  votes: number;
  status: "approved";
}

export interface RoastBridge {
  label: string;
  href: string;
  blurb: string;
}

export interface RoastPrompt {
  slug: string;
  characterName: string;
  title: string;
  premise: string[];
  fiction: RoastFiction;
  entries: RoastEntry[];
  bridges: RoastBridge[];
}

// ------------------------------------------------------------------- merch

/**
 * yurrmom.com-owned merchandise. Deliberately has NO creator/affiliate fields —
 * this revenue path never mixes with creator economics (separation 3).
 */
export interface MerchItem {
  slug: string;
  title: string;
  price: string;
  blurb: string;
  kind: "tee" | "mug" | "cap" | "tote" | "stickers";
  variants?: string[];
  badge?: string;
}
