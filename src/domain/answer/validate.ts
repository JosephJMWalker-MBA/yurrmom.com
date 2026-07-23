/**
 * Deterministic AnswerPlan validation (Phase 6).
 *
 * Structural, evidence-integrity checks. It never repairs a plan — it reports
 * structured errors and warnings. Citation PRESENCE never proves citation
 * SUPPORT; this validator is where support is actually checked.
 */
import type { EvidencePacket, GuidanceRisk } from "../knowledge";
import { HIGH_STAKES_RISKS } from "../knowledge";
import { fingerprintPacket } from "./fingerprint";
import type {
  AnswerPlan,
  AnswerPoint,
  ValidationIssue,
  ValidationResult,
} from "./types";

function isHighStakes(risk: GuidanceRisk): boolean {
  return HIGH_STAKES_RISKS.includes(risk);
}

const SUBSTANTIVE_ROLES = new Set([
  "direct-response",
  "household-method",
  "creator-experience",
  "authoritative-guidance",
  "definition",
  "limitation",
  "caution",
  "alternative",
  "conflict",
]);

/** Relations that cannot independently support a prescriptive/authoritative claim. */
const WEAK_RELATIONS = new Set(["background-only", "illustrates"]);

export function validateAnswerPlan(
  plan: AnswerPlan,
  packet: EvidencePacket,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const err = (code: string, message: string, extra: Partial<ValidationIssue> = {}) =>
    errors.push({ code, message, ...extra });
  const warn = (code: string, message: string, extra: Partial<ValidationIssue> = {}) =>
    warnings.push({ code, message, ...extra });

  const highStakes = isHighStakes(packet.guidanceRisk);

  // 1) Packet fingerprint must match.
  if (plan.packetFingerprint !== fingerprintPacket(packet)) {
    err("packet-fingerprint-mismatch", "Plan packetFingerprint does not match the supplied packet.");
  }

  // Index of real packet hit IDs and citations.
  const packetHitIds = new Set(packet.hits.map((h) => `hit:${h.rank}:${h.unit.id}`));
  const hitByLedgerId = new Map(packet.hits.map((h) => [`hit:${h.rank}:${h.unit.id}`, h]));
  const citationByLabel = new Map(plan.citationMap.map((c) => [c.label, c]));

  // 17) Citation labels must be unique and sequential 1..N.
  const labels = plan.citationMap.map((c) => c.label);
  if (new Set(labels).size !== labels.length) {
    err("duplicate-citation-label", "Citation labels are not unique.");
  }
  labels.forEach((l, i) => {
    if (l !== String(i + 1)) err("unstable-citation-label", `Citation label "${l}" is not the expected "${i + 1}".`);
  });

  const eligibleByHitId = new Map(
    packet.hits.map((h) => [`hit:${h.rank}:${h.unit.id}`, h.authoritativeEligibility?.eligible === true]),
  );
  const ledgerByPoint = new Map(plan.supportLedger.map((l) => [l.pointId, l]));

  for (const point of plan.permittedAnswerPoints) {
    checkPoint(point);
  }

  function checkPoint(point: AnswerPoint) {
    const isFixed = point.supportClass === "unsupported";

    // 2) Point cites a hit not present in the packet.
    for (const hid of point.supportingHitIds) {
      if (!packetHitIds.has(hid)) {
        err("hit-not-in-packet", `Point cites hit "${hid}" absent from the packet.`, { pointId: point.id });
      }
    }

    // 3) Substantive point must have a citation (unless fixed policy point).
    if (!isFixed && SUBSTANTIVE_ROLES.has(point.role) && point.citationIds.length === 0) {
      err("substantive-point-uncited", "Substantive point has no citation.", { pointId: point.id });
    }

    // Unknown citation label + citation-support mapping.
    for (const label of point.citationIds) {
      const cit = citationByLabel.get(label);
      if (!cit) {
        err("unknown-citation-label", `Point references unknown citation [${label}].`, { pointId: point.id, citationId: label });
        continue;
      }
      // 4) Citation must map to the point's declared support (no laundering).
      if (!point.supportingHitIds.includes(cit.hitId)) {
        err("citation-support-mismatch", `Citation [${label}] does not support point (its source is not among the point's supporting hits).`, { pointId: point.id, citationId: label });
      }
    }

    const ledger = ledgerByPoint.get(point.id);

    // 5/6/10) Authoritative point requirements.
    if (point.role === "authoritative-guidance") {
      const eligibleHit = point.supportingHitIds.some((h) => eligibleByHitId.get(h));
      if (!eligibleHit) err("authoritative-without-eligibility", "Authoritative point lacks an eligible authoritative hit.", { pointId: point.id });
      // exact evidence with complete locator
      const hasExactEvidence = point.citationIds.some((l) => {
        const c = citationByLabel.get(l);
        return c && c.exactExcerpt.trim().length > 0 && c.locator && locatorComplete(c.locator);
      });
      if (!hasExactEvidence) err("authoritative-without-exact-evidence", "Authoritative point lacks an exact supporting evidence span with a complete locator.", { pointId: point.id });
      // lived experience mislabeled as authority
      const backedByExperience = point.citationIds.some((l) => citationByLabel.get(l)?.sourceType === "personal-experience");
      if (backedByExperience) err("experience-as-authority", "Authoritative point is backed by lived experience.", { pointId: point.id });
      if (["creator-original", "creator-approved-translation", "reviewed-translation"].includes(point.supportClass))
        err("experience-as-authority", "Authoritative point carries a creator-experience support class.", { pointId: point.id });
      // 9) editorial inference cannot be sole high-stakes support
      if (highStakes && ledger?.interpretationLevel === "editorial-inference")
        err("inference-as-sole-authority", "Editorial inference used as authoritative high-stakes support.", { pointId: point.id });
    }

    // 8) stale/withdrawn/expired/out-of-scope claim cannot be current authority.
    if (point.role === "authoritative-guidance") {
      for (const hid of point.supportingHitIds) {
        const h = hitByLedgerId.get(hid);
        const cv = h?.unit.claim?.sourceVersion;
        if (cv && cv.status !== "active") err("stale-or-withdrawn-authority", `Authoritative point relies on a ${cv.status} source version.`, { pointId: point.id });
        if (h?.unit.claim && h.unit.claim.claimStatus !== "approved") err("unapproved-authority", `Authoritative point relies on a ${h.unit.claim.claimStatus} claim.`, { pointId: point.id });
      }
    }

    // 7) prescriptive high-stakes without authority; weak-relation prescription.
    if (point.prescriptiveAllowed) {
      if (highStakes && point.role !== "authoritative-guidance")
        err("prescriptive-without-authority", "Prescriptive high-stakes point is not authoritative.", { pointId: point.id });
      if (ledger && WEAK_RELATIONS.has(ledger.supportRelation))
        err("prescriptive-on-weak-relation", `Prescriptive point rests on a ${ledger.supportRelation} relation.`, { pointId: point.id });
    }
  }

  // 11) Translation status must be present on every citation.
  for (const c of plan.citationMap) {
    if (!c.translationStatus.trim()) err("translation-status-omitted", `Citation [${c.label}] omits translation status.`, { citationId: c.label });
  }
  if (packet.localeSummary.unapprovedOrStalePresent &&
    !plan.qualifications.some((q) => q.kind === "stale-or-unapproved-translation")) {
    err("translation-caution-omitted", "An unapproved/stale translation exists but the plan omits the caution qualification.");
  }

  // 12) Conflict disclosure.
  const packetConflict =
    (packet.authoritativeSummary?.conflictWarnings.length ?? 0) > 0 ||
    packet.hits.some((h) => h.unit.claim?.conflicts.some((c) => c.relation === "conflicts-with" && !c.resolved));
  if (packetConflict) {
    if (plan.conflicts.length === 0) err("conflict-disclosure-omitted", "Unresolved conflict present but plan.conflicts is empty.");
    if (!plan.rendererConstraints.mustDiscloseConflict) err("conflict-flag-omitted", "Renderer constraints do not require conflict disclosure.");
    if (!plan.permittedAnswerPoints.some((p) => p.role === "conflict"))
      warn("conflict-point-missing", "No explicit conflict point present.");
  }

  // 13) Mandatory limitations from eligible authority must appear.
  for (const h of packet.hits) {
    if (h.unit.kind === "curated-claim" && h.authoritativeEligibility?.eligible && h.unit.claim) {
      if (h.unit.claim.limitations && !plan.limitations.includes(h.unit.claim.limitations))
        err("mandatory-limitation-omitted", "An eligible authoritative claim's limitation is missing from plan.limitations.");
    }
  }

  // 14) Required abstention/escalation.
  if (highStakes) {
    const hasEligible = packet.hits.some((h) => h.unit.kind === "curated-claim" && h.authoritativeEligibility?.eligible);
    if (!hasEligible && !packetConflict) {
      const abstains = ["abstain-authoritative-support-required", "escalate-to-qualified-professional", "abstain-insufficient-evidence"].includes(plan.disposition);
      if (!abstains) err("required-abstention-omitted", "High-stakes query without eligible authority must abstain or escalate.");
      if (plan.escalation.type === "none") err("required-escalation-omitted", "High-stakes query without eligible authority must carry an escalation directive.");
    }
  }

  // 15) Required prohibited assertions must be present.
  const codes = new Set(plan.prohibitedAssertions.map((p) => p.code));
  if (plan.livedExperienceExamples.length > 0 && !codes.has("no-experience-as-professional"))
    err("prohibition-missing", "Missing prohibition: lived experience must not be presented as professional guidance.");
  if (packetConflict && !codes.has("no-omit-conflicts"))
    err("prohibition-missing", "Missing prohibition: conflicts must not be omitted.");
  if (highStakes && !packet.hits.some((h) => h.authoritativeEligibility?.eligible) && !packetConflict && !codes.has("no-unsupported-high-stakes-prescription"))
    err("prohibition-missing", "Missing prohibition against unsupported high-stakes prescription.");

  return { valid: errors.length === 0, errors, warnings };
}

function locatorComplete(l: {
  page?: string;
  sectionHeading?: string;
  paragraphIndex?: number;
  lineRange?: string;
  urlFragment?: string;
  tableOrFigure?: string;
}): boolean {
  return Boolean(
    l.page || l.sectionHeading || l.paragraphIndex !== undefined || l.lineRange || l.urlFragment || l.tableOrFigure,
  );
}
