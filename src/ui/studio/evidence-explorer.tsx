"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  retrieve,
  type CoverageStatus,
  type EvidenceHit,
  type EvidencePacket,
  type GuidanceRisk,
  type KnowledgeQuery,
  type KnowledgeUnit,
  type RepresentationPolicy,
} from "@/domain/knowledge";
import { localeLabel, localeNames } from "@/domain/i18n";
import { knowledgeCorpus, knowledgeTranslations } from "@/data/knowledge-corpus";
import { evaluationCases } from "@/data/evaluation-cases";
import { copy } from "@/i18n";
import { Field, Select, TextInput } from "@/ui/studio/fields";

const L = copy.intelligence;

const localeOptions = ["en", "es"].map((v) => ({
  value: v,
  label: localeNames[v] ?? v,
}));

const riskOptions: { value: GuidanceRisk; label: string }[] = [
  { value: "ordinary-household", label: "Ordinary household" },
  { value: "medical", label: "Medical" },
  { value: "developmental", label: "Developmental" },
  { value: "mental-health", label: "Mental health" },
  { value: "legal", label: "Legal" },
  { value: "safety-critical", label: "Safety-critical" },
];

const coverageStyle: Record<CoverageStatus, string> = {
  "sufficient-for-household-exploration":
    "border-sage bg-sage-soft text-sage-deep",
  partial: "border-mustard bg-mustard-soft text-ink",
  insufficient: "border-ink/30 bg-cream text-ink-soft",
  "authoritative-support-required":
    "border-tomato/60 bg-cream text-tomato-deep",
};

const coverageLabel: Record<CoverageStatus, string> = {
  "sufficient-for-household-exploration": "Sufficient for household exploration",
  partial: "Partial",
  insufficient: "Insufficient",
  "authoritative-support-required": "Authoritative support required",
};

const kindLabel: Record<KnowledgeUnit["kind"], string> = {
  "problem-promise": "Problem & promise",
  audience: "Audience",
  limitations: "Limitations",
  "observed-outcome": "Observed outcome",
  "story-section": "Story",
  "list-item": "List item",
  routine: "Routine",
  recipe: "Recipe",
  "curated-claim": "Curated reference claim",
};

const sourceTypeLabel: Record<string, string> = {
  "personal-experience": "Personal experience",
  "professional-guidance": "Professional guidance",
  "sourced-reference": "Authoritative reference",
  "community-adaptation": "Community adaptation",
  "translated-derivative": "Translated derivative",
  "platform-synthesis": "Platform synthesis",
  "ai-assisted-draft": "AI-assisted draft",
};

/**
 * The Evidence Explorer — an analytical retrieval console, NOT a chatbot.
 * No chat bubbles, no assistant persona, no typing animation. It runs the
 * deterministic retriever in-browser over the prebuilt corpus and renders the
 * evidence packet with full provenance.
 */
