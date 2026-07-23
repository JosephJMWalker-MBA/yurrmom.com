/**
 * App-facing knowledge corpus (Phase 4). Binds the pure `buildCorpus` to the
 * seeded data. This is the one place the retrieval layer touches the data
 * layer; the Studio Evidence Explorer imports from here.
 *
 * Read-only: building the corpus never mutates the seeded systems/lists.
 */
import { buildCorpus } from "@/domain/knowledge";
import { creators } from "./creators";
import { lists } from "./lists";
import { systems } from "./systems";
import { translationRecords } from "./translations";

export const knowledgeCorpus = buildCorpus(systems, lists, creators);
export const knowledgeTranslations = translationRecords;
