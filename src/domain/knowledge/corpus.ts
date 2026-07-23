/**
 * Corpus assembly (Phase 4). Pure: given canonical arrays, projects every
 * system into KnowledgeUnits and returns them in a deterministic order. The
 * data layer (src/data/knowledge-corpus.ts) calls this with the seeded data;
 * tests call it with the same arrays (or frozen copies) directly.
 */
import type { Creator, HouseholdSystem, PortableList } from "../types";
import { projectSystem, type KnowledgeUnit } from "./unit";

export function buildCorpus(
  systems: readonly HouseholdSystem[],
  lists: readonly PortableList[],
  creators: readonly Creator[],
): KnowledgeUnit[] {
  const creatorByHandle = new Map(creators.map((c) => [c.handle, c]));
  const units: KnowledgeUnit[] = [];
  for (const system of systems) {
    const systemLists = lists.filter((l) => l.systemSlug === system.slug);
    units.push(
      ...projectSystem(system, systemLists, creatorByHandle.get(system.creatorHandle)),
    );
  }
  // Stable global order by id — retrieval re-sorts by score, but a stable
  // base order keeps any un-scored enumeration reproducible too.
  return units.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
