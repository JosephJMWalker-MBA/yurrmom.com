import type { RoastPrompt } from "@/domain/types";

/**
 * The current roast (docs/05 seeded simulation). The subject is fictional BY
 * CONSTRUCTION (docs/07 provenance boundary 4): a synthetic illustrated
 * archetype, clearly labeled. Entries are seeded and pre-moderated. Ranking
 * rewards wit, not cruelty (docs/02 moderation boundaries).
 */
export const currentRoast: RoastPrompt = {
  slug: "deb-laminated-chore-chart",
  characterName: "Deb",
  title: "Deb Laminated the Chore Chart Again",
  premise: [
    "Meet Deb. In 2019, Deb made a color-coded chore chart for her family. It has never once been followed.",
    "Deb updates it weekly anyway. It is now on version 47. Version 47 has a legend. The dog has a column.",
    "She laminated it — so the tears wipe right off.",
    "Roast the chart. (Gently. We've all been Deb.)",
  ],
  fiction: {
    kind: "synthetic-illustration",
    label:
      "Deb is 100% fictional — an illustrated household archetype, not a real person. Any resemblance to your actual aunt is a coincidence and, frankly, her fault.",
  },
  entries: [
    {
      id: "e1",
      author: "grislebeth",
      body: "The chart has survived three family meetings that were called specifically to discuss the chart.",
      votes: 214,
      status: "approved",
    },
    {
      id: "e2",
      author: "washmore_survivor",
      body: "Version 47 has a QR code. It links to a Google Form. The Form asks why you didn’t follow the chart.",
      votes: 187,
      status: "approved",
    },
    {
      id: "e3",
      author: "dadwithaclipboard",
      body: "In this house the chart is not a system. It is a shrine.",
      votes: 156,
      status: "approved",
    },
    {
      id: "e4",
      author: "no.thoughts.just.bins",
      body: "Deb assigns chores by color, but every family member is a color that only Deb can see.",
      votes: 141,
      status: "approved",
    },
    {
      id: "e5",
      author: "auntie_provisions",
      body: "The laminator was a gift from the family. Fastest way to make sure the chart never touches paper they’d have to recycle their guilt onto.",
      votes: 98,
      status: "approved",
    },
    {
      id: "e6",
      author: "sockbag_believer",
      body: "The dog’s column has more checkmarks than anyone else’s. The dog cannot hold a pen. Think about what that means.",
      votes: 92,
      status: "approved",
    },
  ],
  bridges: [
    {
      label: "Steal the system Deb actually needs",
      href: "/systems/family-of-six-laundry-line",
      blurb:
        "Dee runs six humans’ laundry on one load a day and exactly one page of rules. No lamination required. (Okay — one lamination.)",
    },
    {
      label: "Meet the creators whose systems get followed",
      href: "/creators",
      blurb: "Real household context, proven methods, zero shrine-charts.",
    },
    {
      label: "Put Deb on a mug",
      href: "/shop",
      blurb: "Original yurrmom.com merch. It funds the platform so creators keep 100% of their affiliate earnings.",
    },
  ],
};
