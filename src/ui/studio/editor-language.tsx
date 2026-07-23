"use client";

import type { MeasurementSystem } from "@/domain/i18n";
import { DEFAULT_LOCALE, localeLabel, localeNames } from "@/domain/i18n";
import {
  effectiveTranslationStatus,
  translationStatusLabels,
} from "@/domain/translation";
import type { WorkspaceSystem } from "@/domain/workspace";
import { getTranslationsForSystem } from "@/data";
import { translationAdapter } from "@/adapters/translation";
import { copy, fmt } from "@/i18n";
import { Field, SectionCard, Select, TextArea, TextInput } from "./fields";

type Update = (fn: (ws: WorkspaceSystem) => void) => void;

/**
 * Language & translations (Phase 3). The creator declares what language the
 * system is written in; existing translation records are shown with full
 * provenance and honest staleness. There is deliberately NO translate
 * button — the adapter is not connected, and the panel says so.
 */
export function LanguagePanel({ ws, update }: { ws: WorkspaceSystem; update: Update }) {
  const locale = ws.system.locale ?? DEFAULT_LOCALE;
  const L = copy.language;

  const setLocale = (patch: Partial<typeof locale>) =>
    update((d) => {
      d.system.locale = { ...(d.system.locale ?? DEFAULT_LOCALE), ...patch };
    });

  const translations = getTranslationsForSystem(ws.system.slug);

  return (
    <SectionCard
      title="Language & translations"
      intro="Readers — and future translations — always know which words are originally yours, and in what language you said them."
    >
      {/* The original marker — creator sees this IS the source of truth */}
      <p className="rounded-xl bg-sage-soft/60 p-3 text-sm font-semibold text-sage-deep">
        ✓ {fmt(L.originalBadge, { language: localeLabel(locale) })}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={L.sourceLanguageLabel} hint={L.sourceLanguageHint} htmlFor="lang-source">
          <Select
            id="lang-source"
            value={locale.sourceLocale}
            onChange={(v) => setLocale({ sourceLocale: v })}
            options={Object.entries(localeNames).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Field>
        <Field label={L.regionLabel} htmlFor="lang-region">
          <TextInput
            id="lang-region"
            value={locale.region ?? ""}
            onChange={(e) => setLocale({ region: e.target.value })}
            placeholder="US"
            maxLength={8}
          />
        </Field>
        <Field label={L.measurementLabel} htmlFor="lang-measure">
          <Select
            id="lang-measure"
            value={locale.measurementSystem ?? "us-customary"}
            onChange={(v) => setLocale({ measurementSystem: v as MeasurementSystem })}
            options={[
              { value: "us-customary", label: L.measurementUs },
              { value: "metric", label: L.measurementMetric },
              { value: "mixed", label: L.measurementMixed },
            ]}
          />
        </Field>
      </div>

      <Field
        label={L.culturalContextLabel}
        hint={L.culturalContextHint}
        htmlFor="lang-cultural"
      >
        <TextArea
          id="lang-cultural"
          rows={2}
          value={locale.culturalContext ?? ""}
          onChange={(e) => setLocale({ culturalContext: e.target.value })}
          placeholder="Assumes US grocery labeling law and US store brands…"
        />
      </Field>

      {/* Translations — records shown honestly; nothing generates them */}
      <div className="border-t border-ink/10 pt-4">
        <p className="font-display text-lg font-extrabold">{L.translationsHeading}</p>
        <p className="mt-1 rounded-xl border border-ink/15 bg-cream p-3 text-xs text-ink-soft">
          {L.translationsNotConnected}{" "}
          <span className="font-semibold">({translationAdapter.publicNote})</span>
        </p>

        {translations.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            No translation records exist for this system yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {translations.map((t) => {
              const eff = effectiveTranslationStatus(t, ws.system.version);
              const stale = eff === "stale";
              return (
                <li key={t.id} className="rounded-xl border border-ink/15 bg-paper p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-extrabold">
                      {localeNames[t.targetLocale] ?? t.targetLocale}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                        stale
                          ? "border-tomato/50 bg-cream text-tomato-deep"
                          : "border-mustard bg-mustard-soft text-ink"
                      }`}
                    >
                      {translationStatusLabels[eff]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-ink-soft">
                    {stale
                      ? fmt(L.staleNote, {
                          sourceVersion: t.sourceVersion,
                          currentVersion: ws.system.version,
                        })
                      : fmt(L.currentNote, { sourceVersion: t.sourceVersion })}{" "}
                    · {t.attribution}
                  </p>
                  {t.content.title && (
                    <p className="mt-2 border-l-4 border-ink/20 pl-3 text-sm italic text-ink-soft">
                      “{t.content.title}” — translated text, not your words.
                    </p>
                  )}
                  {t.cautionNotes && t.cautionNotes.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-ink-soft">
                      {t.cautionNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}
