/**
 * Grounded Answer Planner (Phase 6).
 *
 * Deterministically transforms an EvidencePacket into an AnswerPlan — an answer
 * contract that constrains what a future renderer or model may say. No model,
 * no summarizer, no scoring of truth. Every proposition is a conservative,
 * mechanically-checkable construction over exact packet content:
 *   - exact KnowledgeUnit.displayText
 *   - structured list-item fields already preserved by projection
 *   - approved curated-claim wording + its exact evidence spans
 *   - deterministic policy templates
 *
 * The planner READS the packet and NEVER mutates it (or any canonical content,
 * unit, translation, reference version, span, claim, or assessment).
 */
import type {
  EvidenceHit,
  EvidencePacket,
  GuidanceRisk,
  KnowledgeQuery,
  KnowledgeUnit,
} from "../knowledge";
import { HIGH_STAKES_RISKS } from "../knowledge";
import { validateAnswerPlan } from "./validate";
import {
  fingerprint,
  fingerprintPacket,
  fnv1a,
  stableStringify,
} from "./fingerprint";
import {
  POLICY_VERSION,
  type AnswerPlan,
  type AnswerPoint,
  type AnswerRequest,
  type CitationEntry,
  type CitationMap,
  type Disposition,
  type EscalationDirective,
  type EscalationType,
  type PointRole,
  type ProhibitedAssertion,
  type Qualification,
  type RendererConstraints,
  type SupportClass,
  type SupportLedgerEntry,
  type SupportRelation,
} from "./types";

// ------------------------------------------------------------ helpers

function hitId(h: EvidenceHit): string {
  // Stable within a packet: rank + unit id.
  return `hit:${h.rank}:${h.unit.id}`;
}

function isHighStakes(risk: GuidanceRisk): boolean {
  return HIGH_STAKES_RISKS.includes(risk);
}

function hasUnresolvedConflict(unit: KnowledgeUnit): boolean {
  return (
    unit.claim?.conflicts.some(
      (c) => c.relation === "conflicts-with" && !c.resolved,
    ) ?? false
  );
}

function creatorSupportClass(h: EvidenceHit): SupportClass {
  const rep = h.representation;
  if (rep.kind === "translation" && rep.approvedByCreator) {
    return rep.effectiveStatus === "reviewed"
      ? "reviewed-translation"
      : "creator-approved-translation";
  }
  return "creator-original";
}

const CREATOR_ROLE: Partial<Record<KnowledgeUnit["kind"], PointRole>> = {
  "problem-promise": "direct-response",
  audience: "definition",
  limitations: "limitation",
  "observed-outcome": "creator-experience",
  "story-section": "creator-experience",
  "list-item": "household-method",
  routine: "household-method",
  recipe: "household-method",
};

const CREATOR_RELATION: Partial<Record<KnowledgeUnit["kind"], SupportRelation>> = {
  "problem-promise": "directly-states",
  audience: "background-only",
  limitations: "limits",
  "observed-outcome": "illustrates",
  "story-section": "illustrates",
  "list-item": "directly-states",
  routine: "directly-states",
  recipe: "directly-states",
};

/** Deterministic, field-preserving proposition for a creator unit. */
function creatorProposition(unit: KnowledgeUnit): string {
  if (unit.kind === "list-item" && unit.listItem) {
    const li = unit.listItem;
    const parts = [`${li.need} — ${li.quantity}, ${li.recurrence}`];
    if (li.preferredName) parts.push(`preferred: ${li.preferredName}`);
    return parts.join("; ");
  }
  return unit.displayText;
}

const ESCALATION_BY_RISK: Record<GuidanceRisk, EscalationType> = {
  "ordinary-household": "none",
  medical: "licensed-medical-professional",
  developmental: "pediatric-or-developmental-professional",
  "mental-health": "licensed-mental-health-professional",
  legal: "qualified-legal-professional",
  "safety-critical": "immediate-safety-response",
};

