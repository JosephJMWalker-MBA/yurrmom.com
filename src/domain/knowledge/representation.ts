/**
 * Representation policy (Phase 4) — a thin policy layer OVER the Phase 3
 * translation selectors. It does not reimplement selection and it never
 * mutates a TranslationRecord; it only decides, per retrieval mode, whether a
 * candidate representation may be served as the primary one.
 *
 * public-safe: original, or a CURRENT creator-approved / reviewed translation.
 *   Machine drafts, human drafts, and stale translations are NOT served as
 *   primary — retrieval falls back to the original, keeps its real locale,
 *   and states that no approved translation is available. Equivalence is
 *   never claimed.
 *
 * editorial-inspection: may surface machine/human/stale translations, but
 *   always with actual status, attribution, source version, and cautions.
 */
import type { HouseholdSystem } from "../types";
import type { RepresentationChoice, TranslationRecord } from "../translation";
import {
  bestRepresentationForLocale,
  effectiveTranslationStatus,
  translationStatusLabels,
} from "../translation";
import { languageOf, localeNames } from "../i18n";

export type RepresentationPolicy = "public-safe" | "editorial-inspection";

export interface ResolvedRepresentation {
  policy: RepresentationPolicy;
  representation: RepresentationChoice;
  /**
   * A translation that EXISTS for the requested locale but was withheld as
   * primary under public-safe policy (draft or stale). Surfaced for honesty:
   * the packet can report it exists without serving it.
   */
  withheldDraft?: {
    record: TranslationRecord;
    effectiveStatus: string;
  };
  notes: string[];
}

function localeName(locale: string): string {
  return localeNames[languageOf(locale)] ?? locale;
}

export function resolveRepresentation(args: {
  policy: RepresentationPolicy;
  requestedLocale: string;
  system: Pick<HouseholdSystem, "slug" | "version" | "locale">;
  translations: TranslationRecord[];
}): ResolvedRepresentation {
  const sourceLocale = args.system.locale?.sourceLocale ?? "en";
  const base = bestRepresentationForLocale({
    requestedLocale: args.requestedLocale,
    sourceLocale,
    currentSourceVersion: args.system.version,
    translations: args.translations,
  });

  // Original, or already an approved/reviewed current translation: serve as-is
  // in both modes.
  if (base.kind === "original" || base.approvedByCreator) {
    return { policy: args.policy, representation: base, notes: [] };
  }

  // base is a translation that is NOT creator-approved (machine/human draft,
  // or stale). Behavior diverges by policy.
  const record = base.record!;
  const eff = effectiveTranslationStatus(record, args.system.version);
  const lang = localeName(args.requestedLocale);

  if (args.policy === "editorial-inspection") {
    return {
      policy: args.policy,
      representation: base,
      notes: [
        `Editorial inspection: showing a ${lang} ${translationStatusLabels[eff]} with full provenance. The original (${localeName(sourceLocale)}) remains authoritative.`,
        ...(record.cautionNotes ?? []),
      ],
    };
  }

  // public-safe: withhold; fall back to the original, honestly.
  const fallback: RepresentationChoice = {
    kind: "original",
    locale: sourceLocale,
    approvedByCreator: true,
    provenanceNote: `No approved ${lang} translation is available. Showing the original ${localeName(sourceLocale)}. Equivalence between languages is not claimed.`,
    fellBackToOriginal: true,
  };
  return {
    policy: args.policy,
    representation: fallback,
    withheldDraft: { record, effectiveStatus: translationStatusLabels[eff] },
    notes: [
      `A ${lang} translation exists (${translationStatusLabels[eff]}) but public-safe mode does not serve unapproved or stale translations as the primary representation.`,
    ],
  };
}
