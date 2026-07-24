/**
 * Seeded distribution assets (Phase 8 demonstration).
 *
 * Built deterministically from the CANONICAL seeded systems via the domain
 * layer — no hand-written asset JSON that could drift from the templates, and
 * no model output. Every seed is a derivative that traces to a real system at a
 * real version.
 *
 * Three honest demos:
 *  1. Laundry short-form video — problem + method + kit items, affiliate
 *     disclosure (the kit has affiliate links), from the current system.
 *  2. Celiac Pinterest pin — built from the ENGLISH ORIGINAL, not the Spanish
 *     machine draft. Per docs/13 §8 a machine draft can never be a publication
 *     source; translation readiness is shown by inspectability, not by shipping
 *     the draft. Carries the required medical caution + affiliate disclosure.
 *  3. A STALE laundry social post — built from an older system version so the
 *     Studio can demonstrate source-version staleness live.
 */
import type { HouseholdSystem, PortableList } from "@/domain/types";
import {
  createDistributionAsset,
  markStale,
  validateDistributionAsset,
  type DistributionAsset,
} from "@/domain/distribution";
import { systems } from "./systems";
import { lists as allLists } from "./lists";

function system(slug: string): HouseholdSystem {
  const s = systems.find((x) => x.slug === slug);
  if (!s) throw new Error(`seed: missing system ${slug}`);
  return s;
}
function listsFor(s: HouseholdSystem): PortableList[] {
  return allLists.filter((l) => s.listSlugs.includes(l.slug));
}
function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

const SEED_NOW = "2026-07-10T12:00:00.000Z";

function build(): DistributionAsset[] {
  const out: DistributionAsset[] = [];

  // 1. Laundry short-form video (current, affiliate) --------------------------
  const laundry = system("family-of-six-laundry-line");
  const laundryLists = listsFor(laundry);
  const video = createDistributionAsset({
    system: laundry,
    lists: laundryLists,
    templateId: "video-problem-method",
    creatorHandle: laundry.creatorHandle,
    selection: {
      promise: true,
      problem: true,
      routineIndices: [0],
      listItemIds: ["laundry-line-starter-kit#mesh-bags", "laundry-line-starter-kit#rolling-cart"],
    },
    internalName: "Laundry line — TikTok cut",
    now: SEED_NOW,
  });
  if (video.ok) out.push({ ...video.asset, origin: "production-seed" });

  // 2. Celiac Pinterest pin (ENGLISH ORIGINAL, medical + affiliate) -----------
  const celiac = system("celiac-safe-pantry-reset");
  const pin = createDistributionAsset({
    system: celiac,
    lists: listsFor(celiac),
    templateId: "pin-practical-system",
    creatorHandle: celiac.creatorHandle,
    selection: {
      promise: true,
      problem: true,
      limitations: true,
      routineIndices: [0],
      listItemIds: [
        "celiac-safe-pantry-staples#second-toaster",
        "celiac-safe-pantry-staples#squeeze-condiments",
      ],
    },
    internalName: "Celiac pantry reset — Pinterest (EN original)",
    now: SEED_NOW,
    // Deliberately NOT localized: the only Spanish translation is a machine
    // draft and cannot be a publication source.
  });
  if (pin.ok) out.push({ ...pin.asset, origin: "production-seed" });

  // 3. STALE laundry social post (built from an older version) ----------------
  // Simulate an asset created when the laundry system was at v(current-1).
  const olderLaundry = deepCopy(laundry);
  olderLaundry.version = Math.max(1, laundry.version - 1);
  const social = createDistributionAsset({
    system: olderLaundry,
    lists: laundryLists,
    templateId: "social-context-method",
    creatorHandle: laundry.creatorHandle,
    selection: { problem: true, routineIndices: [0] },
    internalName: "Laundry line — IG post (needs review)",
    now: SEED_NOW,
  });
  if (social.ok) {
    // Now the canonical system has moved on to the current version → stale.
    let stale = markStale(social.asset, laundry, SEED_NOW);
    stale = { ...stale, origin: "production-seed" };
    stale.validation = validateDistributionAsset(stale, laundry);
    out.push(stale);
  }

  return out;
}

export const seededDistributionAssets: DistributionAsset[] = build();
