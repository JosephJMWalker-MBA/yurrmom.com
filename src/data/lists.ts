import type { PortableList } from "@/domain/types";

/**
 * Seeded portable lists. Structure per docs/02 + docs/07: the NEED is primary;
 * preferred products and retailer offers are refinements underneath it.
 * Retailer URLs are honest link-only handoffs (real, openable search links) —
 * no cart sync is claimed anywhere (docs/05 adapter tier).
 */
const target = (q: string) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`;
const kroger = (q: string) => `https://www.kroger.com/search?query=${encodeURIComponent(q)}`;
const walmart = (q: string) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`;

export const lists: PortableList[] = [
  {
    slug: "celiac-safe-pantry-staples",
    systemSlug: "celiac-safe-pantry-reset",
    title: "Celiac-Safe Pantry Staples",
    intro:
      "The recurring backbone of a shared kitchen that's safe by default. Needs first — brands are Maya's picks, substitutions are pre-approved, and the notes are where ten years of mistakes went to die.",
    items: [
      {
        id: "gf-flour",
        need: "Certified GF all-purpose flour",
        quantity: "2 bags (3 lb ea.)",
        recurrence: "Monthly",
        preferred: {
          name: "King Arthur Measure for Measure",
          why: "Swaps 1:1 into the recipes the kids already loved, so nobody has to mourn the old ziti.",
          offers: [
            { retailer: "Target", url: target("king arthur measure for measure gluten free flour"), state: "link-only", affiliate: true },
            { retailer: "Kroger", url: kroger("king arthur gluten free measure for measure flour"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Bob's Red Mill 1-to-1", note: "Great in bread, slightly gritty in cookies." },
          { name: "Krusteaz GF flour", note: "Fine for pancakes; don't build a roux on it." },
        ],
        notes: "Lives in the GREEN-lid bin, always. Flour dust travels — it's the #1 cross-contact vector in a shared kitchen.",
      },
      {
        id: "gf-pasta",
        need: "GF pasta the whole family will eat",
        quantity: "6 boxes",
        recurrence: "Monthly",
        preferred: {
          name: "Jovial brown-rice penne",
          why: "Survives being reheated in a lunchbox thermos. Cheaper brands turn into regret by noon.",
          offers: [
            { retailer: "Kroger", url: kroger("jovial gluten free penne"), state: "link-only", affiliate: true },
            { retailer: "Target", url: target("jovial brown rice pasta"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Barilla GF", note: "Solid and everywhere; a touch softer. Undercook by 2 minutes." },
          { name: "Chickpea pasta", note: "Protein bonus, but my 7-year-old has classified it as 'beans' and votes accordingly." },
        ],
        notes: "Dedicated GF colander only — the old shared colander is how we learned this rule.",
      },
      {
        id: "gf-oats",
        need: "Certified GF rolled oats",
        quantity: "1 large bag",
        recurrence: "Every 2 weeks",
        preferred: {
          name: "Bob's Red Mill Certified GF oats",
          why: "Certification is the entire point — ordinary oats are grown and processed alongside wheat.",
          offers: [
            { retailer: "Kroger", url: kroger("bobs red mill gluten free oats"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [],
        notes: "No substitutions on this one. 'Oats are naturally gluten-free' is technically true and practically dangerous — cross-contact happens in the field, not the recipe.",
      },
      {
        id: "tamari",
        need: "GF soy-sauce replacement",
        quantity: "1 bottle",
        recurrence: "Monthly",
        preferred: {
          name: "San-J Tamari (reduced sodium)",
          why: "Tastes like soy sauce because it basically is soy sauce, minus the wheat. Stir-fry night survives the diagnosis.",
          offers: [
            { retailer: "Target", url: target("san-j tamari gluten free"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Coconut aminos", note: "Sweeter and milder — cut any added sugar in the recipe." },
        ],
      },
      {
        id: "corn-tortillas",
        need: "Corn tortillas (taco night infrastructure)",
        quantity: "2 packs",
        recurrence: "Weekly",
        preferred: {
          name: "Mission yellow corn tortillas",
          why: "Reliable and everywhere — but production lines change, so the label check is weekly, not once-ever.",
          offers: [
            { retailer: "Walmart", url: walmart("mission yellow corn tortillas"), state: "link-only", affiliate: false },
            { retailer: "Kroger", url: kroger("mission corn tortillas"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Siete almond-flour tortillas", note: "Treat tier — lovely, and priced like it." },
        ],
        notes: "Read the bag every time. 'Corn' tortillas with wheat blended in are a real product that really exists to hurt you.",
      },
      {
        id: "second-toaster",
        need: "A dedicated GF toaster",
        quantity: "1 (one-time)",
        recurrence: "One-time buy",
        preferred: {
          name: "Any $15 two-slot toaster + red sharpie",
          why: "The cheapest appliance in the kitchen prevents the most common contamination in the kitchen. Label it in sharpie so guests don't 'help.'",
          offers: [
            { retailer: "Walmart", url: walmart("2 slice toaster"), state: "link-only", affiliate: false },
          ],
        },
        substitutions: [
          { name: "Toaster bags", note: "For travel and grandma's house. At home, the second toaster wins — bags rely on humans remembering bags." },
        ],
        notes: "The $15 toaster is the entire system in miniature: buy the guardrail instead of relying on vigilance.",
      },
      {
        id: "gf-stock",
        need: "GF soup/stock base",
        quantity: "1 jar",
        recurrence: "Monthly",
        preferred: {
          name: "Better Than Bouillon (GF-labeled jars)",
          why: "One jar replaces a shelf of cartons, and the GF-labeled line is clearly marked.",
          offers: [
            { retailer: "Target", url: target("better than bouillon gluten free"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Homemade freezer stock cubes", note: "Sunday-project tier. Wonderful when the freezer cooperates." },
        ],
      },
      {
        id: "backpack-snacks",
        need: "Certified GF backpack snacks",
        quantity: "2 boxes",
        recurrence: "Weekly",
        preferred: {
          name: "MadeGood bars + KIND minis, rotated",
          why: "Rotation matters more than brand. Safe-snack fatigue ends with a hungry kid trading food at school — the exact thing this list exists to prevent.",
          offers: [
            { retailer: "Target", url: target("madegood granola bars"), state: "link-only", affiliate: true },
            { retailer: "Kroger", url: kroger("kind minis gluten free"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Popcorn cups, fruit strips, cheese crisps", note: "All fine — the rule is certified + rotated, not one sacred bar." },
        ],
      },
      {
        id: "squeeze-condiments",
        need: "Squeeze-bottle versions of every shared condiment",
        quantity: "As they run out",
        recurrence: "Quarterly-ish",
        preferred: {
          name: "Squeeze mayo, butter spread, jam — any brand",
          why: "Cross-contact dies in the squeeze. No knife ever enters the jar, so the jar can't be contaminated. This one swap ended 80% of our kitchen policing.",
          offers: [
            { retailer: "Kroger", url: kroger("squeeze mayonnaise"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Two labeled jars (green/red)", note: "Works, but relies on humans. Squeeze bottles don't." },
        ],
      },
      {
        id: "label-kit",
        need: "Zone-labeling supplies",
        quantity: "1 roll tape + 2 sharpies",
        recurrence: "Check monthly",
        preferred: {
          name: "Green + red electrical tape, green/red sharpies",
          why: "The pantry's whole operating system costs six dollars. Green = safe zone, red = gluten. A seven-year-old can read it at a glance — which is the test that matters.",
          offers: [
            { retailer: "Walmart", url: walmart("colored electrical tape"), state: "link-only", affiliate: false },
          ],
        },
        substitutions: [
          { name: "Label maker", note: "Prettier, slower, and it will be out of tape at the exact moment you need it." },
        ],
      },
    ],
  },
  {
    slug: "laundry-line-starter-kit",
    systemSlug: "family-of-six-laundry-line",
    title: "Laundry Line Starter Kit",
    intro:
      "Everything the one-load-a-day line needs to run. Mostly one-time buys, mostly cheap — the system is the expensive part and it's free.",
    items: [
      {
        id: "mesh-bags",
        need: "One large color-coded mesh laundry bag per person",
        quantity: "6 (one color each)",
        recurrence: "One-time; replace as they die",
        preferred: {
          name: "Any heavy-zipper mesh bags in 6 distinct colors",
          why: "The color IS the system. The bag is the sort, the wash container, and the ownership label all at once.",
          offers: [
            { retailer: "Walmart", url: walmart("mesh laundry bags large zipper"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Plain bags + colored ribbons", note: "Dollar-store version. Works fine, ribbons last a year." },
        ],
        notes: "Zipper quality is the only spec that matters. A burst bag mid-cycle un-sorts a week of discipline.",
      },
      {
        id: "rolling-cart",
        need: "A 3-bin rolling cart that fits the laundry room",
        quantity: "1",
        recurrence: "One-time",
        preferred: {
          name: "Any 3-bin rolling sorter, metal frame",
          why: "Bins are per-person landing zones out of the dryer. Rolling matters — Sunday folding happens wherever the TV is.",
          offers: [
            { retailer: "Walmart", url: walmart("3 bag laundry sorter cart"), state: "link-only", affiliate: true },
            { retailer: "Target", url: target("laundry sorter 3 section"), state: "link-only", affiliate: false },
          ],
        },
        substitutions: [
          { name: "Three labeled baskets on a shelf", note: "Fine if the laundry room can't fit a cart. You lose the rolling-to-the-TV move." },
        ],
      },
      {
        id: "dryer-balls",
        need: "Wool dryer balls",
        quantity: "1 pack of 6",
        recurrence: "Yearly",
        preferred: {
          name: "Plain wool dryer balls",
          why: "Cuts dry time on the daily load — the line's schedule depends on the dryer finishing before pickup time.",
          offers: [
            { retailer: "Walmart", url: walmart("wool dryer balls"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Tennis balls", note: "Louder. Free if you already own a dog who's lost interest." },
        ],
      },
      {
        id: "sock-bags",
        need: "Small zippered sock bag per kid",
        quantity: "4",
        recurrence: "One-time",
        preferred: {
          name: "Small mesh delicates bags, matched to each kid's color",
          why: "Socks go in the bag, the bag goes in the wash, socks come back as a set. The Sock Singularity — the drawer of 40 orphans — simply stops happening.",
          offers: [
            { retailer: "Target", url: target("small mesh delicates bags"), state: "link-only", affiliate: false },
          ],
        },
        substitutions: [
          { name: "Safety-pinning pairs", note: "Grandma's method. Works; requires a human to pin, and humans are the weak point." },
        ],
      },
      {
        id: "stain-stick",
        need: "Stain treatment within arm's reach of where clothes come off",
        quantity: "3 sticks",
        recurrence: "Every 3 months",
        preferred: {
          name: "Any stain stick — one per bathroom + one at the hamper",
          why: "Stains get treated at undress o'clock or never. Nobody walks a shirt to the laundry room to treat it. Put the tool where the problem happens.",
          offers: [
            { retailer: "Walmart", url: walmart("stain remover stick"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Dish-soap bottle at the hamper", note: "Budget version, honestly nearly as good." },
        ],
      },
      {
        id: "fridge-list",
        need: "The Mover List (who moves wash → dryer, by day)",
        quantity: "1 laminated page",
        recurrence: "Reprint when the roster changes",
        preferred: {
          name: "One page, giant font, on the fridge",
          why: "The only 'chart' this system allows — it names exactly one person per day for exactly one 90-second job. It survives because it asks almost nothing.",
          offers: [],
        },
        substitutions: [
          { name: "Phone reminders", note: "Failed in our house. The fridge doesn't have a Do Not Disturb mode." },
        ],
        notes: "Yes, it's laminated. Deb was right about exactly one thing.",
      },
    ],
  },
  {
    slug: "two-am-station-kit",
    systemSlug: "two-am-field-kit",
    title: "The 2 A.M. Station Kit",
    intro:
      "Stock three stations once, restock in six minutes a night. Every item earns its place by removing a 2 a.m. decision.",
    items: [
      {
        id: "caddies",
        need: "Three identical carry caddies (bedside, kitchen, changing zone)",
        quantity: "3",
        recurrence: "One-time",
        preferred: {
          name: "Any cheap shower caddy",
          why: "Identical matters: your half-asleep hands learn ONE layout that's true at every station.",
          offers: [
            { retailer: "Target", url: target("plastic shower caddy"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Shoebox-size bins", note: "Fine. You lose the handle, and at 2 a.m. the handle is doing real work." },
        ],
      },
      {
        id: "formula-pods",
        need: "Pre-measured formula dispenser pods",
        quantity: "2 dispensers",
        recurrence: "One-time (refilled nightly)",
        preferred: {
          name: "Stackable formula dispenser pods",
          why: "Measuring is a daytime activity. At night you pour, you don't scoop — scooping is how formula ends up on the ceiling.",
          offers: [
            { retailer: "Target", url: target("formula dispenser pods"), state: "link-only", affiliate: true },
            { retailer: "Walmart", url: walmart("baby formula dispenser"), state: "link-only", affiliate: false },
          ],
        },
        substitutions: [
          { name: "Pre-filled bottles in a cooler sleeve", note: "If your pediatrician's prep guidance allows it — ask them, not the internet." },
        ],
      },
      {
        id: "red-light",
        need: "Red-spectrum nightlight per station",
        quantity: "3",
        recurrence: "One-time",
        preferred: {
          name: "Any plug-in red nightlight",
          why: "White light tells everyone's brain it's morning. Red light lets you see the diaper situation without booking a 90-minute resettle.",
          offers: [
            { retailer: "Walmart", url: walmart("red night light plug in"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Phone flashlight with red filter", note: "Works until you drop the phone in the crib. Ask me how I know." },
        ],
      },
      {
        id: "burp-cloths",
        need: "Burp cloths staged at every station",
        quantity: "12 total (4 per station)",
        recurrence: "One-time; they outlive us all",
        preferred: {
          name: "Plain cloth diapers as burp cloths",
          why: "The unglamorous ones are the absorbent ones. The cute muslin ones are decorative and everyone knows it.",
          offers: [
            { retailer: "Target", url: target("cloth diapers burp cloths"), state: "link-only", affiliate: true },
          ],
        },
        substitutions: [
          { name: "Cut-up old towels", note: "Free and honestly superior." },
        ],
      },
      {
        id: "adult-provisions",
        need: "Water + one-handed snack for the ADULT",
        quantity: "1 bottle + 1 snack per station",
        recurrence: "Restocked nightly",
        preferred: {
          name: "Big water bottle with a straw lid + granola bar",
          why: "You are also a mammal with needs. The straw lid means hydration without tilting your head away from the baby. v2 exists because of the raccoon-cereal incident.",
          offers: [
            { retailer: "Walmart", url: walmart("water bottle straw lid 32 oz"), state: "link-only", affiliate: false },
          ],
        },
        substitutions: [],
      },
      {
        id: "handoff-card",
        need: "Partner handoff card (last fed / which side / diaper?)",
        quantity: "1 sticky-note pad + pen, tied to the caddy",
        recurrence: "One-time",
        preferred: {
          name: "Sticky notes. Literally sticky notes.",
          why: "The 4 a.m. shift change had the information integrity of a game of telephone. Three fields on a sticky note fixed it. Not everything needs an app — almost nothing needs an app.",
          offers: [],
        },
        substitutions: [
          { name: "A shared tracking app", note: "If you're both app people, fine. We weren't, at 4 a.m., ever." },
        ],
      },
    ],
  },
];

export function getList(slug: string): PortableList | undefined {
  return lists.find((l) => l.slug === slug);
}
