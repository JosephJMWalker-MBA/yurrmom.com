"use client";

import Link from "next/link";
import { useModeration } from "../use-moderation";

function Stat({ label, value, href, tone }: { label: string; value: number; href?: string; tone?: "urgent" | "normal" }) {
  const body = (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "urgent" && value > 0 ? "border-tomato/50 bg-tomato/5" : "border-ink/15 bg-paper"
      }`}
    >
      <p className="font-display text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-transform hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}

export function AdminOverview() {
  const { ready, counts, reset } = useModeration();
  if (!ready || !counts) return <p className="text-sm text-ink-soft">Loading admin…</p>;

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sage">Platform administration</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold">Admin overview</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Governance state for the roast community and platform curation. Reports are allegations for human review — never automatic
        verdicts, never proof.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending entries" value={counts.pending} href="/studio/admin/moderation" tone="normal" />
        <Stat label="Urgent / high queue" value={counts.urgentOrHigh} href="/studio/admin/moderation" tone="urgent" />
        <Stat label="Open reports" value={counts.openReports} href="/studio/admin/moderation" tone="urgent" />
        <Stat label="Escalated" value={counts.escalated} href="/studio/admin/moderation" tone="urgent" />
        <Stat label="Active prompts" value={counts.activePrompts} href="/studio/admin/roast" />
        <Stat label="Active featured" value={counts.activeFeatured} href="/studio/admin/featured" />
        <Stat label="Deprecated terms" value={counts.deprecatedTerms} href="/studio/admin/taxonomy" />
        <Stat label="Approved entries" value={counts.approved} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/studio/admin/moderation" className="rounded-2xl border border-ink/15 bg-paper p-4 transition-colors hover:border-sage">
          <p className="font-display font-extrabold">Moderation queue →</p>
          <p className="mt-1 text-sm text-ink-soft">Deterministic priority bands. Approve, remove, escalate, resolve reports — with a rationale and an audit trail.</p>
        </Link>
        <Link href="/studio/admin/integrations" className="rounded-2xl border border-ink/15 bg-paper p-4 transition-colors hover:border-sage">
          <p className="font-display font-extrabold">Integration states →</p>
          <p className="mt-1 text-sm text-ink-soft">Honest, local-only capability of every adapter. No secrets, no exaggerated capability.</p>
        </Link>
      </div>

      <div className="mt-10 border-t border-ink/10 pt-4">
        <button
          type="button"
          onClick={reset}
          className="text-xs font-semibold text-ink-soft underline decoration-dotted underline-offset-2 hover:text-tomato-deep"
        >
          Reset moderation data on this device
        </button>
      </div>
    </div>
  );
}
