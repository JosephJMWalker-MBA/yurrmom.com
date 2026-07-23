/**
 * Final RenderedAnswer validation (Phase 7). Mechanical, fail-closed.
 *
 * Because the trusted prose is compiler-generated, this is a mechanical
 * comparison against the plan — not a semantic judgement. A rejected answer is
 * never displayed partially.
 */
import { fingerprint } from "./fingerprint";
import type { CompositionCandidate } from "./candidate";
import { fingerprintCandidate } from "./candidate";
import {
  RENDERED_ANSWER_SCHEMA,
  wrapPointText,
  type RenderedAnswer,
} from "./compile";
import type { AnswerPlan, AnswerPoint, ValidationIssue, ValidationResult } from "./types";

const HTML_OR_SCRIPT = /<\/?[a-z][\s\S]*?>|<script|javascript:|onerror=|onload=/i;

export function validateRenderedAnswer(
  rendered: RenderedAnswer,
  plan: AnswerPlan,
  candidate: CompositionCandidate,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const err = (code: string, message: string, extra: Partial<ValidationIssue> = {}) =>
    errors.push({ code, message, ...extra });

  // ---- identity / fingerprints ----
  if (rendered.schemaVersion !== RENDERED_ANSWER_SCHEMA)
    err("schema-mismatch", "Unexpected rendered-answer schema version.");
  if (rendered.planFingerprint !== plan.planFingerprint)
    err("plan-fingerprint-mismatch", "Rendered planFingerprint does not match the plan.");
  if (rendered.candidateFingerprint !== fingerprintCandidate(candidate))
    err("candidate-fingerprint-mismatch", "Rendered candidateFingerprint does not match the candidate.");

  const recomputed = fingerprint({
    schemaVersion: rendered.schemaVersion,
    planId: rendered.planId,
    planFingerprint: rendered.planFingerprint,
    candidateFingerprint: rendered.candidateFingerprint,
    disposition: rendered.disposition,
    requestedLocale: rendered.requestedLocale,
    title: rendered.title,
    intro: rendered.intro,
    sections: rendered.sections,
    conclusion: rendered.conclusion,
    citations: rendered.citations,
    mandatoryQualifications: rendered.mandatoryQualifications,
    escalationDisclosure: rendered.escalationDisclosure,
    providerMeta: { renderer: rendered.providerMeta.renderer, provider: rendered.providerMeta.provider, model: rendered.providerMeta.model },
  });
  if (recomputed !== rendered.finalFingerprint)
    err("final-fingerprint-mismatch", "Final fingerprint does not match the rendered content.");

  // ---- provider metadata present ----
  if (!rendered.providerMeta.provider || !rendered.providerMeta.model || !rendered.providerMeta.renderer)
    err("provider-metadata-missing", "Provider metadata is incomplete.");

  // ---- gather rendered point items ----
  const pointItems = rendered.sections.flatMap((s) => s.items.filter((i) => i.kind === "point"));
  const pointById = new Map(plan.permittedAnswerPoints.map((p) => [p.id, p]));
  const trustedLabels = new Set(plan.citationMap.map((c) => c.label));
  const trustedLinks = new Set(plan.citationMap.map((c) => c.link).filter(Boolean));

  const seen = new Set<string>();
  for (const item of pointItems) {
    const p = item.pointId ? pointById.get(item.pointId) : undefined;
    if (!p) {
      err("unsupported-point", `Rendered a point "${item.pointId}" not present in the plan.`, { pointId: item.pointId });
      continue;
    }
    if (seen.has(p.id)) err("duplicate-point", `Point "${p.id}" rendered more than once.`, { pointId: p.id });
    seen.add(p.id);

    // exact proposition (via the deterministic wrapper)
    if (item.text !== wrapPointText(p))
      err("altered-proposition", `Rendered text for point "${p.id}" does not match the deterministic template output.`, { pointId: p.id });

    // citations correct + only from the plan
    if (item.citationLabels.join(",") !== p.citationIds.join(","))
      err("citation-attached-to-wrong-point", `Point "${p.id}" citations differ from the plan.`, { pointId: p.id });
    for (const l of item.citationLabels)
      if (!trustedLabels.has(l)) err("citation-label-altered", `Point "${p.id}" cites unknown label [${l}].`, { pointId: p.id });

    // prescriptive phrasing where prohibited
    if (!p.prescriptiveAllowed && /\byou (should|must|need to)\b/i.test(item.text))
      err("prescriptive-where-prohibited", `Prescriptive phrasing rendered for non-prescriptive point "${p.id}".`, { pointId: p.id });
  }

  // ---- required (compiler-selectable) points present ----
  for (const p of plan.permittedAnswerPoints) {
    if (p.omission === "optional") continue;
    if (compilerOwned(p.role)) continue; // rendered from mandatory sections
    if (!seen.has(p.id)) err("required-point-missing", `Required point "${p.id}" is missing from the rendered answer.`, { pointId: p.id });
  }

  // ---- mandatory qualifications present ----
  const limitationTexts = rendered.sections.flatMap((s) => s.items.filter((i) => i.kind === "limitation").map((i) => i.text));
  for (const lim of plan.limitations) {
    if (!limitationTexts.includes(`Important limitation: ${lim}`))
      err("mandatory-qualification-missing", "A mandatory qualification is missing from the rendered answer.");
  }

  // ---- conflict / missing-authority disclosure ----
  const conflictTexts = rendered.sections.flatMap((s) => s.items.filter((i) => i.kind === "conflict").map((i) => i.text));
  if (plan.conflicts.length > 0) {
    for (const c of plan.conflicts) if (!conflictTexts.includes(c)) err("conflict-omitted", "A required conflict disclosure is missing.");
  }
  const missingTexts = rendered.sections.flatMap((s) => s.items.filter((i) => i.kind === "missing").map((i) => i.text));
  if (plan.rendererConstraints.mustStateMissingAuthority) {
    if (plan.missingEvidence.length > 0 && !plan.missingEvidence.every((m) => missingTexts.includes(m)))
      err("missing-authority-omitted", "Missing-authority statement omitted.");
  }

  // ---- translation warning preserved (when a translation caution exists) ----
  const hasTranslationCaution = plan.qualifications.some((q) => q.kind === "stale-or-unapproved-translation");
  if (hasTranslationCaution) {
    const translationLimit = plan.limitations.find((l) => /translation/i.test(l));
    if (translationLimit && !limitationTexts.includes(`Important limitation: ${translationLimit}`))
      err("translation-warning-omitted", "Translation caution omitted from the rendered answer.");
  }

  // ---- escalation wording exact ----
  if (plan.escalation.type !== "none") {
    const escTexts = rendered.sections.flatMap((s) => s.items.filter((i) => i.kind === "escalation").map((i) => i.text));
    if (!escTexts.includes(plan.escalation.requiredWording) || rendered.escalationDisclosure !== plan.escalation.requiredWording)
      err("escalation-wording-altered", "Escalation wording is missing or altered.");
  }

  // ---- injection / link provenance ----
  const allText = [
    rendered.title,
    rendered.intro,
    rendered.conclusion,
    ...rendered.sections.flatMap((s) => [s.heading, ...s.items.map((i) => i.text)]),
  ].join("\n");
  if (HTML_OR_SCRIPT.test(allText)) err("html-or-script-injection", "Rendered text contains HTML or script.");
  const urlMatches = allText.match(/https?:\/\/\S+/g) ?? [];
  for (const u of urlMatches) if (!trustedLinks.has(u)) err("untrusted-link", `Rendered text contains a non-citation link: ${u}`);

  return { valid: errors.length === 0, errors, warnings };
}

function compilerOwned(role: string): boolean {
  return role === "limitation" || role === "conflict" || role === "missing-evidence" || role === "escalation";
}

export function containsModelProse(rendered: RenderedAnswer, candidate: CompositionCandidate): boolean {
  // The candidate has no prose fields, so there is structurally nothing to leak;
  // this guard exists so a future candidate shape change fails a test.
  return "refusalReason" in candidate && typeof (candidate as { refusalReason?: unknown }).refusalReason === "string"
    ? [rendered.title, rendered.intro, rendered.conclusion].some((t) => t.includes(candidate.refusalReason ?? " "))
    : false;
}
