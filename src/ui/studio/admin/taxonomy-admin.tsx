"use client";

import { useState } from "react";
import { systems } from "@/data";
import { deriveTaxonomyUsage, type TaxonomyStatus, type TaxonomyTerm } from "@/domain/moderation";
import { useModeration } from "../use-moderation";

const STATUS_STYLE: Record<TaxonomyStatus, string> = {
  active: "border-sage bg-sage-soft text-sage-deep",
  draft: "border-mustard bg-mustard-soft text-ink",
  deprecated: "border-ink/25 bg-cream text-ink-soft",
};

function TermRow({ term, allTerms }: { term: TaxonomyTerm; allTerms: TaxonomyTerm[] }) {
  const { mutateTaxonomy } = useModeration();
  const [aliases, setAliases] = useState(term.aliases.join(", "));
  const [replacement, setReplacement] = useState(term.replacementTermId ?? "");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string | null>(null);
  const usage = deriveTaxonomyUsage(term, systems);

  function update() {
    setError(null);
    const next: TaxonomyTerm = { ...term, aliases: aliases.split(",").map((s) => s.trim()).filter(Boolean) };
    const result = mutateTaxonomy({ term: next, op: "taxonomy-update", rationale });
    if (!result.ok) setError(result.reason ?? "Update failed.");
    else setRationale("");
  }

  function deprecate() {
    setError(null);
    const next: TaxonomyTerm = { ...term, replacementTermId: replacement || undefined };
    const result = mutateTaxonomy({ term: next, op: "taxonomy-deprecate", rationale });
    if (!result.ok) setError(result.reason ?? "Deprecate failed.");
    else setRationale("");
  }

  return (
    <div className="rounded-2xl border border-ink/15 bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display font-extrabold">{term.canonicalLabel}</p>
          <p className="font-mono text-[11px] text-ink-soft">{term.key}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[term.status]}`}>{term.status}</span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">{term.description}</p>
      <p className="mt-1 text-[11px] text-ink-soft">
        Derived usage in canonical systems: <span className="font-bold text-ink">{usage}</span>
        {term.replacementTermId ? ` · replaced by ${term.replacementTermId}` : ""}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
        <span className="font-bold">aliases</span>
        <input value={aliases} onChange={(e) => setAliases(e.target.value)} className="min-w-40 flex-1 rounded-lg border border-ink/20 bg-paper px-2 py-1" />
      </div>

      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        rows={2}
        placeholder="Rationale (required)…"
        className="mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={update} className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold hover:bg-mustard">
          Save aliases
        </button>
        {term.status !== "deprecated" && (
          <span className="flex items-center gap-1 text-[11px] text-ink-soft">
            deprecate → replace with
            <select value={replacement} onChange={(e) => setReplacement(e.target.value)} className="rounded-lg border border-ink/20 bg-paper px-1.5 py-1 text-[11px]">
              <option value="">(none)</option>
              {allTerms
                .filter((t) => t.id !== term.id && t.status === "active")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.canonicalLabel}
                  </option>
                ))}
            </select>
            <button type="button" onClick={deprecate} className="rounded-full border border-ink/30 px-2 py-1 text-[11px] font-bold hover:border-tomato hover:text-tomato-deep">
              Deprecate
            </button>
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-[11px] font-semibold text-tomato-deep">{error}</p>}
    </div>
  );
}

export function TaxonomyAdmin() {
  const { ready, store } = useModeration();
  if (!ready || !store) return <p className="text-sm text-ink-soft">Loading taxonomy…</p>;
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Platform taxonomy</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Terms for the facets systems already use. Editing here never rewrites a system. Deprecating may suggest a replacement but mutates
        nothing. Usage is derived from canonical systems, never entered by hand.
      </p>
      <div className="mt-4 space-y-3">
        {store.taxonomy.map((t) => (
          <TermRow key={t.id} term={t} allTerms={store.taxonomy} />
        ))}
      </div>
    </div>
  );
}
