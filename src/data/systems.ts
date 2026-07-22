import type { HouseholdSystem } from "@/domain/types";

/**
 * Seeded household systems — the primary knowledge objects (docs/07).
 * Three systems across distinct situations, per docs/05 seed requirements.
 */
export const systems: HouseholdSystem[] = [
  {
    slug: "celiac-safe-pantry-reset",
    creatorHandle: "maya-runs-the-kitchen",
    title: "The Celiac-Safe Pantry Reset",
    promise:
      "Rebuild one shared kitchen so the gluten-free person in it is safe by default — in a weekend, without a second fridge.",
    problem:
      "After a celiac diagnosis, most families try to be careful everywhere, all the time. Vigilance doesn't scale — systems do. This reset moves safety out of everyone's memory and into the kitchen's layout.",
    situationTags: ["gluten-free-household", "dietary-constraint", "shared-kitchen"],
    lastUpdated: "2026-06-14",
    version: 4,
    story: [
      {
        heading: "What happened",
        body: "My daughter was diagnosed with celiac disease at seven. The GI doc handed us a pamphlet and said 'no gluten, and watch cross-contact.' That second clause is the whole war. Flour dust floats. Toasters lie. A shared butter tub is a crime scene.",
      },
      {
        heading: "What failed first",
        body: "Version one was 'we'll all just be careful.' We were careful for eleven days, and then someone made regular pasta and used the colander. Version two was 'separate everything' — two of every utensil, chaos, and a grocery bill that made me sit down. Neither survived contact with a real Tuesday.",
      },
      {
        heading: "What actually works",
        body: "Zones, colors, and squeeze bottles. Green-lid bins are safe, red tape means gluten, the cheap second toaster is sacred, and any condiment that can be a squeeze bottle becomes one — cross-contact dies in the squeeze. The kitchen enforces the rules so the humans don't have to. My ten-year-old can safely make her own toast, which was the whole point.",
      },
      {
        heading: "What changed with experience",
        body: "v2 added the Sunday label check after a granola brand quietly changed facilities. v3 demoted almond-flour everything (expensive, nobody ate it). v4 added the backpack-snack rotation because safe snack fatigue is real and it ends with a hungry kid trading food at school — the exact thing you're trying to prevent.",
      },
    ],
    listSlugs: ["celiac-safe-pantry-staples"],
    routines: [
      {
        title: "The Sunday Label Check",
        frequency: "Weekly · 10 minutes",
        steps: [
          { when: "Sunday, while coffee brews", what: "Pull anything new that entered the pantry this week into one spot on the counter." },
          { when: "Per item", what: "Check for certified GF mark or read the allergen statement. Facilities change without warning — last week's safe brand is a rumor, not a fact." },
          { when: "Pass", what: "Green-lid bin or green tape dot, then shelve in the safe zone." },
          { when: "Fail or unsure", what: "Red tape, gluten shelf, and it never touches the green zone. Unsure counts as fail." },
          { when: "Last", what: "Restock the backpack snack bin from the safe zone only." },
        ],
      },
    ],
    recipes: [
      {
        title: "The Tuesday Ziti (GF, nobody notices)",
        servings: "Family of 4 + lunchbox leftovers",
        time: "40 min, one pot + one pan",
        ingredients: [
          "1 lb GF penne (brown-rice based — holds a reheat)",
          "1 jar marinara (label-checked)",
          "1 lb ground turkey or beef",
          "8 oz mozzarella",
          "GF flour blend, 2 tbsp (for the cheating-fast roux)",
          "Whole milk, 1 cup",
        ],
        steps: [
          "Boil the GF penne one minute short of the bag time. It finishes in the oven — mushy GF pasta is how you lose the family vote.",
          "Brown the meat; stir in marinara.",
          "Quick roux: butter, GF flour blend, milk. Whisk 3 minutes.",
          "Layer pasta, sauce, roux, mozzarella in the pan. 400°F for 15 minutes.",
          "Serve. Decline to mention it's gluten-free. Collect compliments.",
        ],
        note: "This is the recipe that ended the 'GF food is sad' era in our house.",
      },
    ],
    disclosure:
      "Some retailer links on this system are Maya's affiliate links. If you buy through them, Maya may earn a commission. YurrMom takes 0% of it — creator earnings are the creator's.",
    relatedSystemSlugs: ["family-of-six-laundry-line", "two-am-field-kit"],
  },
  {
    slug: "family-of-six-laundry-line",
    creatorHandle: "dee-does-laundry",
    title: "The Family-of-Six Laundry Line",
    promise:
      "One load a day, run like a bus schedule, and no weekday folding — laundry for six without losing a single weekend.",
    problem:
      "Big-family laundry fails as a batch job. Saving it up creates a mountain no one can face, so the mountain moves to the couch and lives there. The fix is a small, boring, daily line — and making the machine's schedule the family's schedule.",
    situationTags: ["big-family", "chores", "kid-run-systems"],
    lastUpdated: "2026-05-02",
    version: 7,
    story: [
      {
        heading: "What happened",
        body: "Four kids in five years. By 2019, laundry was a two-day weekend event with a boss fight at the end: Mount Washmore, the couch pile so permanent it had a name and, briefly, a Christmas decoration on it.",
      },
      {
        heading: "What failed first",
        body: "Chore charts. Rotations. An app. A family meeting with slides. Every version relied on people remembering things, and people — especially people under twelve — do not remember things. The chart becomes wall art. (If you've seen our roast section, yes, I have met Deb. I have BEEN Deb.)",
      },
      {
        heading: "What actually works",
        body: "Each person owns a color-coded mesh bag. Bags ride in a three-bin rolling cart. Every morning at 6:45 the day's bag goes in — Monday is the 6-year-old, Tuesday the 9-year-old, and so on. Clothes come out of the dryer into that person's bin. Nobody folds until Sunday, when everyone folds their own bin for 20 minutes while we watch something. The washer never runs a mystery load. Socks live in per-kid zippered bags and never meet another child's socks.",
      },
      {
        heading: "What changed with experience",
        body: "v5 moved the load from 8 p.m. to 6:45 a.m. — evening-Dee kept negotiating with the schedule and morning-Dee doesn't negotiate. v6 added the 'inside-out rule': it washes how you tossed it, and it comes back that way. Consequences fold better than lectures. v7 let the 14-year-old opt out into doing their own full cycle weekly. Promotion, not exemption.",
      },
    ],
    listSlugs: ["laundry-line-starter-kit"],
    routines: [
      {
        title: "The Daily Line",
        frequency: "Daily · 12 minutes total, split across the day",
        steps: [
          { when: "6:45 a.m.", what: "Today's bag into the washer. Start it before coffee. This slot is non-negotiable — everything else in the system flexes, this doesn't." },
          { when: "After school", what: "Whoever gets home first moves it to the dryer. The mover is on the fridge list; no reminders issued, the list is the reminder." },
          { when: "After dinner", what: "Dryer empties into the owner's bin on the cart. Not folded. Folding on a weekday is against the rules — the rule exists to protect you from starting a pile you won't finish." },
          { when: "Sunday, 5 p.m.", what: "Twenty minutes, everyone folds their own bin, something good on the TV. Six-year-olds fold badly. Badly folded clothes that live in the right drawer are a win. Do not re-fold a child's work." },
        ],
      },
    ],
    recipes: [],
    disclosure:
      "Retailer links in this system's kit list are Dee's own links; some are affiliate. If you buy through them, Dee may earn a commission. YurrMom takes 0%.",
    relatedSystemSlugs: ["celiac-safe-pantry-reset", "two-am-field-kit"],
  },
  {
    slug: "two-am-field-kit",
    creatorHandle: "sam-after-midnight",
    title: "The 2 A.M. Field Kit",
    promise:
      "Turn the night feed from a scavenger hunt into a 9-minute operation — staged by the 9 p.m. version of you, who is smarter.",
    problem:
      "Night feeds aren't hard because of the baby. They're hard because you're doing inventory management in the dark with one hand at 2 a.m. The fix is to move every decision to 9 p.m., when a functioning adult is available.",
    situationTags: ["first-baby", "newborn", "caregiving"],
    lastUpdated: "2026-07-01",
    version: 3,
    story: [
      {
        heading: "What happened",
        body: "Week two of parenthood, 2:40 a.m., I was holding a screaming baby in one arm while trying to open a formula tub with my teeth because the scoop had migrated to a different room. My partner found me asleep sitting up with a burp cloth on my head. Something had to change and it wasn't going to be the baby.",
      },
      {
        heading: "What failed first",
        body: "'We'll keep everything in the nursery' — we don't have a nursery. Then 'we'll restock when it runs out,' which means discovering it ran out at 2 a.m., which is the exact failure the system exists to prevent.",
      },
      {
        heading: "What actually works",
        body: "Three stations — bedside, kitchen, changing zone — each a cheap caddy stocked for the whole night: diapers counted out, pre-measured formula pods, two burp cloths, water bottle for the adult, snack for the adult (you matter too), red nightlight so nobody fully wakes up. The 9 p.m. reset restocks all three in six minutes. The 2 a.m. human never opens a cabinet, never turns on a white light, never makes a decision.",
      },
      {
        heading: "What changed with experience",
        body: "v2 added the adult snack after I ate a fistful of dry cereal over the sink at 3 a.m. like a raccoon. v3 added the partner-handoff card — a sticky note on the caddy with 'last fed / which side / diaper?' because 4 a.m. shift changes had the information integrity of a game of telephone.",
      },
    ],
    listSlugs: ["two-am-station-kit"],
    routines: [
      {
        title: "The 9 P.M. Reset",
        frequency: "Nightly · 6 minutes",
        steps: [
          { when: "9:00", what: "Bedside caddy: 4 diapers, wipes topped up, 2 burp cloths, water bottle filled, adult snack in." },
          { when: "9:02", what: "Kitchen station: formula pods pre-measured, clean bottles lined up, kettle filled." },
          { when: "9:04", what: "Changing zone: one full sleeper + one backup laid out. Blowouts happen at 2 a.m. exclusively; the backup is not optional." },
          { when: "9:06", what: "Handoff card updated. Red lights on, white lights off. Go to bed — the system is on duty now." },
        ],
      },
    ],
    recipes: [],
    disclosure:
      "Some links in this kit are Sam's affiliate links. Purchases through them may earn Sam a commission. YurrMom takes 0%.",
    relatedSystemSlugs: ["celiac-safe-pantry-reset", "family-of-six-laundry-line"],
  },
];

export function getSystem(slug: string): HouseholdSystem | undefined {
  return systems.find((s) => s.slug === slug);
}