const ESCALATION_WORDING: Record<GuidanceRisk, string> = {
  "ordinary-household": "",
  medical:
    "This is general information, not individualized medical advice. For a specific person or diagnosis, consult a licensed medical professional.",
  developmental:
    "This is general information, not individualized developmental advice. For guidance about a specific child, consult a qualified pediatric or developmental professional.",
  "mental-health":
    "This is general information, not individualized mental-health advice. For a specific situation, consult a licensed mental-health professional.",
  legal:
    "This is general information, not individualized legal advice. For a specific matter, consult a qualified legal professional.",
  "safety-critical":
    "This is general information, not a safety determination. For an urgent safety concern, seek an appropriate qualified professional response.",
};

// ------------------------------------------------------------ planner

/**
 * Build the existing KnowledgeQuery from an AnswerRequest — the planner reuses
 * Phase 4 retrieval + normalization rather than duplicating them.
 */
export function answerRequestToQuery(request: AnswerRequest): KnowledgeQuery {
  return {
    text: request.question,
    requestedLocale: request.requestedLocale,
    householdCircumstances: request.householdCircumstances,
    developmentalStage: request.developmentalStage,
    householdDomain: request.householdDomain,
    constraints: request.constraints,
    taskOrSkill: request.taskOrSkill,
    jurisdiction: request.jurisdiction,
    systemScope: request.systemScope,
    creatorScope: request.creatorScope,
    representationPolicy: request.representationPolicy,
    guidanceRisk: request.guidanceRisk,
  };
}

export interface PlanOptions {
  /** Injected for deterministic tests; excluded from all fingerprints. */
  now?: Date;
}

