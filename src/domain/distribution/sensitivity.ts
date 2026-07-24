/**
 * Deterministic content-sensitivity detection (Phase 8).
 *
 * Decides — from the canonical system's OWN content, never by inference or a
 * model — which cautions and disclosures an asset must carry. This is how the
 * Content Studio structurally prevents dropping a medical/developmental caution
 * or an affiliate disclosure.
 */
import type { HouseholdSystem, PortableList } from "../types";

const MEDICAL_MARKERS = /\b(celiac|coeliac|allerg|medical|doctor|gi team|gastroenterolog|diagnos|clinical|nutrition|fodmap|dietary)\b/i;
const DEVELOPMENTAL_MARKERS = /\b(developmental|age-appropriate|toddler|preschool|four-year|child develop|milestone|by age)\b/i;

export interface RequiredCautions {
  medical: boolean;
  developmental: boolean;
}

/** Text pooled from the system's declared, source-backed content. */
function systemText(system: HouseholdSystem): string {
  return [
    system.title,
    system.problem,
    system.promise,
    system.limitations ?? "",
    system.audience ?? "",
    system.situationTags.join(" "),
    system.facets?.domain ?? "",
    system.facets?.developmentalStage ?? "",
    (system.facets?.constraints ?? []).join(" "),
    (system.facets?.householdCircumstances ?? []).join(" "),
    system.provenance?.creatorNote ?? "",
  ].join(" ");
}

export function requiredCautions(system: HouseholdSystem): RequiredCautions {
  const text = systemText(system);
  return {
    medical: MEDICAL_MARKERS.test(text),
    developmental: DEVELOPMENTAL_MARKERS.test(text),
  };
}

/** Does the system (or the selected lists) reference any affiliate offer? */
export function hasAffiliateOffers(lists: PortableList[]): boolean {
  return lists.some((l) => l.items.some((i) => i.preferred?.offers.some((o) => o.affiliate)));
}

/** Exact affiliate offer URLs referenced — preserved verbatim, never rewritten. */
export function affiliateUrls(lists: PortableList[]): string[] {
  const out: string[] = [];
  for (const l of lists) for (const i of l.items) for (const o of i.preferred?.offers ?? []) {
    if (o.affiliate) out.push(o.url);
  }
  return out;
}

/**
 * Fictional roast content must NEVER mix into practical guidance. Roast copy is
 * clearly labeled in the data; any asset text hitting these markers is rejected.
 */
const ROAST_MARKERS = /\b(roast|deb laminated|100% fictional|synthetic character|chore chart shrine)\b/i;
export function looksLikeRoast(text: string): boolean {
  return ROAST_MARKERS.test(text);
}
