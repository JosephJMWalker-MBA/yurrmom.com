/**
 * Fiction-provenance validation (Phase 9).
 *
 * A roast subject is fictional BY CONSTRUCTION. This module is the gate: a
 * prompt cannot become `active` unless its provenance validates. The type
 * system already forbids a `real-person` kind; this adds the runtime
 * affirmations and label requirements. Nothing here infers whether a name is
 * real — it enforces that the creator/platform affirmed fictionality and
 * excluded identifiable people, and that a public label exists.
 */
import type { FictionProvenance, RoastPromptRecord } from "./types";

const ALLOWED_KINDS = new Set(["synthetic-illustration", "ai-generated-fiction", "archetype"]);

export interface ProvenanceValidation {
  valid: boolean;
  issues: string[];
}

export function validateFictionProvenance(p: FictionProvenance | undefined): ProvenanceValidation {
  const issues: string[] = [];
  if (!p) return { valid: false, issues: ["Fiction provenance is missing."] };
  if (!ALLOWED_KINDS.has(p.kind)) issues.push(`Invalid fiction kind "${p.kind}".`);
  if (!p.fictionalSubjectAffirmed) issues.push("The fictional-subject affirmation is required.");
  if (!p.identifiablePersonExcluded) issues.push("The identifiable-person exclusion affirmation is required.");
  if (!p.requiredPublicLabel?.trim()) issues.push("A required public fiction label is missing.");
  if (!p.sourceNote?.trim()) issues.push("A provenance source note is required.");
  if (!p.attribution?.trim()) issues.push("Provenance attribution is required.");
  return { valid: issues.length === 0, issues };
}

/** A prompt may activate only when its provenance validates and a label is set. */
export function promptCanActivate(prompt: RoastPromptRecord): ProvenanceValidation {
  const base = validateFictionProvenance(prompt.provenance);
  const issues = [...base.issues];
  if (prompt.fictionLabelRequired && !prompt.fictionLabel?.trim())
    issues.push("This prompt requires a public fiction label before activation.");
  return { valid: issues.length === 0, issues };
}
