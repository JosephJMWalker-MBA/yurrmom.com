"use client";

import { useEffect, useState } from "react";
import type { RoastEntry, RoastPrompt } from "@/domain/types";

interface LocalEntry {
  id: string;
  body: string;
}

/**
 * Roast entries: seeded, pre-moderated content plus honest local demo
 * participation. Votes and submissions live on this device only and say so —
 * there is no server pipeline in this slice, so none is implied (docs/05).
 * New submissions enter "pending review", mirroring the real moderation
 * lifecycle (docs/07: RoastEntry defaults to pending).
 */
export function RoastBoard({ roast }: { roast: RoastPrompt }) {
  const votesKey = `ym:roast:${roast.slug}:votes`;
  const mineKey = `ym:roast:${roast.slug}:mine`;

  const [myVotes, setMyVotes] = useState<Record<string, boolean>>({});
  const [mine, setMine] = useState<LocalEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(votesKey);
      if (v) setMyVotes(JSON.parse(v));
      const m = localStorage.getItem(mineKey);
      if (m) setMine(JSON.parse(m));
    } catch {
      /* fine */
    }
    setLoaded(true);
  }, [votesKey, mineKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(votesKey, JSON.stringify(myVotes));
      localStorage.setItem(mineKey, JSON.stringify(mine));
    } catch {
      /* fine */
    }
  }, [myVotes, mine, loaded, votesKey, mineKey]);

  function toggleVote(id: string) {
    setMyVotes((v) => ({ ...v, [id]: !v[id] }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setMine((m) => [...m, { id: `local-${Date.now()}`, body }]);
    setDraft("");
  }

  const sorted: RoastEntry[] = [...roast.entries].sort(
    (a, b) =>
      b.votes + (myVotes[b.id] ? 1 : 0) - (a.votes + (myVotes[a.id] ? 1 : 0)),
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold">The entries</h2>
        <p className="text-xs font-semibold text-ink-soft">
          Ranked by wit. Cruelty doesn&apos;t rank.
        </p>
      </div>

      <ul className="mt-4 space-y-3">
        {sorted.map((entry) => {
          const voted = !!myVotes[entry.id];
          return (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_0_#221a14]"
            >
              <button
                type="button"
                onClick={() => toggleVote(entry.id)}
                aria-pressed={voted}
                aria-label={`Vote for entry by ${entry.author}`}
                className={`flex min-w-14 flex-col items-center rounded-xl border-2 border-ink px-2 py-1.5 text-sm font-extrabold transition-colors ${
                  voted ? "bg-tomato text-cream" : "bg-cream hover:bg-mustard"
                }`}
              >
                <span aria-hidden>🔥</span>
                {entry.votes + (voted ? 1 : 0)}
              </button>
              <div>
                <p className="leading-relaxed">{entry.body}</p>
                <p className="mt-1 text-xs font-semibold text-ink-soft">
                  @{entry.author}
                </p>
              </div>
            </li>
          );
        })}

        {mine.map((entry) => (
          <li
            key={entry.id}
            className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-ink/50 bg-cream p-4"
          >
            <span className="rounded-xl border-2 border-ink/30 px-2 py-1.5 text-xs font-bold text-ink-soft">
              pending
            </span>
            <div>
              <p className="leading-relaxed">{entry.body}</p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">
                @you · pending review — in the real pipeline a moderator sees this
                before anyone else does. In this preview it lives on your device only.
              </p>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="mt-6 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_0_#221a14]">
        <label htmlFor="roast-draft" className="font-display text-lg font-extrabold">
          Add your roast
        </label>
        <p className="mt-1 text-xs text-ink-soft">
          House rules: Deb is fictional — keep it that way. Roast the chart, the
          behavior, the archetype. No real people, no cruelty, adults only.
        </p>
        <textarea
          id="roast-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder="The chart has a mission statement…"
          className="mt-3 w-full rounded-xl border-2 border-ink bg-cream p-3 text-sm focus:outline-tomato"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="submit"
            className="rounded-full border-2 border-ink bg-tomato px-5 py-2 text-sm font-extrabold text-cream transition-colors hover:bg-tomato-deep"
          >
            Submit for review
          </button>
          <span className="text-xs text-ink-soft">{draft.length}/280</span>
        </div>
      </form>

      <p className="mt-3 text-xs text-ink-soft">
        See something that crosses a line?{" "}
        <button
          type="button"
          className="font-bold underline decoration-tomato decoration-2 underline-offset-2"
          onClick={() =>
            alert(
              "Thanks — in the full build this files a report straight to the moderation queue (reports jump the line). In this preview, nothing is transmitted.",
            )
          }
        >
          Report it
        </button>
        . Reports jump the moderation line.
      </p>
    </div>
  );
}
