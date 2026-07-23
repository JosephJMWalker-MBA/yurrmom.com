/**
 * Deterministic in-memory retrieval (Phase 4).
 *
 * Transparent, reproducible ranking over projected KnowledgeUnits. No external
 * dependency, no randomness, no learned model. The same query over the same
 * corpus always produces the identical EvidencePacket (ordering included).
 *
 * The output is an EvidencePacket — EVIDENCE, not an answer. Match score is a
 * retrieval signal, never a truth claim. Nothing here invents a statement the
 * canonical source did not make.
 *
 * ─────────────────────────────── Ranking weights ──────────────────────────
 * Each query field contributes independently; contributions sum to a score.
 * Commerce (retailer, affiliate, price, availability) contributes NOTHING —
 * it is not present in a KnowledgeUnit, so it structurally cannot.
 *
 *   exact-phrase (whole normalized query appears in unit)      +6.0
 *   distinct query token present in unit index                 +1.0 each
 *   household-domain filter matches unit domain facet          +2.5
 *   developmental-stage filter matches unit facet              +2.5
 *   each household-circumstance filter matches unit            +2.0
 *   each constraint filter matches unit constraint facet       +2.0
 *   task/skill filter matches unit skill/task facet or tokens  +2.5
 *   requested system scope == unit.ownerSystemSlug             +3.0
 *   requested creator scope == unit.creatorHandle              +3.0
 *
 * Ordering: score DESC, then unit.id ASC (lexicographic) as a fully
 * deterministic tiebreak. Units with a zero score are dropped.
 * ───────────────────────────────────────────────────────────────────────────
 */
import type { SourceType } from "../types";
import type { TranslationRecord } from "../translation";
import { languageOf, localeLabel, localeNames } from "../i18n";
import { resolveRepresentation } from "./representation";
import { normalizeText, tokenize } from "./text";
import type { KnowledgeUnit } from "./unit";
import {
  HIGH_STAKES_RISKS,
  type CoverageStatus,
  type EvidenceHit,
  type EvidencePacket,
  type KnowledgeQuery,
  type NormalizedQuery,
} from "./query";

const W_EXACT_PHRASE = 6.0;
const W_TOKEN = 1.0;
const W_DOMAIN = 2.5;
const W_DEV_STAGE = 2.5;
const W_CIRCUMSTANCE = 2.0;
const W_CONSTRAINT = 2.0;
const W_TASK_SKILL = 2.5;
const W_SCOPE = 3.0;

/** A single strong hit clears this → "sufficient-for-household-exploration". */
const STRONG_SCORE = 4.0;

const ALL_SOURCE_TYPES: SourceType[] = [
  "personal-experience",
  "professional-guidance",
  "sourced-reference",
  "community-adaptation",
  "translated-derivative",
  "platform-synthesis",
  "ai-assisted-draft",
];

/** Source types that can carry authoritative guidance for high-stakes queries. */
const AUTHORITATIVE_TYPES: SourceType[] = [
  "sourced-reference",
  "professional-guidance",
];

const RISK_LABEL: Record<string, string> = {
  medical: "medical",
  developmental: "developmental",
  "mental-health": "mental-health",
  legal: "legal",
  "safety-critical": "safety-critical",
  "ordinary-household": "ordinary household",
};

function facetValues(unit: KnowledgeUnit, key: string): string[] {
  return unit.facets.filter((f) => f.key === key).map((f) => f.value);
}

function anyFacetMatches(
  unit: KnowledgeUnit,
  keys: string[],
  needleTokens: Set<string>,
): boolean {
  for (const f of unit.facets) {
    if (!keys.includes(f.key)) continue;
    const facetToks = new Set(tokenize(f.value));
    for (const t of needleTokens) if (facetToks.has(t)) return true;
  }
  return false;
}

function normalizeQuery(q: KnowledgeQuery): NormalizedQuery {
  return {
    text: q.text.trim(),
    tokens: tokenize(q.text),
    requestedLocale: q.requestedLocale,
    householdCircumstances: (q.householdCircumstances ?? []).filter(Boolean),
    developmentalStage: q.developmentalStage?.trim() || undefined,
    householdDomain: q.householdDomain?.trim() || undefined,
    constraints: (q.constraints ?? []).filter(Boolean),
    taskOrSkill: q.taskOrSkill?.trim() || undefined,
    sourceTypeFilters: q.sourceTypeFilters ?? [],
    systemScope: q.systemScope || undefined,
    creatorScope: q.creatorScope || undefined,
  };
}

interface Scored {
  unit: KnowledgeUnit;
  score: number;
  reasons: string[];
}

