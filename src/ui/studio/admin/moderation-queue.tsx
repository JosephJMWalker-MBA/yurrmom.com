"use client";

import { useMemo, useState } from "react";
import {
  MODERATION_POLICY,
  auditFor,
  canTransitionEntry,
  type EntryStatus,
  type ModerationStore,
  type PriorityBand,
  type QueueItem,
  type Report,
  type RoastEntryRecord,
} from "@/domain/moderation";
import { useModeration } from "../use-moderation";

const BAND_STYLE: Record<PriorityBand, string> = {
  urgent: "border-tomato/60 bg-tomato/10 text-tomato-deep",
  high: "border-mustard bg-mustard-soft text-ink",
  normal: "border-ink/25 bg-cream text-ink",
  low: "border-ink/15 bg-cream text-ink-soft",
};

const ENTRY_STATUSES: EntryStatus[] = ["approved", "removed", "escalated", "pending"];
const ACTION_LABEL: Record<EntryStatus, string> = {
  approved: "Approve",
  removed: "Remove",
  escalated: "Escalate",
  pending: "Restore to pending",
};

function AuditTrail({ store, targetId }: { store: ModerationStore; targetId: string }) {
  const events = auditFor(store, targetId);
  if (events.length === 0) return null;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-[11px] font-bold text-ink-soft">Audit history ({events.length})</summary>
      <ul className="mt-1 space-y-1">
        {events.map((a) => (
          <li key={a.id} className="rounded-lg border border-ink/12 bg-cream px-2.5 py-1.5 text-[11px] text-ink-soft">
            <span className="font-mono font-bold">#{a.seq} {a.action}</span> · {a.priorStatus} → {a.resultingStatus} · {a.actor}
            <br />
            <span className="text-ink">{a.rationale}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function EntryCard({ item, store }: { item: QueueItem; store: ModerationStore }) {
  const { moderateEntry } = useModeration();
  const entry = store.entries.find((e) => e.id === item.targetId);
  const [rationale, setRationale] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [policyIds, setPolicyIds] = useState<string[]>([]);
  const [resolveIds, setResolveIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!entry) return null;
  const reports = store.reports.filter((r) => r.targetId === entry.id && (r.status === "open" || r.status === "reviewing"));

  function act(to: EntryStatus) {
    setError(null);
    const result = moderateEntry({
      entryId: entry!.id,
      toStatus: to,
      rationale,
      policyRuleIds: policyIds,
      resolveReportIds: to === "approved" || to === "removed" ? resolveIds : [],
      reviewedEscalation: reviewed,
    });
    if (!result.ok) setError(result.reason ?? "Action failed.");
    else {
      setRationale("");
      setReviewed(false);
      setResolveIds([]);
    }
  }

  return (
    <div className={`rounded-2xl border-2 p-4 ${BAND_STYLE[item.band]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-extrabold uppercase">{item.band}</span>
        <span className="text-[11px] font-semibold">entry · {entry.status}</span>
      </div>
      <p className="mt-2 text-xs text-ink-soft">{item.reason}</p>
      <p className="mt-2 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink">{entry.body}</p>
      <p className="mt-1 text-[11px] text-ink-soft">@{entry.displayAuthor} · created {new Date(entry.createdAt).toLocaleDateString()}</p>

      {reports.length > 0 && (
        <div className="mt-2 rounded-lg border border-tomato/30 bg-paper px-3 py-2">
          <p className="text-[11px] font-bold text-tomato-deep">Reports on this entry (allegations — reporter identity hidden):</p>
          <ul className="mt-1 space-y-1">
            {reports.map((r: Report) => (
              <li key={r.id} className="flex items-start gap-2 text-[11px] text-ink">
                <input
                  type="checkbox"
                  checked={resolveIds.includes(r.id)}
                  onChange={(e) => setResolveIds((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))}
                  className="mt-0.5 size-3.5 accent-sage-deep"
                />
                <span>
                  <span className="font-bold">{r.reason}</span>
                  {r.note ? ` — ${r.note}` : ""} <span className="text-ink-soft">(select to resolve with this action)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] font-bold text-ink-soft">Policy rules considered ({policyIds.length})</summary>
        <div className="mt-1 flex flex-wrap gap-1">
          {MODERATION_POLICY.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPolicyIds((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                policyIds.includes(p.id) ? "border-sage bg-sage-soft text-sage-deep" : "border-ink/20 bg-cream text-ink-soft"
              }`}
              title={p.description}
            >
              {p.title}
            </button>
          ))}
        </div>
      </details>

      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        rows={2}
        placeholder="Rationale (required for every action)…"
        className="mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm"
      />

      {entry.status === "escalated" && (
        <label className="mt-1 flex items-center gap-2 text-[11px] text-ink-soft">
          <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="size-3.5 accent-sage-deep" />
          I have reviewed this escalation (required to approve an escalated entry).
        </label>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        {ENTRY_STATUSES.filter((to) => canTransitionEntry(entry.status, to)).map((to) => (
          <button
            key={to}
            type="button"
            onClick={() => act(to)}
            className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold transition-colors hover:bg-mustard"
          >
            {ACTION_LABEL[to]}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-[11px] font-semibold text-tomato-deep">{error}</p>}
      <AuditTrail store={store} targetId={entry.id} />
    </div>
  );
}

function ReportCard({ item, store }: { item: QueueItem; store: ModerationStore }) {
  const { resolveReport, moderateEntry } = useModeration();
  const report = store.reports.find((r) => r.id === item.reportId);
  const target = store.entries.find((e) => e.id === item.targetId);
  const [rationale, setRationale] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!report) return null;

  function close(dismiss: boolean) {
    setError(null);
    const result = resolveReport({ reportId: report!.id, dismiss, rationale });
    if (!result.ok) setError(result.reason ?? "Action failed.");
    else setRationale("");
  }

  // Moderate the reported entry AND resolve this report in one audited action.
  function moderate(to: EntryStatus) {
    setError(null);
    const result = moderateEntry({
      entryId: target!.id,
      toStatus: to,
      rationale,
      resolveReportIds: to === "approved" || to === "removed" ? [report!.id] : [],
      reviewedEscalation: reviewed,
    });
    if (!result.ok) setError(result.reason ?? "Action failed.");
    else {
      setRationale("");
      setReviewed(false);
    }
  }

  return (
    <div className={`rounded-2xl border-2 p-4 ${BAND_STYLE[item.band]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-extrabold uppercase">{item.band}</span>
        <span className="text-[11px] font-semibold">report · {report.status}</span>
      </div>
      <p className="mt-2 text-xs text-ink-soft">{item.reason}</p>
      <p className="mt-1 text-[11px] text-ink-soft">
        Reason: <span className="font-bold text-ink">{report.reason}</span>. Reporting is an allegation, not proof. Reporter identity is
        never shown.
      </p>
      {target && (
        <p className="mt-2 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink">
          Target entry ({target.status}): {target.body}
        </p>
      )}
      <p className="mt-1 text-[11px] text-ink-soft">
        Enter a rationale, then either act on the entry (that also resolves this report) or resolve/dismiss the report on its own.
      </p>
      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        rows={2}
        placeholder="Rationale (required)…"
        className="mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm"
      />
      {target?.status === "escalated" && (
        <label className="mt-1 flex items-center gap-2 text-[11px] text-ink-soft">
          <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="size-3.5 accent-sage-deep" />
          I have reviewed this escalation (required to approve).
        </label>
      )}
      {target && (
        <div className="mt-2 flex flex-wrap gap-2">
          {ENTRY_STATUSES.filter((to) => canTransitionEntry(target.status, to)).map((to) => (
            <button
              key={to}
              type="button"
              onClick={() => moderate(to)}
              className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold transition-colors hover:bg-mustard"
            >
              {ACTION_LABEL[to]} entry
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => close(false)} className="rounded-full border border-ink/30 px-3 py-1.5 text-xs font-bold text-ink-soft hover:border-sage hover:text-sage-deep">
          Resolve report only
        </button>
        <button type="button" onClick={() => close(true)} className="rounded-full border border-ink/30 px-3 py-1.5 text-xs font-bold text-ink-soft hover:border-tomato hover:text-tomato-deep">
          Dismiss report
        </button>
      </div>
      {error && <p className="mt-2 text-[11px] font-semibold text-tomato-deep">{error}</p>}
      <AuditTrail store={store} targetId={report.id} />
      {target && <AuditTrail store={store} targetId={target.id} />}
    </div>
  );
}

export function ModerationQueue() {
  const { ready, store, queue } = useModeration();
  const [band, setBand] = useState<PriorityBand | "all">("all");
  const [kind, setKind] = useState<QueueItem["kind"] | "all">("all");

  const filtered = useMemo(
    () => queue.filter((q) => (band === "all" || q.band === band) && (kind === "all" || q.kind === kind)),
    [queue, band, kind],
  );

  if (!ready || !store) return <p className="text-sm text-ink-soft">Loading queue…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Moderation queue</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Deterministic priority bands (never votes, popularity, or engagement). Every action needs a rationale and writes an immutable
        audit event. Report volume is not truth.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="text-xs font-bold text-ink">
          Priority
          <select value={band} onChange={(e) => setBand(e.target.value as PriorityBand | "all")} className="ml-1 rounded-lg border border-ink/20 bg-paper px-2 py-1 text-xs font-normal">
            <option value="all">All</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="text-xs font-bold text-ink">
          Type
          <select value={kind} onChange={(e) => setKind(e.target.value as QueueItem["kind"] | "all")} className="ml-1 rounded-lg border border-ink/20 bg-paper px-2 py-1 text-xs font-normal">
            <option value="all">All</option>
            <option value="entry">Entries</option>
            <option value="report">Reports</option>
            <option value="prompt">Prompts</option>
          </select>
        </label>
        <span className="self-center text-xs text-ink-soft">{filtered.length} item(s)</span>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 && <p className="text-sm text-ink-soft">Nothing in this view.</p>}
        {filtered.map((item) =>
          item.kind === "entry" ? (
            <EntryCard key={item.id} item={item} store={store} />
          ) : item.kind === "report" ? (
            <ReportCard key={item.id} item={item} store={store} />
          ) : (
            <div key={item.id} className={`rounded-2xl border-2 p-4 ${BAND_STYLE[item.band]}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-extrabold uppercase">{item.band}</span>
                <span className="text-[11px] font-semibold">prompt</span>
              </div>
              <p className="mt-2 text-xs text-ink-soft">{item.reason}</p>
              <p className="mt-1 text-[11px]">Manage prompt <span className="font-bold">{item.targetId}</span> in the Roast tab.</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
