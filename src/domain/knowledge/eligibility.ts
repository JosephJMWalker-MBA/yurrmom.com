/**
 * Authoritative eligibility policy (Phase 5).
 *
 * Deterministic gate deciding whether a curated-claim unit may satisfy the
 * authoritative-support requirement of a high-stakes query. A `SourceType`
 * value ALONE is no longer enough (Phase 4 behavior removed): authority must
 * be an approved, current, in-scope, uncontested claim backed by exact
 * evidence with a complete citation.
 *
 * This function invents nothing. It reads the self-contained claim payload
 * (populated by the reference projection) and reports every check with a pass
 * flag and a human reason, so an EvidencePacket can explain WHY authoritative
 * support is or is not present.
 */
import { tokenize } from "./text";
import type { CuratedClaimUnitPayload } from "./unit";

export interface EligibilityContext {
  /** The query's guidance-risk category (supplied, never inferred). */
  risk: string;
  /** Domain text from the query (householdDomain), if any. */
  domain?: string;
  /** Query jurisdiction, if supplied. */
  jurisdiction?: string;
  /** Evaluation "now" — injected for deterministic testing. */
  now: Date;
}

export interface EligibilityCheck {
  key: string;
  label: string;
  pass: boolean;
  detail: string;
}

export interface EligibilityResult {
  eligible: boolean;
  checks: EligibilityCheck[];
  reasons: string[]; // failing reasons, human-readable
  warnings: string[]; // e.g. unresolved conflict
  sourceScope: string;
  queryScope: string;
}

function parseDate(iso?: string): number | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? undefined : t;
}

function overlapTokens(a: string[], bText: string): boolean {
  if (!bText.trim()) return false;
  const needle = new Set(tokenize(bText));
  if (needle.size === 0) return false;
  const hay = new Set(a.flatMap((v) => tokenize(v)));
  for (const t of needle) if (hay.has(t)) return true;
  return false;
}

/**
 * Evaluate whether a curated-claim payload is eligible authoritative support
 * for the given query context. Order of checks is stable and documented.
 */
