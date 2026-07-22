import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCreator, getList, getSystem, lists } from "@/data";
import { Kicker } from "@/ui/badges";
import { ListInteractive } from "@/ui/client/list-interactive";

export function generateStaticParams() {
  return lists.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const list = getList((await params).slug);
  return list ? { title: list.title, description: list.intro } : {};
}

export default async function ListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const list = getList((await params).slug);
  if (!list) notFound();
  const system = getSystem(list.systemSlug);
  const creator = system && getCreator(system.creatorHandle);
  if (!system || !creator) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Kicker tone="sage">Portable list</Kicker>
      <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">
        {list.title}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">{list.intro}</p>

      <p className="no-print mt-3 text-sm">
        From{" "}
        <Link
          href={`/systems/${system.slug}`}
          className="font-bold underline decoration-sage decoration-2 underline-offset-2 hover:text-sage"
        >
          {system.title}
        </Link>{" "}
        by{" "}
        <Link
          href={`/creators/${creator.handle}`}
          className="font-bold underline decoration-sage decoration-2 underline-offset-2 hover:text-sage"
        >
          {creator.displayName}
        </Link>{" "}
        — the list makes more sense with the system&apos;s story behind it.
      </p>

      {/* How to read this list — the portable-list anatomy, taught once */}
      <div className="no-print mt-5 rounded-2xl border-2 border-ink bg-mustard-soft p-4 text-sm">
        <p className="font-extrabold">How a portable list works</p>
        <p className="mt-1 text-ink-soft">
          The <span className="font-bold text-ink">need</span> is the point — it works
          at any store. The <span className="font-bold text-ink">creator&apos;s pick</span>{" "}
          is their proven choice, <span className="font-bold text-ink">subs</span> are
          pre-approved alternatives, and quantities and recurrence tell you how much
          and how often. No retailer owns this list.
        </p>
      </div>

      <div className="mt-6">
        <ListInteractive list={list} />
      </div>

      {/* Affiliate disclosure — where the links are */}
      {system.disclosure && (
        <p className="mt-8 rounded-2xl border-2 border-ink bg-sage-soft p-4 text-sm">
          <span className="font-extrabold">Affiliate disclosure:</span>{" "}
          {system.disclosure}
        </p>
      )}

      <div className="no-print mt-8 flex flex-wrap gap-3">
        <Link
          href={`/systems/${system.slug}`}
          className="rounded-full border-2 border-ink bg-paper px-4 py-2 text-sm font-bold transition-colors hover:bg-mustard"
        >
          ← Back to the system
        </Link>
        <Link
          href="/find-help"
          className="rounded-full border-2 border-ink bg-paper px-4 py-2 text-sm font-bold transition-colors hover:bg-mustard"
        >
          Find more help →
        </Link>
      </div>
    </div>
  );
}
