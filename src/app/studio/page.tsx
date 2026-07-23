"use client";

import Link from "next/link";
import { sectionProgress } from "@/domain/workspace";
import { useWorkspace } from "@/ui/studio/use-workspace";
import { StatusBadge } from "@/ui/studio/status";
import { GhostButton } from "@/ui/studio/fields";

/**
 * Workspace overview: what you're working on, where you left off, and the
 * honest boundaries of this phase. Not an analytics dashboard.
 */
export default function StudioOverviewPage() {
  const { ready, creator, systemList, resetDemo } = useWorkspace();

  if (!ready || !creator) {
    return <p className="text-sm text-ink-soft">Opening your workspace…</p>;
  }

  const mostRecent = systemList[0];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sage">
          Creator workspace
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">
          Morning, {creator.displayName.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Document the method once — context, story, lists, routines — and it
          becomes reusable knowledge, not another post. Everything you type
          saves to this device automatically.
        </p>
      </header>

      {mostRecent && (
        <section
          aria-labelledby="continue"
          className="rounded-2xl border border-ink/15 bg-paper p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="continue" className="font-display text-xl font-extrabold">
              Pick up where you left off
            </h2>
            <StatusBadge ws={mostRecent} />
          </div>
          <p className="mt-1 font-semibold">{mostRecent.system.title}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {mostRecent.system.promise || "No promise written yet — start there."}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {sectionProgress(mostRecent).map((s) => (
              <span
                key={s.id}
                title={s.hint}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  s.done
                    ? "bg-sage-soft text-sage-deep"
                    : "border border-dashed border-ink/30 text-ink-soft"
                }`}
              >
                {s.done ? "✓ " : ""}
                {s.label}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/studio/systems/${mostRecent.system.slug}/edit`}
              className="rounded-full border-2 border-ink bg-sage px-5 py-2 text-sm font-extrabold text-cream transition-colors hover:bg-sage-deep"
            >
              Open the editor →
            </Link>
            <Link
              href={`/studio/systems/${mostRecent.system.slug}/preview`}
              className="rounded-full border border-ink/30 px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:border-sage hover:text-sage-deep"
            >
              Preview public page
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/studio/systems"
          className="rounded-2xl border border-ink/15 bg-paper p-4 transition-colors hover:border-sage"
        >
          <p className="font-display font-extrabold">Your systems</p>
          <p className="mt-1 text-sm text-ink-soft">
            {systemList.length} system{systemList.length === 1 ? "" : "s"} —
            drafts and published, side by side.
          </p>
        </Link>
        <Link
          href="/studio/capture"
          className="rounded-2xl border border-ink/15 bg-paper p-4 transition-colors hover:border-sage"
        >
          <p className="font-display font-extrabold">Quick capture</p>
          <p className="mt-1 text-sm text-ink-soft">
            On your phone, mid-chaos? Jot the idea now, structure it later.
          </p>
        </Link>
        <Link
          href={`/creators/${creator.handle}`}
          className="rounded-2xl border border-ink/15 bg-paper p-4 transition-colors hover:border-sage"
        >
          <p className="font-display font-extrabold">Your public profile</p>
          <p className="mt-1 text-sm text-ink-soft">
            How visitors see you — context first, never follower counts.
          </p>
        </Link>
      </section>

      <section className="rounded-2xl border border-ink/15 bg-sage-soft/50 p-4 text-sm text-ink-soft">
        <p className="font-bold text-ink">Honest phase notes</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>
            Drafts live in this browser only — real accounts and sync arrive in
            a later phase. Publishing updates the record on this device.
          </li>
          <li>No AI writes here. Every word stays yours, verbatim.</li>
          <li>
            Social publishing and cart integrations remain planned adapters —
            nothing on this screen pretends otherwise.
          </li>
        </ul>
        <div className="mt-3">
          <GhostButton danger onClick={resetDemo}>
            Reset demo data on this device
          </GhostButton>
        </div>
      </section>
    </div>
  );
}