function scoreUnit(unit: KnowledgeUnit, nq: NormalizedQuery): Scored {
  let score = 0;
  const reasons: string[] = [];
  const unitTokens = new Set(unit.indexTokens);

  // Exact phrase (whole query text present as a substring of the index)
  const phrase = normalizeText(nq.text);
  if (phrase.length > 0 && unit.indexText.includes(phrase)) {
    score += W_EXACT_PHRASE;
    reasons.push(`Exact phrase match on "${phrase}"`);
  }

  // Distinct query-token overlap
  const matched: string[] = [];
  for (const t of new Set(nq.tokens)) if (unitTokens.has(t)) matched.push(t);
  if (matched.length > 0) {
    score += matched.length * W_TOKEN;
    matched.sort();
    reasons.push(`Matched ${matched.length} query term(s): ${matched.join(", ")}`);
  }

  // Domain filter
  if (nq.householdDomain) {
    const needle = new Set(tokenize(nq.householdDomain));
    if (anyFacetMatches(unit, ["household-domain"], needle)) {
      score += W_DOMAIN;
      reasons.push(`Matches household domain: ${nq.householdDomain}`);
    }
  }

  // Developmental stage
  if (nq.developmentalStage) {
    const needle = new Set(tokenize(nq.developmentalStage));
    if (anyFacetMatches(unit, ["developmental-stage"], needle)) {
      score += W_DEV_STAGE;
      reasons.push(`Matches developmental stage: ${nq.developmentalStage}`);
    }
  }

  // Household circumstances
  for (const c of nq.householdCircumstances) {
    const needle = new Set(tokenize(c));
    if (anyFacetMatches(unit, ["household-circumstance"], needle)) {
      score += W_CIRCUMSTANCE;
      reasons.push(`Matches household circumstance: ${c}`);
    }
  }

  // Constraints
  for (const c of nq.constraints) {
    const needle = new Set(tokenize(c));
    if (anyFacetMatches(unit, ["constraint"], needle)) {
      score += W_CONSTRAINT;
      reasons.push(`Matches constraint: ${c}`);
    }
  }

  // Task or skill (facet or plain token overlap)
  if (nq.taskOrSkill) {
    const needle = new Set(tokenize(nq.taskOrSkill));
    const facetHit = anyFacetMatches(unit, ["task", "skill-taught", "purpose"], needle);
    const tokenHit = [...needle].some((t) => unitTokens.has(t));
    if (facetHit || tokenHit) {
      score += W_TASK_SKILL;
      reasons.push(`Matches task/skill: ${nq.taskOrSkill}`);
    }
  }

  // Scope boosts
  if (nq.systemScope && unit.ownerSystemSlug === nq.systemScope) {
    score += W_SCOPE;
    reasons.push(`Within requested system scope: ${nq.systemScope}`);
  }
  if (nq.creatorScope && unit.creatorHandle === nq.creatorScope) {
    score += W_SCOPE;
    reasons.push(`Within requested creator scope: ${nq.creatorScope}`);
  }

  return { unit, score, reasons };
}

/**
 * Run deterministic retrieval and assemble an EvidencePacket.
 *
 * @param query      the caller-supplied query (context only, never inferred)
 * @param corpus     projected KnowledgeUnits (read-only; never mutated)
 * @param translations  all translation records (grouped by source system here)
 * @param limit      max hits to return (default 12)
 */
