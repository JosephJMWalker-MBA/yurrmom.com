/**
 * App-facing knowledge corpus (Phase 4). Binds the pure `buildCorpus` to the
 * seeded data. This is the one place the retrieval layer touches the data
 * layer; the Studio Evidence Explorer imports from here.
 *
 * Read-only: building the corpus never mutates the seeded systems/lists.
 */
import { buildCorpus } from "@/domain/knowledge";
import { projectRegistryClaims } from "@/domain/reference";
import { creators } from "./creators";
import { lists } from "./lists";
import { systems } from "./systems";
import { translationRecords } from "./translations";
import { productionReferenceRegistry } from "./reference-registry";

/**
 * Production reference units come ONLY from the production registry, which
 * contains no fabricated authoritative sources (see reference-registry.ts).
 * The platform-internal claim is `unassessed`, so it can never satisfy a
 * high-stakes authoritative-support requirement.
 */
const productionReferenceUnits = projectRegistryClaims(productionReferenceRegistry);

export const knowledgeCorpus = buildCorpus(
  systems,
  lists,
  creators,
  productionReferenceUnits,
);
export const knowledgeTranslations = translationRecords;
