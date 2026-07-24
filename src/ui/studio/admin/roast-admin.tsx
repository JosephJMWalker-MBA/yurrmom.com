"use client";

import { useState } from "react";
import {
  auditFor,
  projectPublicRoast,
  promptCanActivate,
  type PromptStatus,
  type RoastPromptRecord,
} from "@/domain/moderation";
import { useModeration } from "../use-moderation";

const STATUS_STYLE: Record<PromptStatus, string> = {
  active: "border-sage bg-sage-soft text-sage-deep",
  draft: "border-mustard bg-mustard-soft text-ink",
  retired: "border-ink/20 bg-cream text-ink-soft",
};

function PromptCard({ prompt }: { prompt: RoastPromptRecord }) {
  const { store, setPromptStatus } = useModeration();
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string | null>(null);
  const activation = promptCanActivate(prompt);
  const approvedCount = store
    ? projectPublicRoast(prompt, store.entries, store.votes)?.entries.length ?? 0
    : 0;

  function change(to: PromptStatus) {
    setError(null);
    const result = setPromptStatus({ promptSlug: prompt.slug, toStatus: to, rationale });
    if (!result.ok) setError(result.reason ?? "Action failed.");
    else setRationale("");
  }

  return (
    <div className="rounded-2xl border border-ink/15 bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-extrabold">{prompt.title}</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[prompt.status]}`}>{prompt.status}</span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">Character: {prompt.characterName} · v{prompt.version}</p>

      <div className="mt-2 rounded-lg border border-ink/12 bg-cream px-3 py-2 text-[11px]">
        <p className="font-bold text-ink">Fiction provenance ({prompt.provenance.kind})</p>
        <p className="mt-0.5 text-ink-soft">{prompt.provenance.sourceNote}</p>
        <p className="mt-1 text-ink-soft">
          Fictional-subject affirmed: {prompt.provenance.fictionalSubjectAffirmed ? "yes" : "no"} · Identifiable-person excluded:{" "}
          {prompt.provenance.identifiablePersonExcluded ? "yes" : "no"}
        </p>
        <p className="mt-1 rounded border border-mustard bg-mustard-soft px-2 py-1 font-semibold text-ink">
          Public label: {prompt.fictionLabel}
        </p>
        <p className={`mt-1 font-bold ${activation.valid ? "text-sage-deep" : "text-tomato-deep"}`}>
          {activation.valid ? "✓ Provenance valid — may activate." : `✗ ${activation.issues[0]}`}
        </p>
      </div>

      <p className="mt-2 text-[11px] text-ink-soft">Public projection preview: {approvedCount} approved {approvedCount === 1 ? "entry" : "entries"} would show.</p>

      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        rows={2}
        placeholder="Rationale (required for status changes)…"
        className="mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {prompt.status === "draft" && (
          <button
            type="button"
            onClick={() => change("active")}
            disabled={!activation.valid}
            className="rounded-full border-2 border-ink bg-sage px-3 py-1.5 text-xs font-bold text-cream transition-colors hover:bg-sage-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            Activate
          </button>
        )}
        {prompt.status === "active" && (
          <button type="button" onClick={() => change("retired")} className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold hover:bg-mustard">
            Retire
          </button>
        )}
        {prompt.status === "retired" && <span className="text-[11px] text-ink-soft">Retired — inspectable, not publicly discoverable.</span>}
      </div>
      {error && <p className="mt-2 text-[11px] font-semibold text-tomato-deep">{error}</p>}
      {store && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] font-bold text-ink-soft">Audit history ({auditFor(store, prompt.slug).length})</summary>
          <ul className="mt-1 space-y-1">
            {auditFor(store, prompt.slug).map((a) => (
              <li key={a.id} className="rounded-lg border border-ink/12 bg-cream px-2.5 py-1.5 text-[11px] text-ink-soft">
                #{a.seq} {a.action} · {a.priorStatus} → {a.resultingStatus} · {a.rationale}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function RoastAdmin() {
  const { ready, store } = useModeration();
  if (!ready || !store) return <p className="text-sm text-ink-soft">Loading prompts…</p>;
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Roast prompts</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        A prompt cannot activate without valid fiction provenance — roast subjects are fictional by construction. Retiring a prompt keeps
        it inspectable but removes it from public discovery.
      </p>
      <div className="mt-4 space-y-3">
        {store.prompts.map((p) => (
          <PromptCard key={p.slug} prompt={p} />
        ))}
      </div>
    </div>
  );
}