export function EvidenceExplorer() {
  const [text, setText] = useState("");
  const [locale, setLocale] = useState("en");
  const [mode, setMode] = useState<RepresentationPolicy>("public-safe");
  const [risk, setRisk] = useState<GuidanceRisk>("ordinary-household");
  const [domain, setDomain] = useState("");
  const [constraint, setConstraint] = useState("");
  const [skill, setSkill] = useState("");
  const [circumstance, setCircumstance] = useState("");
  const [devStage, setDevStage] = useState("");
  const [systemScope, setSystemScope] = useState<string | undefined>(undefined);
  const [packet, setPacket] = useState<EvidencePacket | null>(null);
  const [ran, setRan] = useState(false);

  const query: KnowledgeQuery = useMemo(
    () => ({
      text,
      requestedLocale: locale,
      householdDomain: domain || undefined,
      constraints: constraint ? [constraint] : undefined,
      taskOrSkill: skill || undefined,
      householdCircumstances: circumstance ? [circumstance] : undefined,
      developmentalStage: devStage || undefined,
      systemScope,
      representationPolicy: mode,
      guidanceRisk: risk,
    }),
    [text, locale, domain, constraint, skill, circumstance, devStage, systemScope, mode, risk],
  );

  function run() {
    setPacket(retrieve(query, knowledgeCorpus, knowledgeTranslations));
    setRan(true);
  }

  function loadPreset(id: string) {
    const c = evaluationCases.find((e) => e.id === id);
    if (!c) return;
    const q = c.query;
    setText(q.text);
    setLocale(q.requestedLocale);
    setMode(q.representationPolicy);
    setRisk(q.guidanceRisk);
    setDomain(q.householdDomain ?? "");
    setConstraint(q.constraints?.[0] ?? "");
    setSkill(q.taskOrSkill ?? "");
    setCircumstance(q.householdCircumstances?.[0] ?? "");
    setDevStage(q.developmentalStage ?? "");
    setSystemScope(q.systemScope);
    setPacket(retrieve(q, knowledgeCorpus, knowledgeTranslations));
    setRan(true);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sage">
          {copy.studio.name} · {L.title}
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">{L.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">{L.tagline}</p>
      </header>

      {/* Seeded presets */}
      <section aria-label={L.presetsLabel}>
        <p className="text-xs font-bold text-ink-soft">{L.presetsLabel}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {evaluationCases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => loadPreset(c.id)}
              className="rounded-full border border-ink/25 px-3 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-sage hover:text-sage-deep"
              title={c.expectation}
            >
              {c.title}
            </button>
          ))}
        </div>
      </section>

      {/* Query form */}
      <section className="rounded-2xl border border-ink/15 bg-paper p-5">
        <div className="space-y-4">
          <Field label={L.queryLabel} hint={L.queryHint} htmlFor="q-text">
            <TextInput
              id="q-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="shared kitchen celiac label checks"
              onKeyDown={(e) => {
                if (e.key === "Enter") run();
              }}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={L.localeLabel} htmlFor="q-locale">
              <Select id="q-locale" value={locale} onChange={setLocale} options={localeOptions} />
            </Field>
            <Field label={L.modeLabel} htmlFor="q-mode">
              <Select
                id="q-mode"
                value={mode}
                onChange={(v) => setMode(v as RepresentationPolicy)}
                options={[
                  { value: "public-safe", label: L.modePublicSafe },
                  { value: "editorial-inspection", label: L.modeEditorial },
                ]}
              />
            </Field>
            <Field label={L.riskLabel} htmlFor="q-risk">
              <Select
                id="q-risk"
                value={risk}
                onChange={(v) => setRisk(v as GuidanceRisk)}
                options={riskOptions}
              />
            </Field>
          </div>

          <p className="rounded-lg bg-cream p-2.5 text-xs text-ink-soft">
            {mode === "public-safe" ? L.modePublicSafeHint : L.modeEditorialHint}
            {" · "}
            {L.riskHint}
          </p>

          <details className="rounded-lg border border-ink/15 bg-cream/60 p-3">
            <summary className="cursor-pointer text-sm font-bold text-sage-deep">
              Optional facet filters
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label={L.domainLabel} htmlFor="q-domain">
                <TextInput id="q-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Kitchen & food safety" />
              </Field>
              <Field label={L.constraintLabel} htmlFor="q-constraint">
                <TextInput id="q-constraint" value={constraint} onChange={(e) => setConstraint(e.target.value)} placeholder="strict cross-contact prevention" />
              </Field>
              <Field label={L.skillLabel} htmlFor="q-skill">
                <TextInput id="q-skill" value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="label reading" />
              </Field>
              <Field label={L.circumstanceLabel} htmlFor="q-circ">
                <TextInput id="q-circ" value={circumstance} onChange={(e) => setCircumstance(e.target.value)} placeholder="one shared kitchen" />
              </Field>
              <Field label={L.devStageLabel} htmlFor="q-dev">
                <TextInput id="q-dev" value={devStage} onChange={(e) => setDevStage(e.target.value)} placeholder="four-year-old" />
              </Field>
            </div>
          </details>

          <button
            type="button"
            onClick={run}
            className="rounded-full border-2 border-ink bg-sage px-5 py-2 text-sm font-extrabold text-cream transition-colors hover:bg-sage-deep"
          >
            {L.run}
          </button>
        </div>
      </section>

      {/* Evidence packet */}
      {ran && packet && <PacketView packet={packet} />}
    </div>
  );
}