export function planAnswer(
  request: AnswerRequest,
  packet: EvidencePacket,
  opts: PlanOptions = {},
): AnswerPlan {
  const risk = request.guidanceRisk;
  const highStakes = isHighStakes(risk);
  const createdAt = (opts.now ?? new Date()).toISOString();

  const hasEligibleAuthority = packet.hits.some(
    (h) => h.unit.kind === "curated-claim" && h.authoritativeEligibility?.eligible,
  );
  const conflictHits = packet.hits.filter((h) => hasUnresolvedConflict(h.unit));
  const conflictsPresent =
    conflictHits.length > 0 ||
    (packet.authoritativeSummary?.conflictWarnings.length ?? 0) > 0;

  // ---- build raw points in hit-rank order (deterministic) ----
  interface Raw {
    point: Omit<AnswerPoint, "citationIds">;
    hitId: string;
    ledger: Omit<SupportLedgerEntry, "citationIds">;
    cited: boolean;
  }
  const raw: Raw[] = [];

  for (const h of packet.hits) {
    const unit = h.unit;
    const hid = hitId(h);

    if (unit.kind === "curated-claim" && unit.claim) {
      const claim = unit.claim;
      const eligible = h.authoritativeEligibility?.eligible === true;
      const supporting = claim.evidenceCitations.find(
        (c) => (c.relation === "supports" || c.relation === "defines") && c.citationComplete,
      );

      if (eligible) {
        const applicability = [
          claim.applicability,
          claim.jurisdiction ? `Jurisdiction: ${claim.jurisdiction}` : "",
          claim.intendedAudience ? `Audience: ${claim.intendedAudience}` : "",
        ]
          .filter(Boolean)
          .join(" · ");
        raw.push({
          hitId: hid,
          cited: true,
          point: {
            id: `pt:${fnv1a(hid + ":auth")}`,
            role: "authoritative-guidance",
            proposition: claim.statement,
            supportClass: "curated-authoritative",
            supportingHitIds: [hid],
            sourceLocale: unit.sourceLocale.sourceLocale,
            effectiveLocale: unit.effectiveLocale.sourceLocale,
            applicability,
            limitations: [claim.limitations, ...claim.exclusions].filter(Boolean),
            warnings: h.warnings,
            prescriptiveAllowed: risk !== "safety-critical",
            omission: "prohibited-from-omission",
          },
          ledger: {
            pointId: `pt:${fnv1a(hid + ":auth")}`,
            proposition: claim.statement,
            supportingHitIds: [hid],
            supportingUnitIds: [unit.id],
            sourceObject: claim.sourceVersion.sourceTitle,
            sourceVersion: claim.sourceVersion.ordinal,
            supportRelation: (supporting?.relation as SupportRelation) ?? "supports",
            authoritativeEligible: true,
            interpretationLevel: claim.interpretationLevel,
            supportWarnings: h.warnings,
          },
        });
      } else if (hasUnresolvedConflict(unit)) {
        const other = claim.conflicts.find(
          (c) => c.relation === "conflicts-with" && !c.resolved,
        );
        raw.push({
          hitId: hid,
          cited: true,
          point: {
            id: `pt:${fnv1a(hid + ":conflict")}`,
            role: "conflict",
            proposition: `A reviewed reference ("${claim.claimId}") is materially contested by "${other?.otherClaimId}"; neither position may be presented as settled.`,
            supportClass: "curated-authoritative",
            supportingHitIds: [hid],
            sourceLocale: unit.sourceLocale.sourceLocale,
            effectiveLocale: unit.effectiveLocale.sourceLocale,
            applicability: claim.applicability,
            limitations: [claim.limitations, ...claim.exclusions].filter(Boolean),
            warnings: h.warnings,
            prescriptiveAllowed: false,
            omission: "prohibited-from-omission",
          },
          ledger: {
            pointId: `pt:${fnv1a(hid + ":conflict")}`,
            proposition: `Contested reference ${claim.claimId}`,
            supportingHitIds: [hid],
            supportingUnitIds: [unit.id],
            sourceObject: claim.sourceVersion.sourceTitle,
            sourceVersion: claim.sourceVersion.ordinal,
            supportRelation: "contradicts",
            authoritativeEligible: false,
            interpretationLevel: claim.interpretationLevel,
            supportWarnings: h.warnings,
          },
        });
      }
      // Non-conflict ineligible claims are NOT made into points (they would be
      // uncited or citation-laundered). Their reasons feed missingEvidence.
      continue;
    }

    // Creator content unit → household method / experience (never prescriptive).
    const role = CREATOR_ROLE[unit.kind] ?? "creator-experience";
    const relation = CREATOR_RELATION[unit.kind] ?? "illustrates";
    const supportClass = creatorSupportClass(h);
    const prop = creatorProposition(unit);
    const pid = `pt:${fnv1a(hid + ":creator")}`;
    raw.push({
      hitId: hid,
      cited: true,
      point: {
        id: pid,
        role,
        proposition: prop,
        supportClass,
        supportingHitIds: [hid],
        sourceLocale: unit.sourceLocale.sourceLocale,
        effectiveLocale: unit.effectiveLocale.sourceLocale,
        applicability: unit.applicability,
        limitations: unit.limitations ? [unit.limitations] : [],
        warnings: h.warnings,
        prescriptiveAllowed: false,
        omission: role === "limitation" ? "required" : "optional",
      },
      ledger: {
        pointId: pid,
        proposition: prop,
        supportingHitIds: [hid],
        supportingUnitIds: [unit.id],
        sourceObject: unit.ownerSystemTitle,
        sourceVersion: unit.sourceVersion,
        supportRelation: relation,
        supportWarnings: h.warnings,
      },
    });
  }

  // ---- citation map: labels assigned in hit-rank (raw) order ----
  const citationMap: CitationMap = [];
  const labelByHitId = new Map<string, string>();
  const hitByHitId = new Map(packet.hits.map((h) => [hitId(h), h]));

  for (const r of raw) {
    if (!r.cited || labelByHitId.has(r.hitId)) continue;
    const h = hitByHitId.get(r.hitId)!;
    const label = String(citationMap.length + 1);
    labelByHitId.set(r.hitId, label);
    citationMap.push(buildCitation(label, h));
  }

  // ---- finalize points + ledger with citation labels ----
  const permittedAnswerPoints: AnswerPoint[] = [];
  const supportLedger: SupportLedgerEntry[] = [];
  for (const r of raw) {
    const labels = r.cited && labelByHitId.has(r.hitId) ? [labelByHitId.get(r.hitId)!] : [];
    permittedAnswerPoints.push({ ...r.point, citationIds: labels });
    supportLedger.push({ ...r.ledger, citationIds: labels });
  }

  const authoritativePoints = permittedAnswerPoints.filter(
    (p) => p.role === "authoritative-guidance",
  );
  const livedExperienceExamples = permittedAnswerPoints.filter((p) =>
    ["creator-original", "creator-approved-translation", "reviewed-translation"].includes(
      p.supportClass,
    ),
  );

  // ---- conflicts / missing evidence / warnings ----
  const conflicts: string[] = [];
  for (const h of conflictHits) {
    for (const c of h.unit.claim?.conflicts ?? []) {
      if (c.relation === "conflicts-with" && !c.resolved) {
        conflicts.push(
          `Unresolved conflict between "${h.unit.claim!.claimId}" and "${c.otherClaimId}"${c.note ? ` — ${c.note}` : ""}.`,
        );
      }
    }
  }
  for (const w of packet.authoritativeSummary?.conflictWarnings ?? []) conflicts.push(w);

  const missingEvidence: string[] = [];
  if (packet.insufficientSupportReason) missingEvidence.push(packet.insufficientSupportReason);
  for (const r of packet.authoritativeSummary?.ineligibleReasons ?? []) {
    missingEvidence.push(`Candidate reference not eligible: ${r}`);
  }
  if (highStakes && !hasEligibleAuthority && missingEvidence.length === 0) {
    missingEvidence.push(
      `No eligible authoritative claim supports guidance for this ${risk} question.`,
    );
  }

  // ---- escalation directive ----
  const escalation = buildEscalation(risk, highStakes, hasEligibleAuthority);

  // ---- fixed policy points (abstention / escalation / missing evidence) ----
  if (highStakes && !hasEligibleAuthority) {
    permittedAnswerPoints.push(fixedPoint("missing-evidence", `pt:missing:${risk}`,
      `No eligible authoritative source is available for this ${risk} question, so no ${risk} guidance is provided.`));
  }
  if (escalation.type !== "none") {
    permittedAnswerPoints.push(fixedPoint("escalation", `pt:escalate:${risk}`, escalation.requiredWording));
  }
  if (packet.hits.length === 0) {
    permittedAnswerPoints.push(fixedPoint("missing-evidence", "pt:missing:none",
      "No source-backed material matched this question."));
  }

  // ---- disposition ----
  const disposition = decideDisposition({
    risk,
    highStakes,
    coverage: packet.coverage,
    hitCount: packet.hits.length,
    hasEligibleAuthority,
    conflictsPresent,
  });

  // ---- qualifications ----
  const qualifications = buildQualifications({
    packet,
    request,
    permittedAnswerPoints,
    authoritativePoints,
    conflictsPresent,
    hasEligibleAuthority,
    highStakes,
    labelByHitId,
    hitByHitId,
    raw,
  });

  const limitations = dedupeExact(qualifications.filter((q) => q.mandatory).map((q) => q.text));

  const requiredWarnings = dedupeExact([
    ...packet.warnings,
    ...(escalation.type !== "none" ? [escalation.requiredWording] : []),
  ]);

  // ---- prohibited assertions ----
  const prohibitedAssertions = buildProhibitions({
    packet,
    risk,
    highStakes,
    hasEligibleAuthority,
    conflictsPresent,
    disposition,
    hasCreatorPoints: livedExperienceExamples.length > 0,
    hasTranslation:
      packet.localeSummary.unapprovedOrStalePresent ||
      packet.hits.some((h) => h.representation.kind === "translation" || h.representation.fellBackToOriginal),
    hasInference: packet.hits.some((h) => h.unit.claim?.interpretationLevel === "editorial-inference"),
    hasCuratedClaim: packet.hits.some((h) => h.unit.kind === "curated-claim"),
    hasLimitations: limitations.length > 0,
  });

  // ---- renderer constraints ----
  const rendererConstraints: RendererConstraints = {
    requiredCitationLabels: dedupeExact(
      permittedAnswerPoints
        .filter((p) => p.omission !== "optional")
        .flatMap((p) => p.citationIds),
    ),
    mandatoryQualificationTexts: qualifications.filter((q) => q.mandatory).map((q) => q.text),
    prohibitedAssertionCodes: prohibitedAssertions.map((p) => p.code),
    prescriptiveAllowedAnywhere:
      permittedAnswerPoints.some((p) => p.prescriptiveAllowed) &&
      !escalation.prescriptiveAnswerPointsProhibited,
    mustDiscloseConflict: conflicts.length > 0,
    mustStateMissingAuthority: highStakes && !hasEligibleAuthority,
  };

  // ---- fingerprints + id (timestamp-free) ----
  const packetFingerprint = fingerprintPacket(packet);
  const citationMapFingerprint = fingerprint(
    citationMap.map((c) => ({ label: c.label, unitId: c.unitId, excerpt: c.exactExcerpt, hash: c.evidenceHash ?? null })),
  );
  const requestCanonical = {
    question: request.question,
    requestedLocale: request.requestedLocale,
    representationPolicy: request.representationPolicy,
    guidanceRisk: request.guidanceRisk,
    householdCircumstances: request.householdCircumstances ?? [],
    developmentalStage: request.developmentalStage ?? null,
    householdDomain: request.householdDomain ?? null,
    constraints: request.constraints ?? [],
    taskOrSkill: request.taskOrSkill ?? null,
    jurisdiction: request.jurisdiction ?? null,
    systemScope: request.systemScope ?? null,
    creatorScope: request.creatorScope ?? null,
    depth: request.depth,
  };
  const planId = `plan:${packetFingerprint}:${fnv1a(POLICY_VERSION + stableStringify(requestCanonical))}`;

  const planContent = {
    planId,
    policyVersion: POLICY_VERSION,
    request: requestCanonical,
    packetFingerprint,
    disposition,
    coverage: packet.coverage,
    permittedAnswerPoints: permittedAnswerPoints.map(canonicalPoint),
    qualifications,
    limitations,
    conflicts,
    missingEvidence,
    requiredWarnings,
    escalation,
    supportLedger,
    citationMap,
    prohibitedAssertions,
    rendererConstraints,
  };
  const planFingerprint = fingerprint(planContent);

  const plan: AnswerPlan = {
    planId,
    policyVersion: POLICY_VERSION,
    request,
    normalizedQuery: packet.query,
    packetFingerprint,
    createdAt,
    disposition,
    coverage: packet.coverage,
    permittedAnswerPoints,
    livedExperienceExamples,
    authoritativePoints,
    qualifications,
    limitations,
    conflicts,
    missingEvidence,
    requiredWarnings,
    escalation,
    supportLedger,
    citationMap,
    prohibitedAssertions,
    rendererConstraints,
    planFingerprint,
    citationMapFingerprint,
    validation: { valid: true, errors: [], warnings: [] },
  };

  plan.validation = validateAnswerPlan(plan, packet);
  return plan;
}

