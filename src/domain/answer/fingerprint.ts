/**
 * Deterministic fingerprints (Phase 6).
 *
 * Canonical, key-order-independent JSON + FNV-1a hash. Fingerprints are based
 * on stable content fields ONLY — never on timestamps and never on object
 * insertion order. A repeated request over an identical packet and policy must
 * produce an identical plan except for an explicitly injected `createdAt`.
 *
 * (A local 6-line FNV avoids a cross-layer import; the reference layer's hash
 * is intentionally not depended upon here.)
 */
import type { EvidencePacket } from "../knowledge";

export function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Recursively sort object keys so the string is independent of insertion order. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

/**
 * Canonical, content-only projection of an EvidencePacket. Excludes anything
 * volatile; captures exactly what a plan depends on so the fingerprint changes
 * iff the epistemic content changes. Commerce fields are structurally absent
 * from units, so they cannot enter the fingerprint (affiliate neutrality).
 */
export function canonicalPacket(packet: EvidencePacket): unknown {
  return {
    query: {
      text: packet.query.text,
      tokens: packet.query.tokens,
      requestedLocale: packet.query.requestedLocale,
      householdCircumstances: packet.query.householdCircumstances,
      developmentalStage: packet.query.developmentalStage ?? null,
      householdDomain: packet.query.householdDomain ?? null,
      constraints: packet.query.constraints,
      taskOrSkill: packet.query.taskOrSkill ?? null,
      jurisdiction: packet.query.jurisdiction ?? null,
      systemScope: packet.query.systemScope ?? null,
      creatorScope: packet.query.creatorScope ?? null,
    },
    mode: packet.mode,
    guidanceRisk: packet.guidanceRisk,
    coverage: packet.coverage,
    hits: packet.hits.map((h) => ({
      rank: h.rank,
      score: h.score,
      unitId: h.unit.id,
      kind: h.unit.kind,
      sourceType: h.unit.provenanceSourceType,
      displayText: h.unit.displayText,
      claimId: h.unit.claim?.claimId ?? null,
      claimStatus: h.unit.claim?.claimStatus ?? null,
      interpretationLevel: h.unit.claim?.interpretationLevel ?? null,
      representation: {
        kind: h.representation.kind,
        locale: h.representation.locale,
        approvedByCreator: h.representation.approvedByCreator,
        effectiveStatus: h.representation.effectiveStatus ?? null,
        fellBackToOriginal: h.representation.fellBackToOriginal,
      },
      eligible: h.authoritativeEligibility?.eligible ?? null,
    })),
    authoritativeSummary: packet.authoritativeSummary
      ? {
          required: packet.authoritativeSummary.required,
          present: packet.authoritativeSummary.present,
          eligibleClaimCount: packet.authoritativeSummary.eligibleClaimCount,
          conflictWarnings: packet.authoritativeSummary.conflictWarnings,
        }
      : null,
    localeSummary: {
      approvedTranslationAvailable: packet.localeSummary.approvedTranslationAvailable,
      unapprovedOrStalePresent: packet.localeSummary.unapprovedOrStalePresent,
    },
    limitations: packet.limitations,
    warnings: packet.warnings,
  };
}

export function fingerprintPacket(packet: EvidencePacket): string {
  return fnv1a(stableStringify(canonicalPacket(packet)));
}

/** Hash any content-only object canonically. */
export function fingerprint(content: unknown): string {
  return fnv1a(stableStringify(content));
}
