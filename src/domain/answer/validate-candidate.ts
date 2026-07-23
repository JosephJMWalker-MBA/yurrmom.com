/**
 * Deterministic CompositionCandidate validation (Phase 7). FAIL CLOSED.
 *
 * A structured candidate is never trusted merely because it matches the JSON
 * Schema. This gate re-checks every semantic constraint against the contract
 * and never repairs a candidate.
 */
import { COMPOSITION_CANDIDATE_SCHEMA, type CompositionCandidate } from "./candidate";
import {
  MANDATORY_SECTIONS,
  SECTION_ROLE_COMPATIBILITY,
  SUBSTANTIVE_SECTIONS,
  isCitationStyleId,
  isConclusionTemplateId,
  isIntroTemplateId,
  isSectionTemplateId,
  isStyleId,
  isTitleTemplateId,
} from "./templates";
import type { RenderContract } from "./render-contract";
import type { ValidationIssue, ValidationResult } from "./types";

export function validateCompositionCandidate(
  candidate: CompositionCandidate,
  contract: RenderContract,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const err = (code: string, message: string, extra: Partial<ValidationIssue> = {}) =>
    errors.push({ code, message, ...extra });

  // ---- identity / schema ----
  if (candidate.schemaVersion !== COMPOSITION_CANDIDATE_SCHEMA)
    err("schema-version-mismatch", `Unexpected schema version "${candidate.schemaVersion}".`);
  if (candidate.planId !== contract.planId)
    err("plan-id-mismatch", "Candidate planId does not match the contract.");
  if (candidate.planFingerprint !== contract.planFingerprint)
    err("plan-fingerprint-mismatch", "Candidate planFingerprint does not match the contract.");

  // ---- refusal fail-closed: a refusal must carry NO composition ----
  if (candidate.refusal) {
    if (candidate.sections.length > 0)
      err("refusal-with-content", "Provider refused but still returned composition sections.");
    // A bare refusal is otherwise acceptable (pipeline falls back deterministically).
    return { valid: errors.length === 0, errors, warnings };
  }

  // ---- style / template IDs ----
  if (!isStyleId(candidate.styleId) || !contract.allowedStyleIds.includes(candidate.styleId as never))
    err("unknown-style-id", `Style "${candidate.styleId}" is not allowed.`);
  if (!isTitleTemplateId(candidate.titleTemplateId) || !contract.allowedTitleTemplateIds.includes(candidate.titleTemplateId as never))
    err("unknown-or-inappropriate-title", `Title template "${candidate.titleTemplateId}" is not allowed for this disposition.`);
  if (!isIntroTemplateId(candidate.introTemplateId) || !contract.allowedIntroTemplateIds.includes(candidate.introTemplateId as never))
    err("unknown-or-inappropriate-intro", `Intro template "${candidate.introTemplateId}" is not allowed for this disposition.`);
  if (!isConclusionTemplateId(candidate.conclusionTemplateId) || !contract.allowedConclusionTemplateIds.includes(candidate.conclusionTemplateId as never))
    err("unknown-conclusion-id", `Conclusion template "${candidate.conclusionTemplateId}" is not allowed.`);
  if (!isCitationStyleId(candidate.citationStyleId) || !contract.allowedCitationStyleIds.includes(candidate.citationStyleId as never))
    err("unsupported-citation-style", `Citation style "${candidate.citationStyleId}" is not supported.`);

  // ---- empty composition when rendering is permitted ----
  if (candidate.sections.length === 0)
    err("empty-composition", "No sections were provided but rendering is permitted.");

  // ---- section / point checks ----
  const pointById = new Map(contract.permittedPoints.map((p) => [p.id, p]));
  const seenPointIds = new Set<string>();
  let optionalCount = 0;
  const sectionTemplatesUsed = new Set<string>();

  for (const section of candidate.sections) {
    if (!isSectionTemplateId(section.sectionTemplateId)) {
      err("unknown-section-template", `Unknown section template "${section.sectionTemplateId}".`);
      continue;
    }
    if (sectionTemplatesUsed.has(section.sectionTemplateId))
      err("duplicate-section-template", `Section template "${section.sectionTemplateId}" used more than once.`);
    sectionTemplatesUsed.add(section.sectionTemplateId);

    const isMandatory = MANDATORY_SECTIONS.includes(section.sectionTemplateId as never);
    if (isMandatory && section.orderedPointIds.length > 0) {
      err("mandatory-section-carries-points", `Compiler-owned section "${section.sectionTemplateId}" must not carry point IDs.`);
    }
    if (!isMandatory && !SUBSTANTIVE_SECTIONS.includes(section.sectionTemplateId as never)) {
      err("non-substantive-section-misused", `Section "${section.sectionTemplateId}" cannot carry composed points.`);
    }

    for (const pid of section.orderedPointIds) {
      const point = pointById.get(pid);
      if (!point) {
        err("unknown-or-absent-point", `Point "${pid}" is not present in the plan.`, { pointId: pid });
        continue;
      }
      if (contract.prohibitedPointIds.includes(pid))
        err("prohibited-point-selected", `Point "${pid}" is prohibited.`, { pointId: pid });
      if (seenPointIds.has(pid))
        err("duplicate-point", `Point "${pid}" appears more than once.`, { pointId: pid });
      seenPointIds.add(pid);

      // role ↔ section compatibility
      const compatibleRoles = SECTION_ROLE_COMPATIBILITY[section.sectionTemplateId] ?? [];
      if (!compatibleRoles.includes(point.role))
        err("incompatible-section-placement", `Point "${pid}" (role ${point.role}) cannot appear in "${section.sectionTemplateId}".`, { pointId: pid });

      // lived experience when disallowed
      if (
        !contract.livedExperienceAvailable &&
        ["creator-original", "creator-approved-translation", "reviewed-translation"].includes(point.supportClass)
      )
        err("experience-when-disallowed", `Lived-experience point "${pid}" included when household examples are disallowed.`, { pointId: pid });

      // authoritative point requires available authority
      if (point.role === "authoritative-guidance" && !contract.authoritativePointAvailable)
        err("authority-without-support", `Authoritative point "${pid}" included without valid authority.`, { pointId: pid });

      // prescriptive selected when globally prohibited
      if (point.prescriptiveAllowed === false && point.role === "authoritative-guidance") {
        // fine (non-prescriptive authoritative allowed)
      }

      if (!point.required) optionalCount++;
    }
  }

  // prescriptive point selected when global prescription prohibited
  if (!contractAllowsPrescription(contract)) {
    for (const pid of seenPointIds) {
      const p = pointById.get(pid);
      if (p?.prescriptiveAllowed)
        err("prescriptive-when-prohibited", `Prescriptive point "${pid}" selected while prescription is globally prohibited.`, { pointId: pid });
    }
  }

  // ---- required / prohibited-from-omission points must be present ----
  for (const requiredId of contract.mandatoryPointIds) {
    // Points bound to compiler-owned mandatory sections (limitation/conflict/
    // missing-evidence/escalation) are inserted by the compiler, not selected.
    const p = pointById.get(requiredId);
    if (!p) continue;
    if (isCompilerOwnedRole(p.role)) continue;
    if (!seenPointIds.has(requiredId))
      err("required-point-omitted", `Required point "${requiredId}" was omitted.`, { pointId: requiredId });
  }

  // ---- optional-point budget by depth ----
  if (optionalCount > contract.optionalPointCap)
    err("optional-cap-exceeded", `Selected ${optionalCount} optional points; depth allows ${contract.optionalPointCap}.`);

  // ---- mandatory disclosure sections must be present when required ----
  if (contract.conflictsToDisclose.length > 0 && !sectionTemplatesUsed.has("where-sources-disagree"))
    err("conflict-section-omitted", "Conflict disclosure is required but no `where-sources-disagree` section was included.");
  if (contract.escalationType !== "none" && !sectionTemplatesUsed.has("next-safe-step"))
    err("escalation-section-omitted", "Escalation is required but no `next-safe-step` section was included.");
  if (contract.mandatoryQualificationTexts.length > 0 && !sectionTemplatesUsed.has("important-limits"))
    err("limits-section-omitted", "Mandatory qualifications exist but no `important-limits` section was included.");
  if (mustStateMissing(contract) && !sectionTemplatesUsed.has("what-is-missing"))
    err("missing-evidence-section-omitted", "Missing evidence must be disclosed but no `what-is-missing` section was included.");
  if (!sectionTemplatesUsed.has("sources") && contractHasCitations(contract))
    err("sources-section-omitted", "A `sources` section is required when citations exist.");

  return { valid: errors.length === 0, errors, warnings };
}

function contractAllowsPrescription(contract: RenderContract): boolean {
  // Prescription is globally prohibited whenever escalation prohibits it OR no
  // prescriptive point exists.
  return contract.permittedPoints.some((p) => p.prescriptiveAllowed) &&
    !contract.prohibitedAssertionCodes.includes("no-unsupported-high-stakes-prescription");
}

function isCompilerOwnedRole(role: string): boolean {
  return role === "limitation" || role === "conflict" || role === "missing-evidence" || role === "escalation";
}

function mustStateMissing(contract: RenderContract): boolean {
  return contract.disposition === "abstain-authoritative-support-required" ||
    contract.disposition === "abstain-insufficient-evidence" ||
    contract.disposition === "escalate-to-qualified-professional";
}

function contractHasCitations(contract: RenderContract): boolean {
  return contract.permittedPoints.some((p) => p.citationLabels.length > 0);
}
