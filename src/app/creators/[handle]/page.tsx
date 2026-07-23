import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { creators, getCreator, getSystem } from "@/data";
import { CreatorAvatar } from "@/ui/avatar";
import { Kicker } from "@/ui/badges";
import { SystemCard } from "@/ui/cards";

export function generateStaticParams() {
  return creators.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const creator = getCreator((await params).handle);
  return creator
    ? { title: creator.displayName, description: creator.tagline }
    : {};
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const creator = getCreator((await params).handle);
  if (!creator) notFound();

  const ctx = creator.context;
  const contextRows: [string, string][] = [
    ["Household", ctx.householdSize],
    ["Kids' ages", ctx.ageRanges.join(", ") || "—"],
    ["Diet", ctx.diet.join(" · ")],
    ["Hard constraints", ctx.constraints.join(" · ")],
    ["Budget", ctx.budgetOrientation],
    ["Schedule", ctx.schedule],
    ["Stores used", ctx.storesUsed.join(", ")],
    ...(ctx.caregiving ? ([["Caregiving", ctx.caregiving.join(" · ")]] as [string, string][]) : []),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <CreatorAvatar creator={creator} size={84} />
        <div>
          <Kicker tone="sage">Creator</Kicker>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            {creator.displayName}
          </h1>
          <p className="text-sm font-semibold text-ink-soft">
            @{creator.handle}
            {creator.pronouns ? ` · ${creator.pronouns}` : ""}
          </p>
        </div>
      </div>

      <p className="mt-4 font-display text-xl font-bold text-tomato">
        {creator.tagline}
      </p>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{creator.bio}</p>

      {/* Context before popularity — the household this advice comes from */}
      <section aria-labelledby="context" className="mt-8">
        <h2 id="context" className="font-display text-2xl font-extrabold">
          The household behind the advice
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Context is what makes a system transferable — check the fit before you
          adopt the method.
        </p>
        <dl className="mt-4 grid gap-3 rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#221a14] sm:grid-cols-2">
          {contextRows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                {label}
              </dt>
              <dd className="text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="specialties" className="mt-8">
        <h2 id="specialties" className="font-display text-2xl font-extrabold">
          Knows their way around
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {creator.specialties.map((s) => (
            <li
              key={s}
              className="rounded-full bg-sage-soft px-3 py-1 text-sm font-semibold text-sage-deep"
            >
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="their-systems" className="mt-10">
        <h2 id="their-systems" className="font-display text-2xl font-extrabold">
          {creator.displayName.split(" ")[0]}&apos;s systems
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {creator.systemSlugs.map((slug) => {
            const system = getSystem(slug);
            return system ? (
              <SystemCard key={slug} system={system} creator={creator} />
            ) : null;
          })}
        </div>
      </section>

      <section aria-labelledby="elsewhere" className="mt-10">
        <h2 id="elsewhere" className="font-display text-2xl font-extrabold">
          Also publishing on
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Creators keep their own channels and audiences — yurrmom.com is an
          additional home for the structured version, never a replacement.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {creator.externalChannels.map((ch) => (
            <li key={ch.label}>
              <a
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-sm font-bold transition-colors hover:bg-mustard"
              >
                {ch.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 rounded-2xl border-2 border-ink bg-sage-soft p-4 text-sm">
        <span className="font-extrabold">The deal:</span> {creator.displayName.split(" ")[0]}&apos;s
        systems may include their own affiliate links, marked wherever they appear.
        Purchases through them may earn {creator.displayName.split(" ")[0]} a commission —{" "}
        <span className="font-extrabold">yurrmom.com takes 0%.</span>{" "}
        <Link href="/about" className="font-bold underline decoration-sage decoration-2 underline-offset-2">
          Why that&apos;s the whole point →
        </Link>
      </p>
    </div>
  );
}
