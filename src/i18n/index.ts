/**
 * Interface-copy access layer (Phase 3). Deliberately tiny — no i18n
 * dependency until the platform actually needs plural rules or ICU syntax.
 *
 * `UICopy` is derived from the English dictionary, so a future locale file
 * must provide every key English has: missing translations fail typecheck,
 * not production.
 */
import { en } from "./en";

export type UICopy = typeof en;

const dictionaries: Record<string, UICopy> = { en };

/**
 * Honest resolution: English is the only interface language that exists in
 * this phase, and any request resolves to it. When a second dictionary
 * lands, this function (and nothing else) learns about it.
 */
export function getCopy(locale = "en"): UICopy {
  const lang = locale.split("-")[0].toLowerCase();
  return dictionaries[lang] ?? dictionaries.en;
}

/** Fill {placeholders}: fmt("Saved · {time}", { time: "12:03" }). */
export function fmt(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

/** Default copy for the current build — server and client safe. */
export const copy = getCopy();