// ------------------------------------------------------------ sub-builders

function canonicalPoint(p: AnswerPoint) {
  return {
    id: p.id,
    role: p.role,
    proposition: p.proposition,
    supportClass: p.supportClass,
    supportingHitIds: p.supportingHitIds,
    citationIds: p.citationIds,
    applicability: p.applicability ?? null,
    limitations: p.limitations,
    warnings: p.warnings,
    prescriptiveAllowed: p.prescriptiveAllowed,
    omission: p.omission,
  };
}

function fixedPoint(role: PointRole, id: string, text: string): AnswerPoint {
  return {
    id,
    role,
    proposition: text,
    supportClass: "unsupported",
    supportingHitIds: [],
    citationIds: [],
    limitations: [],
    warnings: [],
    prescriptiveAllowed: false,
    omission: "prohibited-from-omission",
  };
}

function buildCitation(label: string, h: EvidenceHit): CitationEntry {
  const unit = h.unit;
  if (unit.kind === "curated-claim" && unit.claim) {
    const claim = unit.claim;
    const span =
      claim.evidenceCitations.find(
        (c) => (c.relation === "supports" || c.relation === "defines") && c.citationComplete,
      ) ?? claim.evidenceCitations[0];
    return {
      label,
      hitId: hitId(h),
      unitId: unit.id,
      sourceObject: claim.sourceVersion.sourceTitle,
      sourceVersion: claim.sourceVersion.ordinal,
      title: claim.sourceVersion.sourceTitle,
      attribution: `${claim.sourceVersion.publisherName} (${claim.sourceVersion.organizationType})`,
      sourceType: unit.provenanceSourceType,
      exactExcerpt: span?.exactText ?? claim.statement,
      locator: span?.locator,
      evidenceHash: span ? fnv1a(span.exactText) : undefined,
      locale: unit.effectiveLocale.sourceLocale,
      translationStatus: representationStatus(h),
      reviewStatus: claim.claimStatus,
      authoritativeEligible: h.authoritativeEligibility?.eligible,
      applicability: claim.applicability,
      limitations: claim.limitations,
      link: unit.publicHref ?? unit.studioHref,
      licensingNote: claim.licensingNote,
    };
  }
  return {
    label,
    hitId: hitId(h),
    unitId: unit.id,
    sourceObject: unit.ownerSystemTitle,
    sourceVersion: unit.sourceVersion,
    title: unit.ownerSystemTitle,
    attribution: `${unit.creatorHandle} — ${unit.ownerSystemTitle}`,
    sourceType: unit.provenanceSourceType,
    exactExcerpt: unit.displayText,
    locale: unit.effectiveLocale.sourceLocale,
    translationStatus: representationStatus(h),
    reviewStatus: unit.reviewStatus,
    applicability: unit.applicability,
    limitations: unit.limitations,
    link: unit.publicHref ?? unit.studioHref,
  };
}

