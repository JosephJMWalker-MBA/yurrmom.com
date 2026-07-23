"use client";

import Link from "next/link";
import { useWorkspace } from "@/ui/studio/use-workspace";
import { StatusBadge } from "@/ui/studio/status";

export default function StudioSystemsPage() {
  const { ready, systemList } = useWorkspace();

  if (!ready) {
    return <p className="text-sm text-ink-soft">Loading systems…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sage">
            Systems
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">
            Your household systems
          </h1>
        </div>
        <Link
          href="/studio/systems/new"
          className="rounded-full border-2 border-ink bg-sage px-5 py-2 text-sm font-extrabold text-cream transition-colors hover:bg-sage-deep"
        >
          + New system
        </Link>
      </div>

      <ul className="mt-6 space-y-4">
        {systemList.map((ws) => (
          <li
            key={ws.system.slug}
            className="rounded-2xl border border-ink/15 bg-paper p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-extrabold">
                {ws.system.title}
              </h2>
              <StatusBadge ws={ws} />
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {ws.system.promise || "No promise written yet."}
            </p>
            <p className="mt-2 text-xs text-ink-soft">
              {ws.lists.length} list{ws.lists.length === 1 ? "" : "s"} ·{" "}
              {ws.system.routines.length} routine
              {ws.system.routines.length === 1 ? "" : "s"} ·{" "}
              {ws.system.recipes.length} recipe
              {ws.system.recipes.length === 1 ? "" : "s"} · updated{" "}
              {new Date(ws.updatedAtLocal).toLocaleDateString()}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/studio/systems/${ws.system.slug}/edit`}
                className="rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-sm font-bold transition-colors hover:bg-mustard"
              >
                Edit
              </Link>
              <Link
                href={`/studio/systems/${ws.system.slug}/preview`}
                className="rounded-full border border-ink/30 px-4 py-1.5 text-sm font-bold text-ink-soft transition-colors hover:border-sage hover:text-sage-deep"
              >
                Preview
              </Link>
              {ws.status === "published" && !ws.hasLocalEdits && (
                <Link
                  href={`/systems/${ws.system.slug}`}
                  className="rounded-full border border-ink/30 px-4 py-1.5 text-sm font-bold text-ink-soft transition-colors hover:border-sage hover:text-sage-deep"
                >
                  View public page ↗
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
