import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCreator, getList, getSystem, systems } from "@/data";
import { SystemCard } from "@/ui/cards";
import { SystemArticle } from "@/ui/system-article";
import { SaveButton } from "@/ui/client/save-button";

export function generateStaticParams() {
  return systems.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const system = getSystem((await params).slug);
  return system ? { title: system.title, description: system.promise } : {};
}

export default async function SystemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const system = getSystem((await params).slug);
  if (!system) notFound();
  const creator = getCreator(system.creatorHandle);
  if (!creator) notFound();

  const lists = system.listSlugs
    .map((slug) => getList(slug))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SystemArticle
        system={system}
        creator={creator}
        lists={lists}
        mode="public"
        actions={<SaveButton slug={system.slug} title={system.title} />}
      />

      {/* Related systems */}
      <section aria-labelledby="related" className="mt-10">
        <h2 id="related" className="font-display text-2xl font-extrabold">
          Related systems
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {system.relatedSystemSlugs.map((slug) => {
            const related = getSystem(slug);
            const relatedCreator = related && getCreator(related.creatorHandle);
            return related && relatedCreator ? (
              <SystemCard key={slug} system={related} creator={relatedCreator} />
            ) : null;
          })}
        </div>
      </section>
    </div>
  );
}
