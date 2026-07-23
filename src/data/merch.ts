import type { MerchItem } from "@/domain/types";

/**
 * Original yurrmom.com merchandise — the platform's OWN revenue engine (docs/00 §9).
 * Deliberately separate from creator affiliate economics: no creator attribution
 * exists on these items, structurally (docs/07 separation 3).
 * Fulfillment is a Printful adapter in `planned` state — the shop is presented
 * honestly as a preview (docs/05).
 */
export const merch: MerchItem[] = [
  {
    slug: "yurr-mom-tee",
    title: "YURR MOM. — The Tee",
    price: "$28",
    blurb: "The comeback that became a platform. Heavyweight cotton, prints don't crack, opinions included.",
    kind: "tee",
    variants: ["S", "M", "L", "XL", "2XL"],
    badge: "Flagship",
  },
  {
    slug: "other-peoples-mistakes-mug",
    title: "“Powered by Other People’s Mistakes” Mug",
    price: "$16",
    blurb: "Every system on this site exists because something went wrong first. Raise a mug to the version that failed.",
    kind: "mug",
    variants: ["11 oz", "15 oz"],
  },
  {
    slug: "proven-system-cap",
    title: "PROVEN SYSTEM Cap",
    price: "$24",
    blurb: "Wear the confidence of someone whose laundry method has a version number.",
    kind: "cap",
    variants: ["One size"],
  },
  {
    slug: "system-tote",
    title: "“This Tote Contains a System” Tote",
    price: "$18",
    blurb: "Technically it contains groceries. But the groceries are from a list, and the list is from a system, so.",
    kind: "tote",
    variants: ["Natural canvas"],
  },
  {
    slug: "archetypes-stickers",
    title: "Household Archetypes Sticker Pack, Vol. 1",
    price: "$8",
    blurb: "Featuring Deb (and her chart), the Sock Singularity, Mount Washmore, and the Sacred Second Toaster.",
    kind: "stickers",
    variants: ["5-pack"],
    badge: "Roast tie-in",
  },
];

export function getMerch(slug: string): MerchItem | undefined {
  return merch.find((m) => m.slug === slug);
}
