import type { Metadata } from "next";
import Link from "next/link";
import { currentRoast } from "@/data";
import { FictionBadge, Kicker } from "@/ui/badges";
import { DebIllustration } from "@/ui/deb-art";
import { RoastBoard } from "@/ui/client/roast-board";

export const metadata: Metadata = {
  title: "The Roast — Deb Laminated the Chore Chart Again",
  description:
    "This week's fictional roast. Bring wit, not cruelty. Then steal a system that actually works.",
};

export default function RoastPage() {
  const roast = currentRoast;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-2">
        <Kicker>The roast · this week</Kicker>
        <FictionBadge />
      </div>

      <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight">
        {roast.title}
      </h1>

      <DebIllustration className="mx-auto mt-6 w-64 sm:w-72" />

      <div className="mt-6 space-y-3 text-lg leading-relaxed">
        {roast.premise.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {/* The provenance boundary, stated where the content is */}
      <p className="mt-5 rounded-2xl border-2 border-mustard bg-mustard-soft px-4 py-3 text-sm font-semibold">
        {roast.fiction.label}
      </p>

      <div className="mt-10">
        <RoastBoard roast={roast} />
      </div>

      {/* The bridge — entertainment is the doorway, not the destination */}
      <section aria-labelledby="bridge" className="mt-12">
        <h2 id="bridge" className="font-display text-2xl font-extrabold">
          Okay, but the chart <span className="text-tomato">was</span> trying to solve something real
        </h2>
        <div className="mt-4 grid gap-4">
          {roast.bridges.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="group rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
            >
              <p className="font-display text-lg font-extrabold group-hover:text-tomato">
                {b.label} →
              </p>
              <p className="mt-1 text-sm text-ink-soft">{b.blurb}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
