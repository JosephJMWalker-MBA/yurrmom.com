import type { Metadata } from "next";
import Link from "next/link";
import { Kicker } from "@/ui/badges";

export const metadata: Metadata = {
  title: "About — Why YurrMom exists",
  description:
    "YurrMom preserves and distributes practical household knowledge so families don't have to reinvent everyday life from scratch.",
};

/**
 * The manifesto lives HERE — the homepage teaches through use (docs/06 §5).
 */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Kicker>The mission</Kicker>
      <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">
        Nobody should have to reinvent Tuesday
      </h1>

      <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink-soft">
        <p>
          Every household develops hard-won systems — for meals, groceries,
          laundry, caregiving, school, night feeds, and a thousand small
          recurring decisions. That knowledge usually dies where it was born:
          scattered across group chats, camera rolls, notebooks, and memory.
        </p>
        <p>
          <span className="font-bold text-ink">
            YurrMom captures lived household experience as reusable systems
          </span>{" "}
          — with the context, the lists, the substitutions, and the story of
          what failed first — so another family can find one that resembles
          their life, adapt it, and act on it through whatever stores and
          services they already use.
        </p>
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl font-extrabold">The promises</h2>
        {[
          {
            title: "Creators are partners, not inventory.",
            body: "Creators keep their identity, audience, content, sponsorships, and affiliate accounts. YurrMom takes 0% of creator affiliate earnings — not a reduced rate, not a fee. Zero.",
          },
          {
            title: "Lists are portable.",
            body: "A YurrMom list describes needs, not SKUs. Print it, copy it, export it, check it off in any store, or open the creator's links. No retailer owns it.",
          },
          {
            title: "The roast is fictional. Always.",
            body: "Roast subjects are invented adult characters and archetypes — never identifiable real people, never kids, never protected traits. Ranking rewards wit; cruelty doesn't rank. Reporting and moderation are built in, not bolted on.",
          },
          {
            title: "Merch funds the platform.",
            body: "YurrMom earns from its own original merchandise. That native revenue is exactly why the creator promise can stay generous.",
          },
          {
            title: "Nothing pretends.",
            body: "Where an integration isn't live yet — carts, social publishing, fulfillment — the interface says so plainly instead of faking it. A smaller truthful product beats a shinier dishonest one.",
          },
        ].map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#221a14]"
          >
            <h3 className="font-display text-lg font-extrabold">{p.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.body}</p>
          </div>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/find-help"
          className="rounded-full border-2 border-ink bg-tomato px-5 py-2.5 font-bold text-cream shadow-[3px_3px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
        >
          Find a system →
        </Link>
        <Link
          href="/roast"
          className="rounded-full border-2 border-ink bg-paper px-5 py-2.5 font-bold transition-colors hover:bg-mustard"
        >
          Or start with a laugh
        </Link>
      </div>
    </div>
  );
}
