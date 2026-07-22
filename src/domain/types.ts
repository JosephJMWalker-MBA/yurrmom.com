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
 *     YurrMom merchandise (MerchItem, no creator attribution field exists).
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
  ageRanges: string[];
  diet: string[];
  constraints: string[];
  budgetOrientation: string;
  schedule: string;
  storesUsed: string[];
  caregiving?: string[];
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

export interface StorySection {
  heading: string;
  body: string;
}

export interface RoutineStep {
  when: string;
  what: string;
}

export interface Routine {
  title: string;
  frequency: string;
  steps: RoutineStep[];
}

export interface Recipe {
  title: string;
  servings: string;
  time: string;
  ingredients: string[];
  steps: string[];
  note?: string;
}

export interface HouseholdSystem {
  slug: string;
  creatorHandle: string;
  title: string;
  /** The concise promise — one sentence a stressed person can trust. */
  promise: string;
  problem: string;
  situationTags: string[];
  lastUpdated: string; // ISO date
  version: number;
  story: StorySection[];
  listSlugs: string[];
  routines: Routine[];
  recipes: Recipe[];
  /** Affiliate disclosure — rendered wherever offers appear. */
  disclosure?: string;
  relatedSystemSlugs: string[];
}

// ------------------------------------------------------------------- lists

/** A retailer-specific way to obtain a product. NOT the product's identity. */
export interface RetailerOffer {
  retailer: string;
  url: string;
  state: Extract<AdapterState, "link-only">;
  /** Affiliate attribution belongs to the CREATOR. YurrMom takes 0%. */
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

/** The NEED comes first. Products are optional refinements underneath it. */
export interface ListItem {
  id: string;
  need: string;
  quantity: string;
  recurrence: string;
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
 * YurrMom-owned merchandise. Deliberately has NO creator/affiliate fields —
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