export function retrieve(
  query: KnowledgeQuery,
  corpus: readonly KnowledgeUnit[],
  translations: readonly TranslationRecord[],
  limit = 12,
): EvidencePacket {
  const nq = normalizeQuery(query);

  // Hard source-type filter (does not affect scores; just eligibility).
  const eligible = corpus.filter(
    (u) =>
      nq.sourceTypeFilters.length === 0 ||
      nq.sourceTypeFilters.includes(u.provenanceSourceType),
  );

  const scored = eligible
    .map((u) => scoreUnit(u, nq))
    .filter((s) => s.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.unit.id < b.unit.id ? -1 : a.unit.id > b.unit.id ? 1 : 0;
    })
    .slice(0, limit);

  // Per-system representation resolution (translations are per system).
  const translationsBySystem = new Map<string, TranslationRecord[]>();
  for (const t of translations) {
    if (t.source.type !== "system") continue;
    const arr = translationsBySystem.get(t.source.id) ?? [];
    arr.push(t);
    translationsBySystem.set(t.source.id, arr);
  }

  const highStakes = HIGH_STAKES_RISKS.includes(query.guidanceRisk);
  let approvedTranslationAvailable = false;
  let unapprovedOrStalePresent = false;
  const localeNotes = new Set<string>();

  const hits: EvidenceHit[] = scored.map((s, i) => {
    const resolved = resolveRepresentation({
      policy: query.representationPolicy,
      requestedLocale: nq.requestedLocale,
      system: {
        slug: s.unit.ownerSystemSlug,
        version: s.unit.sourceVersion,
        locale: s.unit.sourceLocale,
      },
      translations: translationsBySystem.get(s.unit.ownerSystemSlug) ?? [],
    });
    const rep = resolved.representation;
    if (rep.kind === "translation" && rep.approvedByCreator)
      approvedTranslationAvailable = true;
    if (resolved.withheldDraft || (rep.kind === "translation" && !rep.approvedByCreator))
      unapprovedOrStalePresent = true;
    resolved.notes.forEach((n) => localeNotes.add(n));

    const warnings: string[] = [];
    // Derivative honesty: a translated/generated segment is never the creator's
    // own words. (Projected units are original, but this guards future kinds.)
    if (s.unit.derivation !== "original") {
      warnings.push(
        `This segment is ${s.unit.derivation}, not the creator's original words.`,
      );
    }
    // High-stakes labeling of lived experience.
    if (highStakes && !AUTHORITATIVE_TYPES.includes(s.unit.provenanceSourceType)) {
      warnings.push(
        `Lived household experience, clearly labeled — not authoritative ${RISK_LABEL[query.guidanceRisk]} guidance.`,
      );
    }

    const localeStatus =
      rep.kind === "original"
        ? rep.fellBackToOriginal
          ? `Served as the original (${localeLabel(s.unit.sourceLocale)}); ${rep.provenanceNote}`
          : `Original (${localeLabel(s.unit.sourceLocale)})`
        : `${localeNames[languageOf(rep.locale)] ?? rep.locale} translation — ${rep.provenanceNote}`;

    return {
      rank: i + 1,
      score: Math.round(s.score * 100) / 100,
      unit: s.unit,
      reasons: s.reasons,
      representation: rep,
      localeStatus,
      warnings,
    };
  });

  // Source-type summary
  const sourceTypeSummary: Partial<Record<SourceType, number>> = {};
  for (const st of ALL_SOURCE_TYPES) {
    const n = hits.filter((h) => h.unit.provenanceSourceType === st).length;
    if (n > 0) sourceTypeSummary[st] = n;
  }

  // Aggregate stated limitations (deduped, source-backed).
  const limitations = Array.from(
    new Set(
      hits
        .map((h) => h.unit.limitations)
        .filter((x): x is string => Boolean(x)),
    ),
  );

  // Coverage verdict.
  const hasApplicableAuthoritative = hits.some((h) =>
    AUTHORITATIVE_TYPES.includes(h.unit.provenanceSourceType),
  );
  let coverage: CoverageStatus;
  let insufficientSupportReason: string | undefined;
  const warnings: string[] = [];

  if (hits.length === 0) {
    coverage = "insufficient";
    insufficientSupportReason =
      "No source-backed material matched this query.";
  } else if (highStakes && !hasApplicableAuthoritative) {
    coverage = "authoritative-support-required";
    insufficientSupportReason = `This is a ${RISK_LABEL[query.guidanceRisk]} question. The matched material is lived household experience, not authoritative ${RISK_LABEL[query.guidanceRisk]} guidance, and no applicable authoritative reference exists in the corpus. Absence of evidence is reported as insufficiency, not turned into advice.`;
    warnings.push(
      `Guidance risk "${query.guidanceRisk}": experience may inform, but cannot substitute for authoritative ${RISK_LABEL[query.guidanceRisk]} guidance.`,
    );
  } else {
    const strong = hits.some((h) => h.score >= STRONG_SCORE);
    coverage = strong ? "sufficient-for-household-exploration" : "partial";
  }

  if (unapprovedOrStalePresent && query.representationPolicy === "public-safe") {
    warnings.push(
      "An unapproved or stale translation exists for a matched system but was withheld under public-safe policy; the original remains authoritative.",
    );
  }

  const primaryHit = hits[0];
  const servedPrimarilyAs = primaryHit
    ? primaryHit.representation.kind === "original"
      ? `original (${localeLabel(primaryHit.unit.sourceLocale)})`
      : `${localeNames[languageOf(primaryHit.representation.locale)] ?? primaryHit.representation.locale} translation`
    : "—";

  return {
    query: nq,
    mode: query.representationPolicy,
    requestedLocale: nq.requestedLocale,
    guidanceRisk: query.guidanceRisk,
    hits,
    sourceTypeSummary,
    localeSummary: {
      requestedLocale: nq.requestedLocale,
      servedPrimarilyAs,
      approvedTranslationAvailable,
      unapprovedOrStalePresent,
      notes: Array.from(localeNotes),
    },
    coverage,
    warnings,
    limitations,
    insufficientSupportReason,
  };
}

export { facetValues };