function representationStatus(h: EvidenceHit): string {
  const rep = h.representation;
  if (rep.kind === "original") {
    return rep.fellBackToOriginal ? "original (fallback; no approved translation)" : "original";
  }
  return `${rep.locale} translation — ${rep.effectiveStatus ?? "unknown"}${rep.approvedByCreator ? " (approved)" : " (not creator-approved)"}`;
}

function buildEscalation(
  risk: GuidanceRisk,
  highStakes: boolean,
  hasEligibleAuthority: boolean,
): EscalationDirective {
  const type = ESCALATION_BY_RISK[risk];
  const reason =
    !highStakes
      ? ""
      : hasEligibleAuthority
        ? `A reviewed reference exists, but it is general information — not a substitute for individualized ${risk} guidance.`
        : `No eligible authoritative source supports guidance for this ${risk} question.`;
  return {
    type,
    riskCategory: risk,
    reason,
    requiredWording: ESCALATION_WORDING[risk],
    householdExamplesAllowed: true,
    prescriptiveAnswerPointsProhibited:
      (highStakes && !hasEligibleAuthority) || risk === "safety-critical",
  };
}

function decideDisposition(a: {
  risk: GuidanceRisk;
  highStakes: boolean;
  coverage: EvidencePacket["coverage"];
  hitCount: number;
  hasEligibleAuthority: boolean;
  conflictsPresent: boolean;
}): Disposition {
  if (a.hitCount === 0 || a.coverage === "insufficient") {
    return "abstain-insufficient-evidence";
  }
  if (a.conflictsPresent) return "conflicted-guidance";
  if (a.highStakes) {
    if (a.hasEligibleAuthority) return "supported-guidance";
    if (a.risk === "safety-critical") return "escalate-to-qualified-professional";
    return "abstain-authoritative-support-required";
  }
  return a.coverage === "sufficient-for-household-exploration"
    ? "household-exploration"
    : "qualified-household-exploration";
}

