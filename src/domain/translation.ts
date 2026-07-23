/**
 * Translation records (Phase 3) — linked derivatives of creator content.
 *
 * Hard rules, structural by design:
 *  - A translation NEVER replaces or mutates its source. It is a separate
 *    record pointing at a source object + version.
 *  - A translation is never presented as the creator's original words: every
 *    record carries status, method, and attribution, and the selectors below
 *    always return provenance alongside content.
 *  - When the source changes (version bump), linked translations become
 *    stale — derivable at read time via `effectiveTranslationStatus`, so no
 *    background job is required for honesty.
 *
 * This phase stores and displays records. It does NOT generate translations —
 * see src/adapters/translation.ts for the (placeholder) generation boundary.
 */

export type TranslatableType =
  | "system"
  | "list"
  | "story-section"
  | "routine"
  | "recipe"
  | "creator-note";

export interface TranslatableRef {
  type: TranslatableType;
  id: string; // slug or generated id of the source object
}

export type TranslationStatus =
  | "machine-draft"
  | "human-draft"
  | "creator-approved"
  | "reviewed"
  | "stale";

export type TranslationMethod = "machine" | "human" | "hybrid";

/**
 * Translated fields for a household system. Partial by design: a record may
 * translate only the public-facing surface. Untranslated fields fall back to
 * the original WITH provenance, never silently.
 */
export interface TranslatedSystemFields {
  title?: string;
  promise?: string;
  problem?: string;
  audience?: string;
  limitations?: string;
  storySections?: { heading: string; body: string }[];
}

export interface TranslationRecord {
  id: string;
  source: TranslatableRef;
  sourceLocale: string; // language the original was written in
  targetLocale: string;
  content: TranslatedSystemFields;
  status: TranslationStatus;
  method: TranslationMethod;
  /** Who/what produced this — person, provider, or honest "seeded demo". */
  attribution: string;
  /** The source version this translation was made from. */
  sourceVersion: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  reviewNotes?: string;
  /** Confidence / caution — reasons a reader should not over-trust this. */
  cautionNotes?: string[];
}

// -------------------------------------------------------------- selectors

/** Stale = the source moved on since this translation was made. */
export function isStale(
  record: TranslationRecord,
  currentSourceVersion: number,
): boolean {
  return record.sourceVersion < currentSourceVersion;
}

/**
 * Status with staleness derived at read time. A stored "creator-approved"
 * that lags the source is reported stale — approval doesn't time-travel.
 */
export function effectiveTranslationStatus(
  record: TranslationRecord,
  currentSourceVersion: number,
): TranslationStatus {
  if (record.status === "stale") return "stale";
  return isStale(record, currentSourceVersion) ? "stale" : record.status;
}

export const translationStatusLabels: Record<TranslationStatus, string> = {
  "machine-draft": "Machine draft — not reviewed by a person",
  "human-draft": "Human draft — awaiting creator approval",
  "creator-approved": "Approved by the creator",
  reviewed: "Reviewed",
  stale: "Stale — the original has changed since this translation was made",
};

export function isCreatorApproved(
  record: TranslationRecord,
  currentSourceVersion: number,
): boolean {
  const s = effectiveTranslationStatus(record, currentSourceVersion);
  return s === "creator-approved" || s === "reviewed";
}

// ------------------------------------------- best-representation selection

export interface RepresentationChoice {
  kind: "original" | "translation";
  /** Language actually being served. */
  locale: string;
  /** True only for reviewed/creator-approved, non-stale translations. */
  approvedByCreator: boolean;
  record?: TranslationRecord;
  effectiveStatus?: TranslationStatus;
  /**
   * Human provenance sentence that MUST travel with the content wherever it
   * is rendered. Semantic closeness, never claimed exact equivalence.
   */
  provenanceNote: string;
  /** True when the requested locale had nothing usable and we fell back. */
  fellBackToOriginal: boolean;
}

const statusWeight: Record<TranslationStatus, number> = {
  "creator-approved": 4,
  reviewed: 3,
  "human-draft": 2,
  "machine-draft": 1,
  stale: 0,
};

/**
 * Pick the best available representation for a requested locale — future
 * search/assistant retrieval calls this so it can serve translated content
 * WITHOUT losing provenance or pretending equivalence.
 *
 * Ranking within the requested language: fresher and more-reviewed wins;
 * staleness is a heavy penalty but a stale creator-approved translation
 * still outranks a fresh machine draft (a human once verified meaning).
 */
export function bestRepresentationForLocale(args: {
  requestedLocale: string;
  sourceLocale: string;
  currentSourceVersion: number;
  translations: TranslationRecord[];
}): RepresentationChoice {
  const want = args.requestedLocale.split("-")[0].toLowerCase();
  const have = args.sourceLocale.split("-")[0].toLowerCase();

  if (want === have) {
    return {
      kind: "original",
      locale: args.sourceLocale,
      approvedByCreator: true,
      provenanceNote: "Original — the creator's own words.",
      fellBackToOriginal: false,
    };
  }

  const candidates = args.translations
    .filter((t) => t.targetLocale.split("-")[0].toLowerCase() === want)
    .map((t) => {
      const eff = effectiveTranslationStatus(t, args.currentSourceVersion);
      const stale = eff === "stale";
      // Base rank from the stored review level, minus a staleness penalty
      // that drops it below same-level fresh records and below fresh
      // human review, but keeps stale-approved above fresh machine drafts.
      const base = statusWeight[t.status === "stale" ? "machine-draft" : t.status];
      const rank = stale ? base - 2.5 : base;
      return { t, eff, rank };
    })
    .sort((a, b) => b.rank - a.rank);

  const best = candidates[0];
  if (!best) {
    return {
      kind: "original",
      locale: args.sourceLocale,
      approvedByCreator: true,
      provenanceNote:
        "No translation exists for the requested language yet — showing the original.",
      fellBackToOriginal: true,
    };
  }

  const approved =
    best.eff === "creator-approved" || best.eff === "reviewed";
  return {
    kind: "translation",
    locale: best.t.targetLocale,
    approvedByCreator: approved,
    record: best.t,
    effectiveStatus: best.eff,
    provenanceNote: approved
      ? `Translation approved by the creator (from v${best.t.sourceVersion} of the original). Meaning is close, not word-identical.`
      : `${translationStatusLabels[best.eff]}. The original (${args.sourceLocale}) remains the authoritative version.`,
    fellBackToOriginal: false,
  };
}
