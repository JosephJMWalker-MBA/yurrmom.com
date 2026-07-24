/**
 * Platform taxonomy administration (Phase 9).
 *
 * Taxonomy administration NEVER rewrites canonical system content. Deprecating
 * a term may suggest a replacement but must not mutate existing records. Usage
 * count is DERIVED from canonical systems, never manually entered. Duplicate
 * canonical keys and replacement loops are rejected.
 */
import type { HouseholdSystem } from "../types";
import { facetsOf } from "../facets";
import type { TaxonomyTerm } from "./types";

export interface TaxonomyValidation {
  valid: boolean;
  issues: string[];
}

/** Validate the whole term set: unique keys and no replacement loops. */
export function validateTaxonomy(terms: TaxonomyTerm[]): TaxonomyValidation {
  const issues: string[] = [];

  const seen = new Set<string>();
  for (const t of terms) {
    if (seen.has(t.key)) issues.push(`Duplicate canonical key "${t.key}".`);
    seen.add(t.key);
  }

  const byId = new Map(terms.map((t) => [t.id, t]));
  for (const t of terms) {
    if (!t.replacementTermId) continue;
    // Walk the replacement chain; a cycle (or self-reference) is invalid.
    const visited = new Set<string>([t.id]);
    let cursor: TaxonomyTerm | undefined = byId.get(t.replacementTermId);
    while (cursor) {
      if (visited.has(cursor.id)) {
        issues.push(`Replacement loop detected at term "${t.key}".`);
        break;
      }
      visited.add(cursor.id);
      cursor = cursor.replacementTermId ? byId.get(cursor.replacementTermId) : undefined;
    }
  }

  return { valid: issues.length === 0, issues };
}

/** Would adding/replacing `candidate` keep the taxonomy valid? */
export function taxonomyChangeIsValid(terms: TaxonomyTerm[], candidate: TaxonomyTerm): TaxonomyValidation {
  const next = terms.some((t) => t.id === candidate.id)
    ? terms.map((t) => (t.id === candidate.id ? candidate : t))
    : [...terms, candidate];
  return validateTaxonomy(next);
}

/**
 * Derived usage: how many canonical systems reference this term's value under
 * its facet family. Read-only over systems — never writes back.
 */
export function deriveTaxonomyUsage(term: TaxonomyTerm, systems: HouseholdSystem[]): number {
  let count = 0;
  for (const s of systems) {
    const facets = facetsOf(s);
    const hit = facets.some(
      (f) =>
        f.key === term.facetKey &&
        (f.value === term.canonicalLabel || term.aliases.includes(f.value)),
    );
    if (hit) count += 1;
  }
  return count;
}
