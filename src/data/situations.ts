import { systems } from "./systems";
import type { HouseholdSystem } from "@/domain/types";

/**
 * Situation taxonomy powering Find Help (docs/06). Only situations we can
 * actually serve get a link; nothing points at an empty result.
 */
export interface Situation {
  slug: string;
  label: string;
  hook: string;
  tag: string; // matches HouseholdSystem.situationTags
}

export const situations: Situation[] = [
  {
    slug: "first-baby",
    label: "First baby",
    hook: "Nobody knows what they're doing. Some people wrote down what worked.",
    tag: "first-baby",
  },
  {
    slug: "gluten-free-household",
    label: "Gluten-free household",
    hook: "Celiac-safe by default, not by vigilance.",
    tag: "gluten-free-household",
  },
  {
    slug: "big-family",
    label: "Big family logistics",
    hook: "Four kids, one washer, zero lost weekends.",
    tag: "big-family",
  },
  {
    slug: "caregiving",
    label: "Caregiving",
    hook: "Around-the-clock care needs staged supplies, not heroics.",
    tag: "caregiving",
  },
  {
    slug: "shared-kitchen",
    label: "One shared kitchen",
    hook: "Different diets, one fridge, no separate everything.",
    tag: "shared-kitchen",
  },
  {
    slug: "chores",
    label: "Chores kids actually do",
    hook: "Charts fail. Systems with one job per person survive.",
    tag: "chores",
  },
];

export function systemsForSituation(tag: string): HouseholdSystem[] {
  return systems.filter((s) => s.situationTags.includes(tag));
}
