import type { Metadata } from "next";
import { getCreator, situations, systemsForSituation } from "@/data";
import { Kicker } from "@/ui/badges";
import { SystemCard } from "@/ui/cards";

export const metadata: Metadata = {
  title: "Find Help",
  description:
    "Find household systems by the situation you're actually in — first baby, gluten-free household, big-family logistics, and more.",
};

export default function FindHelpPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Kicker tone="sage">Find help</Kicker>
      <h1 className="mt-2 font-display text-4xl font-extrabold">
        Start from someone&apos;s proven system, not from zero
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        Pick the situation that looks like your life. Every system shows the
        household it comes from, so you can judge whether it transfers to yours.
      </p>

      {/* jump nav */}
      <nav aria-label="Situations" className="mt-6 flex flex-wrap gap-2">
        {situations.map((s) => (
          <a
            key={s.slug}
            href={`#${s.slug}`}
            className="rounded-full border-2 border-ink bg-paper px-3.5 py-1.5 text-sm font-bold transition-colors hover:bg-sage hover:text-cream"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-12">
        {situations.map((situation) => {
          const matched = systemsForSituation(situation.tag);
          return (
            <section key={situation.slug} id={situation.slug} aria-labelledby={`h-${situation.slug}`} className="scroll-mt-24">
              <h2 id={`h-${situation.slug}`} className="font-display text-2xl font-extrabold">
                {situation.label}
              </h2>
              <p className="mt-1 text-ink-soft">{situation.hook}</p>
              {matched.length > 0 ? (
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {matched.map((system) => {
                    const creator = getCreator(system.creatorHandle);
                    return creator ? (
                      <SystemCard key={system.slug} system={system} creator={creator} />
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border-2 border-dashed border-ink/40 bg-cream p-4 text-sm text-ink-soft">
                  No published system covers this yet — honest gap, not a broken
                  page. As creators join, their systems land here.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