function buildQualifications(a: {
  packet: EvidencePacket;
  request: AnswerRequest;
  permittedAnswerPoints: AnswerPoint[];
  authoritativePoints: AnswerPoint[];
  conflictsPresent: boolean;
  hasEligibleAuthority: boolean;
  highStakes: boolean;
  labelByHitId: Map<string, string>;
  hitByHitId: Map<string, EvidenceHit>;
  raw: { hitId: string; cited: boolean }[];
}): Qualification[] {
  const q: Qualification[] = [];
  const push = (
    kind: Qualification["kind"],
    text: string,
    mandatory: boolean,
    citationIds: string[] = [],
  ) => {
    if (text.trim()) q.push({ kind, text, mandatory, citationIds });
  };

  // creator + curated limitations (source-backed, mandatory)
  for (const h of a.packet.hits) {
    const label = a.labelByHitId.get(`hit:${h.rank}:${h.unit.id}`);
    const cites = label ? [label] : [];
    if (h.unit.kind === "curated-claim" && h.unit.claim) {
      if (h.authoritativeEligibility?.eligible) {
        push("curated-limitation", h.unit.claim.limitations, true, cites);
        for (const ex of h.unit.claim.exclusions) push("exclusion", ex, true, cites);
        if (h.unit.claim.jurisdiction)
          push("jurisdiction-limit", `Applies within jurisdiction: ${h.unit.claim.jurisdiction}.`, true, cites);
        if (h.unit.claim.developmentalApplicability)
          push("developmental-applicability", `Developmental applicability: ${h.unit.claim.developmentalApplicability}.`, true, cites);
      }
    } else if (h.unit.limitations) {
      push("creator-limitation", h.unit.limitations, true, cites);
    }
  }

  // translation cautions
  if (a.packet.localeSummary.unapprovedOrStalePresent) {
    push("stale-or-unapproved-translation",
      "A translation exists that is unapproved or stale; it was not served as approved, and the original remains authoritative. Language equivalence is not claimed.",
      true);
  }
  for (const note of a.packet.localeSummary.notes) push("translation-caution", note, true);

  // conflicts
  if (a.conflictsPresent) {
    push("unresolved-conflict",
      "An unresolved conflict exists among matched material; neither position may be presented as uncontested.",
      true);
  }

  // missing authority / coverage
  if (a.highStakes && !a.hasEligibleAuthority) {
    push("missing-authority",
      `No eligible authoritative source supports guidance for this ${a.request.guidanceRisk} question.`,
      true);
  }
  if (a.packet.coverage === "partial") {
    push("incomplete-coverage", "Coverage is partial; matched material may not fully address the question.", true);
  }

  // household circumstances (context; not mandatory)
  for (const c of a.request.householdCircumstances ?? []) {
    push("household-circumstance", `Interpreted for the supplied circumstance: ${c}.`, false);
  }

  return q;
}

