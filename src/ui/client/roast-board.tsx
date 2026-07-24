"use client";

import { useState } from "react";
import type { PublicRoast, ReportReason } from "@/domain/moderation";
import { usePublicRoast } from "./use-public-roast";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "targets-real-person", label: "Targets a real person" },
  { value: "hate-or-protected-trait", label: "Hate / protected trait" },
  { value: "harassment", label: "Harassment or cruelty" },
  { value: "sexual-content", label: "Sexual content" },
  { value: "minor-safety", label: "Minor safety" },
  { value: "pii-or-doxxing", label: "Private info / doxxing" },
  { value: "threat-or-violence", label: "Threat or violence" },
  { value: "spam-or-manipulation", label: "Spam / manipulation" },
  { value: "other", label: "Something else" },
];

/**
 * Public roast board (Phase 9), backed by the device-local moderation store.
 * Only APPROVED entries are shown (public projection). Voting is one-per-device
 * on approved entries. Submissions become PENDING — never public, never
 * auto-approved. Reporting files an allegation; it never hides content here and
 * never exposes reporter details. No moderator/admin controls appear publicly.
 */
export function RoastBoard({ slug, fallback }: { slug: string; fallback: PublicRoast }) {
  const { roast, myPending, vote, votedFor, submit, report } = usePublicRoast(slug, fallback);

  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [affirm, setAffirm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("targets-real-person");
  const [reportNotice, setReportNotice] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setNotice(null);
    const result = submit({ displayName: name, body: draft, affirmedFictionalTarget: affirm });
    if (!result.ok) {
      setSubmitError(result.reason ?? "Could not submit.");
      return;
    }
    setDraft("");
    setAffirm(false);
    setNotice(
      "Submitted for review — it's pending and not public yet. In the full platform a moderator sees it before anyone else. On this device it lives in the local moderation queue.",
    );
  }

  function fileReport(entryId: string) {
    const result = report({ targetId: entryId, reason: reportReason });
    setReportingId(null);
    setReportNotice(
      result.ok
        ? "Thanks — reported for human review. Reporting doesn't remove content or prove a violation; a person reviews it."
        : result.reason ?? "Could not file the report.",
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold">The entries</h2>
        <p className="text-xs font-semibold text-ink-soft">Ranked by wit. Cruelty doesn&apos;t rank.</p>
      </div>

      <ul className="mt-4 space-y-3">
        {roast.entries.map((entry) => {
          const voted = votedFor(entry.id);
          return (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_0_#221a14]"
            >
              <button
                type="button"
                onClick={() => vote(entry.id)}
                aria-pressed={voted}
                aria-label={`Vote for entry by ${entry.author}`}
                className={`flex min-w-14 flex-col items-center rounded-xl border-2 border-ink px-2 py-1.5 text-sm font-extrabold transition-colors ${
                  voted ? "bg-tomato text-cream" : "bg-cream hover:bg-mustard"
                }`}
              >
                <span aria-hidden>🔥</span>
                {entry.score}
              </button>
              <div className="min-w-0 flex-1">
                <p className="leading-relaxed">{entry.body}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-ink-soft">@{entry.author}</p>
                  {reportingId === entry.id ? (
                    <span className="flex flex-wrap items-center gap-1">
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value as ReportReason)}
                        className="rounded-lg border border-ink/30 bg-cream px-1.5 py-0.5 text-[11px]"
                        aria-label="Report reason"
                      >
                        {REPORT_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => fileReport(entry.id)}
                        className="rounded-full border border-ink/40 px-2 py-0.5 text-[11px] font-bold hover:border-tomato hover:text-tomato-deep"
                      >
                        Send report
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportingId(null)}
                        className="text-[11px] text-ink-soft underline"
                      >
                        cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReportNotice(null);
                        setReportingId(entry.id);
                      }}
                      className="text-[11px] font-semibold text-ink-soft underline decoration-dotted hover:text-tomato-deep"
                    >
                      Report
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}

        {myPending.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-ink/50 bg-cream p-4">
            <span className="rounded-xl border-2 border-ink/30 px-2 py-1.5 text-xs font-bold text-ink-soft">pending</span>
            <div>
              <p className="leading-relaxed">{entry.body}</p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">
                @{entry.displayAuthor} · pending review — not public. This is your local submission; a moderator would see it first.
              </p>
            </div>
          </li>
        ))}
      </ul>

      {reportNotice && (
        <p className="mt-3 rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink-soft" role="status">
          {reportNotice}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_0_#221a14]">
        <label htmlFor="roast-draft" className="font-display text-lg font-extrabold">
          Add your roast
        </label>
        <p className="mt-1 text-xs text-ink-soft">
          House rules: {roast.characterName} is fictional — keep it that way. Roast the chart, the behavior, the archetype. No real
          people, no cruelty, adults only.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Display name (optional — blank posts as anonymous)"
          className="mt-3 w-full rounded-xl border-2 border-ink bg-cream p-2.5 text-sm focus:outline-tomato"
        />
        <textarea
          id="roast-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder="The chart has a mission statement…"
          className="mt-2 w-full rounded-xl border-2 border-ink bg-cream p-3 text-sm focus:outline-tomato"
        />
        <label className="mt-2 flex items-start gap-2 text-xs text-ink-soft">
          <input type="checkbox" checked={affirm} onChange={(e) => setAffirm(e.target.checked)} className="mt-0.5 size-4 accent-tomato" />
          <span>I affirm this roasts the fictional prompt ({roast.characterName}), not a real person.</span>
        </label>
        {submitError && <p className="mt-2 text-xs font-semibold text-tomato-deep">{submitError}</p>}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="submit"
            className="rounded-full border-2 border-ink bg-tomato px-5 py-2 text-sm font-extrabold text-cream transition-colors hover:bg-tomato-deep"
          >
            Submit for review
          </button>
          <span className="text-xs text-ink-soft">{draft.length}/280</span>
        </div>
        {notice && (
          <p className="mt-3 rounded-xl border border-sage bg-sage-soft px-3 py-2 text-xs font-semibold text-sage-deep" role="status">
            {notice}
          </p>
        )}
      </form>

      <p className="mt-3 text-xs text-ink-soft">
        New submissions are reviewed before they appear. Reports go to a human moderator — reporting never removes content by itself,
        and never proves a violation.
      </p>
    </div>
  );
}
