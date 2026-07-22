import type { Metadata } from "next";
import { creators } from "@/data";
import { Kicker } from "@/ui/badges";
import { CreatorCard } from "@/ui/cards";

export const metadata: Metadata = {
  title: "Creators",
  description:
    "Household creators with real context — find the one whose life looks like yours.",
};

export default function CreatorsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Kicker tone="sage">Creators</Kicker>
      <h1 className="mt-2 font-display text-4xl font-extrabold">
        Find someone whose life looks like yours
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        Relevance beats reach. We show you household context — size, constraints,
        budget, stores, schedule — not follower counts.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {creators.map((creator) => (
          <CreatorCard key={creator.handle} creator={creator} />
        ))}
      </div>

      <section className="mt-12 rounded-3xl border-2 border-ink bg-sage px-6 py-8 text-cream shadow-[6px_6px_0_0_#221a14]">
        <h2 className="font-display text-2xl font-extrabold">
          Run a household system worth stealing?
        </h2>
        <p className="mt-2 max-w-2xl text-cream/90">
          Document it once here, keep your audience, your links, and 100% of your
          affiliate earnings. The creator workspace opens in an upcoming build —
          this page is where its door will be.
        </p>
      </section>
    </div>
  );
}