function buildProhibitions(a: {
  packet: EvidencePacket;
  risk: GuidanceRisk;
  highStakes: boolean;
  hasEligibleAuthority: boolean;
  conflictsPresent: boolean;
  disposition: Disposition;
  hasCreatorPoints: boolean;
  hasTranslation: boolean;
  hasInference: boolean;
  hasCuratedClaim: boolean;
  hasLimitations: boolean;
}): ProhibitedAssertion[] {
  const p: ProhibitedAssertion[] = [];
  const add = (code: string, text: string) => p.push({ code, text });

  // Always-on epistemic guards.
  add("no-universal-applicability", "Do not claim this applies universally, everywhere, or forever.");
  add("no-score-as-truth", "Do not imply that retrieval score, rank, or match strength measures truth.");
  add("no-affiliate-epistemic", "Do not convert an affiliate-linked or retailer preference into an epistemically superior recommendation.");
  add("no-child-character-judgment", "Do not tell a parent that the platform has judged a child's character, readiness, or competence.");

  if (a.risk === "medical" || a.risk === "mental-health")
    add("no-diagnose", "Do not diagnose, or imply a diagnosis, for any individual.");
  if (a.risk === "legal")
    add("no-legal-conclusion", "Do not state an individualized legal conclusion.");
  if (a.hasCreatorPoints)
    add("no-experience-as-professional", "Do not present lived household experience as professional or authoritative guidance.");
  if (a.hasTranslation) {
    add("no-translation-approval-implied", "Do not imply a machine or unapproved translation was creator-approved.");
    add("no-exact-translation-equivalence", "Do not claim exact equivalence between a translation and the original.");
  }
  if (a.hasLimitations)
    add("no-omit-limitations", "Do not omit material limitations, exclusions, or applicability bounds.");
  if (a.conflictsPresent)
    add("no-omit-conflicts", "Do not omit unresolved conflicts or present one contested side as settled.");
  if (a.hasCuratedClaim)
    add("no-authority-outside-scope", "Do not claim a publisher is authoritative outside its assessed domain, jurisdiction, audience, date, or risk scope.");
  if (a.hasInference)
    add("no-inference-as-direct", "Do not represent an editorial inference as a direct source statement.");
  if (
    a.disposition === "abstain-insufficient-evidence" ||
    a.disposition === "abstain-authoritative-support-required" ||
    a.disposition === "escalate-to-qualified-professional"
  )
    add("no-absence-as-proof", "Do not imply that insufficient evidence proves the opposite proposition.");
  if (a.highStakes && !a.hasEligibleAuthority)
    add("no-unsupported-high-stakes-prescription", `Do not issue prescriptive ${a.risk} guidance without an eligible authoritative source.`);

  return p;
}

function dedupeExact(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}
