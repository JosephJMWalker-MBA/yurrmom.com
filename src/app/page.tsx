import Link from "next/link";
import { creators, currentRoast, getCreator, lists, merch, situations, systems } from "@/data";
import { FictionBadge, Kicker, MerchBadge } from "@/ui/badges";
import { SystemCard } from "@/ui/cards";
import { DebIllustration } from "@/ui/deb-art";
import { MerchArt } from "@/ui/merch-art";

/**
 * The homepage teaches the thesis through use, not a manifesto (docs/06 §5).
 * Eight beats: roast hook → bridge → situations → systems → lists →
 * creator invitation → merch → trust close.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* 1 — Roast hook: fast, funny, clearly fictional */}
      <section aria-labelledby="hook" className="grid items-center gap-6 py-10 sm:grid-cols-2 sm:py-14">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Kicker>This week&apos;s roast</Kicker>
            <FictionBadge />
          </div>
          <h1 id="hook" className="mt-3 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            Deb laminated the chore chart. <span className="text-tomato">Again.</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Version 47. The dog has a column. It has never once been followed.
            She laminated it so the tears wipe right off.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/roast"
              className="rounded-full border-2 border-ink bg-tomato px-6 py-3 font-display text-base font-extrabold text-cream shadow-[4px_4px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
            >
              Roast the chart →
            </Link>
          </div>
        </div>
        <DebIllustration className="mx-auto w-64 sm:w-80" />
      </section>

      {/* 2 — Immediate bridge to usefulness */}
      <section
        aria-label="From jokes to systems"
        className="rounded-3xl border-2 border-ink bg-ink px-6 py-8 text-cream shadow-[6px_6px_0_0_#dd4a24] sm:px-10"
      >
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
          Laughed? Good. <span className="text-mustard">Now steal a system that actually works.</span>
        </h2>
        <p className="mt-2 max-w-2xl text-cream/80">
          Every joke on this site points at a real household problem — and a real
          household somewhere already solved it, wrote it down, and put it here.
        </p>
        <Link
          href="/find-help"
          className="mt-5 inline-block rounded-full border-2 border-cream px-5 py-2.5 font-bold text-cream transition-colors hover:bg-cream hover:text-ink"
        >
          Find help for your situation →
        </Link>
      </section>

      {/* 3 — Find help by situation */}
      <section aria-labelledby="situations" className="py-12">
        <Kicker tone="sage">Start where you actually are</Kicker>
        <h2 id="situations" className="mt-2 font-display text-3xl font-extrabold">
          What&apos;s your situation?
        </h2>
        <ul className="mt-5 flex flex-wrap gap-2.5">
          {situations.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/find-help#${s.slug}`}
                className="inline-block rounded-full border-2 border-ink bg-paper px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_0_#221a14] transition-colors hover:bg-sage hover:text-cream"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 — Featured household systems */}
      <section aria-labelledby="featured" className="pb-12">
        <Kicker tone="sage">Proven at home, written down here</Kicker>
        <h2 id="featured" className="mt-2 font-display text-3xl font-extrabold">
          Featured household systems
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Not product roundups — complete operating methods, with the story of
          what failed before they worked.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {systems.map((system) => {
            const creator = getCreator(system.creatorHandle);
            return creator ? (
              <SystemCard key={system.slug} system={system} creator={creator} />
            ) : null;
          })}
        </div>
      </section>

      {/* 5 — Popular portable lists */}
      <section aria-labelledby="lists" className="pb-12">
        <Kicker tone="sage">Yours to print, copy, export, adapt</Kicker>
        <h2 id="lists" className="mt-2 font-display text-3xl font-extrabold">
          Portable lists
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          A YurrMom list belongs to you, not to a retailer. Check it off in the
          store, print it, export it, or open the creator&apos;s links — your call.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {lists.map((list) => (
            <Link
              key={list.slug}
              href={`/lists/${list.slug}`}
              className="group rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                {list.items.length} needs · portable
              </p>
              <h3 className="mt-1 font-display text-lg font-extrabold leading-tight group-hover:text-tomato">
                {list.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{list.intro}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 6 — Creator invitation */}
      <section
        aria-labelledby="creator-invite"
        className="rounded-3xl border-2 border-ink bg-sage px-6 py-10 text-cream shadow-[6px_6px_0_0_#221a14] sm:px-10"
      >
        <Kicker tone="mustard">For creators</Kicker>
        <h2 id="creator-invite" className="mt-2 font-display text-3xl font-extrabold">
          Explain it once. Publish it everywhere.
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <p className="leading-relaxed text-cream/90">
            Document the system you already run — the context, the lists, the
            why. YurrMom turns that one source into a durable resource plus
            channel-ready drafts for the places you already post.
          </p>
          <div className="rounded-2xl border-2 border-cream/40 bg-sage-deep p-4">
            <p className="font-display text-xl font-extrabold text-mustard">
              You keep 100% of your affiliate earnings.
            </p>
            <p className="mt-1 text-sm text-cream/90">
              Your links, your attribution, your sponsors, your audience. YurrMom
              takes zero commission — the platform pays for itself with its own
              merch, not with a cut of yours.
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm text-cream/80">
          The creator workspace opens in an upcoming build — meet the founding
          creators <Link href="/creators" className="font-bold underline decoration-mustard decoration-2 underline-offset-2">here</Link>.
        </p>
      </section>

      {/* 7 — YurrMom merchandise */}
      <section aria-labelledby="merch" className="py-12">
        <div className="flex flex-wrap items-center gap-2">
          <Kicker>The shop</Kicker>
          <MerchBadge />
        </div>
        <h2 id="merch" className="mt-2 font-display text-3xl font-extrabold">
          Merch that pays the bills — <span className="text-tomato">ours, not the creators&apos;</span>
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Original YurrMom designs fund the platform. That&apos;s the whole business
          model, and it&apos;s why creator links stay commission-free.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {merch.slice(0, 4).map((item) => (
            <Link
              key={item.slug}
              href="/shop"
              className="group rounded-2xl border-2 border-ink bg-paper p-3 shadow-[4px_4px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
            >
              <MerchArt item={item} className="w-full rounded-xl" />
              <p className="mt-2 font-display text-sm font-extrabold leading-tight group-hover:text-tomato">
                {item.title}
              </p>
              <p className="text-sm font-bold text-sage-deep">{item.price}</p>
            </Link>
          ))}
        </div>
        <Link
          href="/shop"
          className="mt-5 inline-block rounded-full border-2 border-ink bg-mustard px-5 py-2.5 font-bold shadow-[3px_3px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
        >
          Browse the shop →
        </Link>
      </section>

      {/* 8 — Mission / trust close */}
      <section
        aria-labelledby="mission"
        className="mb-4 rounded-3xl border-2 border-ink bg-paper px-6 py-8 shadow-[6px_6px_0_0_#3d7a61] sm:px-10"
      >
        <h2 id="mission" className="font-display text-2xl font-extrabold">
          Why this exists
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          Every household reinvents daily life from scratch — meals, laundry,
          groceries, night feeds — as if nobody ever solved it before. They have.
          YurrMom captures that lived experience as reusable systems and portable
          lists, so you can start from proven instead of from zero. Creators keep
          ownership of everything they bring: their audience, their content, their
          affiliate earnings. Humor gets people in the door; usefulness is why they stay.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">
          <Link href="/about" className="underline decoration-tomato decoration-2 underline-offset-4 hover:text-tomato">
            The full mission →
          </Link>
          <Link href="/creators" className="underline decoration-sage decoration-2 underline-offset-4 hover:text-sage">
            Meet the creators ({creators.length}) →
          </Link>
          <Link href="/roast" className="underline decoration-mustard decoration-2 underline-offset-4 hover:text-mustard">
            About {currentRoast.characterName}, who is not real →
          </Link>
        </div>
      </section>
    </div>
  );
}