export function evaluateAuthoritativeEligibility(
  claim: CuratedClaimUnitPayload,
  ctx: EligibilityContext,
): EligibilityResult {
  const checks: EligibilityCheck[] = [];
  const nowMs = ctx.now.getTime();
  const add = (key: string, label: string, pass: boolean, detail: string) =>
    checks.push({ key, label, pass, detail });

  // 1) Claim is approved (not draft/in-review/needs-revision/superseded/withdrawn)
  add(
    "approved",
    "Claim is approved",
    claim.claimStatus === "approved",
    `claim status = ${claim.claimStatus}`,
  );

  // 2) Not editorial inference (inference cannot independently satisfy)
  add(
    "not-inference",
    "Not editorial inference",
    claim.interpretationLevel !== "editorial-inference",
    `interpretation level = ${claim.interpretationLevel}`,
  );

  // 3) Supporting/defining evidence with a complete citation
  const supporting = claim.evidenceCitations.filter(
    (c) => (c.relation === "supports" || c.relation === "defines") && c.citationComplete,
  );
  add(
    "supported",
    "Has supporting evidence with a complete citation",
    supporting.length > 0,
    `${supporting.length} complete supporting/defining citation(s)`,
  );

  // 4) Source version is active (not superseded/withdrawn), source active too
  const versionActive =
    claim.sourceVersion.status === "active" && claim.sourceVersion.sourceStatus === "active";
  add(
    "active-version",
    "Comes from an active source version",
    versionActive,
    `version status = ${claim.sourceVersion.status}, source status = ${claim.sourceVersion.sourceStatus}`,
  );

  // 5) Authority assessment approved-for-scope and not expired
  const assessmentDue = parseDate(claim.assessment.reviewDueDate);
  const assessmentCurrent = assessmentDue === undefined || assessmentDue >= nowMs;
  const assessmentApproved = claim.assessment.status === "approved-for-scope";
  add(
    "assessment",
    "Has a current authority assessment (approved-for-scope, not expired)",
    assessmentApproved && assessmentCurrent,
    `status = ${claim.assessment.status}${assessmentCurrent ? "" : ", assessment expired"}`,
  );

  // 6) Claim currency: not past review-due; effective date reached
  const claimDue = parseDate(claim.reviewDueDate);
  const claimCurrent = claimDue === undefined || claimDue >= nowMs;
  const effective = parseDate(claim.effectiveDate);
  const effectiveReached = effective === undefined || effective <= nowMs;
  add(
    "currency",
    "Claim is current (not past re-review; effective date reached)",
    claimCurrent && effectiveReached,
    `${claimCurrent ? "" : "past review-due; "}${effectiveReached ? "" : "not yet effective"}`.trim() || "current",
  );

  // 7) Domain match — query domain must be within the ASSESSMENT's recognized
  // domains. A claim's self-declared subjectDomains cannot grant authority
  // scope; only the scoped assessment can.
  const recognized = claim.assessment.recognizedDomains;
  const domainMatch = ctx.domain ? overlapTokens(recognized, ctx.domain) : false;
  add(
    "domain",
    "Query domain is within the assessed authority scope",
    domainMatch,
    ctx.domain
      ? `query domain "${ctx.domain}" vs assessed scope [${recognized.join(", ")}]`
      : "no query domain supplied — cannot confirm domain scope",
  );

  // 8) Jurisdiction match — in recognized jurisdictions, or explicitly broad/global
  const recogJur = claim.assessment.recognizedJurisdictions.map((j) => j.toLowerCase());
  const declaresBroad = claim.applicabilityScope === "broad" || recogJur.includes("global");
  const jurMatch = ctx.jurisdiction
    ? recogJur.includes(ctx.jurisdiction.toLowerCase()) || declaresBroad
    : declaresBroad;
  add(
    "jurisdiction",
    "Jurisdiction matches or claim declares broader applicability",
    jurMatch,
    ctx.jurisdiction
      ? `query jurisdiction "${ctx.jurisdiction}" vs [${claim.assessment.recognizedJurisdictions.join(", ")}]${declaresBroad ? " (broad)" : ""}`
      : declaresBroad
        ? "no jurisdiction supplied; claim declares broad applicability"
        : "no jurisdiction supplied and claim is scoped — cannot assume applicability",
  );

  // 9) Risk-category match — assessment supports it AND claim declares it
  const riskMatch =
    claim.assessment.supportedRiskCategories.includes(ctx.risk) &&
    claim.riskCategories.includes(ctx.risk);
  add(
    "risk",
    "Supports the query's risk category",
    riskMatch,
    `risk "${ctx.risk}" — assessment supports: ${claim.assessment.supportedRiskCategories.includes(ctx.risk)}, claim declares: ${claim.riskCategories.includes(ctx.risk)}`,
  );

  // 10) No unresolved disqualifying conflict
  const unresolved = claim.conflicts.filter((c) => c.relation === "conflicts-with" && !c.resolved);
  add(
    "no-conflict",
    "No unresolved disqualifying conflict",
    unresolved.length === 0,
    unresolved.length === 0 ? "no unresolved conflicts" : `${unresolved.length} unresolved conflict(s)`,
  );

  const warnings: string[] = [];
  if (unresolved.length > 0) {
    warnings.push(
      `Claim "${claim.claimId}" has ${unresolved.length} unresolved conflict(s); it cannot be presented as uncontested.`,
    );
  }

  const eligible = checks.every((c) => c.pass);
  const reasons = checks.filter((c) => !c.pass).map((c) => `${c.label}: ${c.detail}`);

  return {
    eligible,
    checks,
    reasons,
    warnings,
    sourceScope: `${claim.sourceVersion.publisherName} — ${claim.sourceVersion.sourceTitle} (${claim.sourceVersion.label}); domains [${claim.assessment.recognizedDomains.join(", ")}]; jurisdictions [${claim.assessment.recognizedJurisdictions.join(", ")}]; risks [${claim.assessment.supportedRiskCategories.join(", ")}]`,
    queryScope: `risk ${ctx.risk}${ctx.domain ? `, domain "${ctx.domain}"` : ""}${ctx.jurisdiction ? `, jurisdiction "${ctx.jurisdiction}"` : ""}`,
  };
}
