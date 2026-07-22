import type { Creator } from "@/domain/types";

/**
 * Seeded creators (docs/05 — seeded simulation tier). The data is genuine and
 * flows through real features; the people are authored demo personas.
 * Context-first, per docs/03: relevance over follower counts.
 */
export const creators: Creator[] = [
  {
    handle: "maya-runs-the-kitchen",
    displayName: "Maya Okafor",
    pronouns: "she/her",
    tagline: "Celiac kitchen commander. Zero cross-contact incidents since 2024.",
    bio: "Two kids, one celiac diagnosis, one week of crying in a grocery store parking lot — and then a system. I rebuilt our whole pantry so my daughter never has to wonder if her own kitchen is safe. Now I teach other families to do the same rebuild in a weekend instead of a year of trial and error.",
    specialties: [
      "Celiac & gluten-free households",
      "Cross-contact prevention",
      "Pantry zoning",
      "Label auditing",
      "Feeding picky eaters safely",
    ],
    context: {
      label: "Suburban household of four, one celiac kid",
      householdSize: "2 adults · 2 kids",
      ageRanges: ["7", "10"],
      diet: ["Gluten-free (celiac — medical, not a preference)", "Everything-else omnivore"],
      constraints: ["Strict cross-contact prevention", "One shared kitchen, no second fridge"],
      budgetOrientation: "Mid-budget, brand-flexible except where certification matters",
      schedule: "Two working parents, weeknight dinners in under 40 minutes",
      storesUsed: ["Kroger", "Target", "Costco"],
    },
    externalChannels: [
      { label: "Instagram", url: "https://www.instagram.com/" },
      { label: "Newsletter", url: "https://substack.com/" },
    ],
    systemSlugs: ["celiac-safe-pantry-reset"],
    accent: "sage",
  },
  {
    handle: "dee-does-laundry",
    displayName: "Dee Alvarez",
    pronouns: "she/her",
    tagline: "Six people. One load a day. Nobody folds on weekdays.",
    bio: "Four kids, two adults, one washer. Laundry used to be a weekend-eating monster that ended in a couch covered in 'clean-ish' piles. The fix wasn't working harder — it was making the machine's schedule everyone's schedule. Ten years of refinement, one page of rules, zero Mount Washmore.",
    specialties: [
      "Big-family laundry",
      "Kid-run chore systems",
      "Morning routines",
      "Shared-space sanity",
    ],
    context: {
      label: "Family of six, four school-age kids",
      householdSize: "2 adults · 4 kids",
      ageRanges: ["6", "9", "12", "14"],
      diet: ["No dietary constraints"],
      constraints: ["One washer/dryer", "Small laundry room", "Kids must be able to run it"],
      budgetOrientation: "Budget-first. If a dollar store version works, buy that.",
      schedule: "6:45 a.m. load is non-negotiable; everything else flexes",
      storesUsed: ["Walmart", "Dollar Tree", "Costco"],
    },
    externalChannels: [
      { label: "TikTok", url: "https://www.tiktok.com/" },
      { label: "Pinterest", url: "https://www.pinterest.com/" },
    ],
    systemSlugs: ["family-of-six-laundry-line"],
    accent: "tomato",
  },
  {
    handle: "sam-after-midnight",
    displayName: "Sam Reyes",
    pronouns: "they/them",
    tagline: "First-time parent. The 2 a.m. feed is now a 9-minute operation.",
    bio: "Nobody tells you the hard part of the night feed isn't the baby — it's doing inventory in the dark. After three weeks of stumbling into doors holding a screaming newborn, I built stations. Everything the 2 a.m. version of you needs, staged by the 9 p.m. version of you, who is smarter.",
    specialties: [
      "Newborn nights",
      "One-handed logistics",
      "Partner shift systems",
      "Staging & restocking routines",
    ],
    context: {
      label: "Two adults, one newborn, small apartment",
      householdSize: "2 adults · 1 baby (11 weeks)",
      ageRanges: ["0"],
      diet: ["Combo feeding (nursing + formula)"],
      constraints: ["Apartment — noise matters", "No nursery; baby in main bedroom"],
      budgetOrientation: "Spend on sleep, save on everything else",
      schedule: "Alternating night shifts; both parents back at work",
      storesUsed: ["Target", "Amazon", "Aldi"],
      caregiving: ["Newborn, around the clock"],
    },
    externalChannels: [{ label: "YouTube", url: "https://www.youtube.com/" }],
    systemSlugs: ["two-am-field-kit"],
    accent: "mustard",
  },
];

export function getCreator(handle: string): Creator | undefined {
  return creators.find((c) => c.handle === handle);
}
