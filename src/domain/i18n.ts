/**
 * Locale metadata (Phase 3) — the language layer of household knowledge.
 *
 * Every piece of creator-authored content can carry LocaleMeta so a future
 * multilingual platform (search, assistant retrieval, translation review)
 * knows what language a thing was SAID in — without guessing. This phase adds
 * metadata and honest defaults only: no live translation, no routing, no
 * public language switcher.
 *
 * No framework imports belong in this module.
 */

export type MeasurementSystem = "us-customary" | "metric" | "mixed";

export interface LocaleMeta {
  /** BCP-47 language code the content was authored in, e.g. "en", "es". */
  sourceLocale: string;
  /** Optional region qualifier, e.g. "US", "MX". */
  region?: string;
  /** Which measurement conventions the content assumes. */
  measurementSystem?: MeasurementSystem;
  /**
   * Plain-language cultural/regional context a reader (or future translator)
   * should know — e.g. "assumes US grocery labeling law".
   */
  culturalContext?: string;
}

/**
 * Honest default for all pre-Phase-3 seeded content: it was written in
 * US English with US-customary measurements. Stated, not guessed.
 */
export const DEFAULT_LOCALE: LocaleMeta = {
  sourceLocale: "en",
  region: "US",
  measurementSystem: "us-customary",
};

/**
 * Child objects (story sections, list items, routine steps…) inherit their
 * parent's locale unless they explicitly carry their own. This keeps the
 * common case — a system written entirely in one language — free of
 * per-paragraph bookkeeping.
 */
export function effectiveLocale(
  own: LocaleMeta | undefined,
  parent?: LocaleMeta,
): LocaleMeta {
  return own ?? parent ?? DEFAULT_LOCALE;
}

/** Languages the UI can name today. Extending = adding a row, nothing else. */
export const localeNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  zh: "Chinese",
  ar: "Arabic",
};

export function localeLabel(meta: LocaleMeta): string {
  const lang = localeNames[meta.sourceLocale] ?? meta.sourceLocale;
  return meta.region ? `${lang} (${meta.region})` : lang;
}

/** "en-US" → "en"; tolerant of bare language codes. */
export function languageOf(locale: string): string {
  return locale.split("-")[0].toLowerCase();
}
