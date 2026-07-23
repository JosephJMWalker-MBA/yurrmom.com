/**
 * Facet flattening (Phase 3) — turns a system's human-authored structure
 * into the uniform typed facets future search and assistant retrieval will
 * consume. Read-only derivation: nothing here writes back to the system.
 */
import type { Facet, HouseholdSystem } from "./types";

export function facetsOf(system: HouseholdSystem): Facet[] {
  const out: Facet[] = [];
  const add = (key: Facet["key"], value: string | undefined) => {
    if (value && value.trim()) out.push({ key, value: value.trim() });
  };
  const addAll = (key: Facet["key"], values: string[] | undefined) =>
    (values ?? []).forEach((v) => add(key, v));

  const f = system.facets ?? {};
  add("household-domain", f.domain);
  addAll("household-circumstance", f.householdCircumstances);
  add("developmental-stage", f.developmentalStage);
  add("audience", f.audience ?? system.audience);
  add("purpose", f.purpose);
  addAll("constraint", f.constraints);
  addAll("task", f.tasks);
  addAll("skill-taught", f.skillsTaught);
  addAll("prerequisite-knowledge", f.requiredKnowledge);
  add("frequency", f.frequency);
  add("evidence-type", f.evidenceType ?? system.provenance?.sourceType);
  addAll("observed-outcome", f.outcomesObserved);
  add("applicability", f.applicability);
  add("limitations", f.limitations ?? system.limitations);
  add("cultural-context", f.culturalContext ?? system.locale?.culturalContext);

  // Routine-level knowledge surfaces as facets too — a routine that teaches
  // label reading makes the SYSTEM findable by that skill.
  for (const routine of system.routines) {
    add("skill-taught", routine.cred?.skillTaught);
    add("supervision-level", routine.cred?.supervisionLevel);
    add("cultural-context", routine.culturalNote);
  }
  return out;
}