function PacketView({ packet }: { packet: EvidencePacket }) {
  return (
    <section aria-label="Evidence packet" className="space-y-4">
      <p className="text-xs italic text-ink-soft">{L.packetNote}</p>

      {/* Coverage verdict */}
      <div
        className={`rounded-2xl border-2 p-4 ${coverageStyle[packet.coverage]}`}
      >
        <p className="text-xs font-extrabold uppercase tracking-wide">
          {L.coverageHeading}
        </p>
        <p className="mt-1 font-display text-lg font-extrabold">
          {coverageLabel[packet.coverage]}
        </p>
        {packet.insufficientSupportReason && (
          <p className="mt-1 text-sm">{packet.insufficientSupportReason}</p>
        )}
      </div>

      {/* Summaries */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-ink/15 bg-paper p-4">
          <p className="text-xs font-bold text-ink-soft">{L.localeHeading}</p>
          <p className="mt-1 text-sm">
            Requested:{" "}
            <span className="font-semibold">
              {localeNames[packet.requestedLocale] ?? packet.requestedLocale}
            </span>{" "}
            · served primarily as{" "}
            <span className="font-semibold">{packet.localeSummary.servedPrimarilyAs}</span>
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Approved translation available:{" "}
            {packet.localeSummary.approvedTranslationAvailable ? "yes" : "no"} ·
            unapproved/stale present:{" "}
            {packet.localeSummary.unapprovedOrStalePresent ? "yes" : "no"}
          </p>
          {packet.localeSummary.notes.map((n, i) => (
            <p key={i} className="mt-1.5 border-l-2 border-mustard pl-2 text-xs text-ink-soft">
              {n}
            </p>
          ))}
        </div>
        <div className="rounded-xl border border-ink/15 bg-paper p-4">
          <p className="text-xs font-bold text-ink-soft">{L.sourceMixHeading}</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {Object.entries(packet.sourceTypeSummary).map(([st, n]) => (
              <li key={st}>
                <span className="font-semibold">{sourceTypeLabel[st] ?? st}</span>: {n}
              </li>
            ))}
            {Object.keys(packet.sourceTypeSummary).length === 0 && (
              <li className="text-ink-soft">—</li>
            )}
          </ul>
        </div>
      </div>

      {/* Warnings */}
      {packet.warnings.length > 0 && (
        <div className="rounded-xl border border-tomato/40 bg-cream p-4">
          <p className="text-xs font-bold text-tomato-deep">{L.warningsHeading}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {packet.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hits */}
      {packet.hits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/30 bg-cream p-4 text-sm text-ink-soft">
          {L.noHits}
        </p>
      ) : (
        <ol className="space-y-3">
          {packet.hits.map((h) => (
            <HitCard key={h.unit.id} hit={h} />
          ))}
        </ol>
      )}

      {/* Aggregated limitations */}
      {packet.limitations.length > 0 && (
        <div className="rounded-xl border border-ink/15 bg-paper p-4">
          <p className="text-xs font-bold text-ink-soft">{L.limitationsHeading}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {packet.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function HitCard({ hit }: { hit: EvidenceHit }) {
  const u = hit.unit;
  return (
    <li className="rounded-2xl border border-ink/15 bg-paper p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-cream">
          #{hit.rank} · {hit.score.toFixed(2)}
        </span>
        <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[11px] font-bold text-sage-deep">
          {kindLabel[u.kind]}
        </span>
        <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
          {sourceTypeLabel[u.provenanceSourceType] ?? u.provenanceSourceType}
        </span>
        <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
          {u.derivation === "original" ? "Original" : `Derivative: ${u.derivation}`}
        </span>
        <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
          {localeLabel(u.effectiveLocale)}
        </span>
        <span className="ml-auto text-[11px] font-semibold text-ink-soft">
          {u.ownerSystemTitle} · v{u.sourceVersion}
        </span>
      </div>

      {/* Structured list-item, or exact excerpt */}
      {u.listItem ? (
        <div className="mt-3 rounded-xl bg-cream/60 p-3 text-sm">
          <p className="font-bold">{u.listItem.need}</p>
          <p className="text-xs text-ink-soft">
            {u.listItem.quantity} · {u.listItem.recurrence} · {u.listItem.importance}
          </p>
          {u.listItem.preferredName && (
            <p className="mt-1.5">
              <span className="font-semibold text-sage-deep">Creator&apos;s pick:</span>{" "}
              {u.listItem.preferredName}
              {u.listItem.preferredWhy ? ` — ${u.listItem.preferredWhy}` : ""}
            </p>
          )}
          {u.listItem.substitutions.length > 0 && (
            <p className="mt-1 text-xs text-ink-soft">
              Subs: {u.listItem.substitutions.map((s) => s.name).join(", ")}
            </p>
          )}
          {u.listItem.notes && (
            <p className="mt-1 text-xs italic text-ink-soft">{u.listItem.notes}</p>
          )}
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-line border-l-4 border-sage pl-3 text-sm">
          {u.displayText}
        </p>
      )}

      {/* Match reasons */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-bold text-sage-deep">
          {L.reasonsHeading}
        </summary>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-ink-soft">
          {hit.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </details>

      {/* Locale status + applicability/limitations */}
      <p className="mt-2 text-xs text-ink-soft">🌐 {hit.localeStatus}</p>
      {u.applicability && (
        <p className="mt-1 text-xs text-ink-soft">
          <span className="font-semibold text-ink">Applies to:</span> {u.applicability}
        </p>
      )}
      {u.limitations && (
        <p className="mt-1 text-xs text-ink-soft">
          <span className="font-semibold text-ink">Stated limitation:</span> {u.limitations}
        </p>
      )}

      {/* Warnings */}
      {hit.warnings.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-tomato-deep">
          {hit.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      {/* Source links */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold">
        {u.publicHref && (
          <Link href={u.publicHref} className="text-sage-deep underline decoration-sage decoration-2 underline-offset-2">
            {L.viewPublic}
          </Link>
        )}
        <Link href={u.studioHref} className="text-ink-soft underline decoration-ink/30 decoration-2 underline-offset-2 hover:text-sage-deep">
          {L.viewStudio}
        </Link>
      </div>
    </li>
  );
}
