import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCreator, getList, getSystem, systems } from "@/data";
import { CreatorAvatar } from "@/ui/avatar";
import { Kicker } from "@/ui/badges";
import { SystemCard } from "@/ui/cards";
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Kicker tone="sage">
        Household system · v{system.version} · updated {system.lastUpdated}
      </Kicker>
      <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">
        {system.title}
      </h1>
      <p className="mt-3 text-lg font-semibold leading-relaxed">{system.promise}</p>

      {/* Creator + household context — judge the fit */}
      <Link
        href={`/creators/${creator.handle}`}
        className="group mt-5 flex items-center gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
      >
        <CreatorAvatar creator={creator} size={48} />
        <div className="min-w-0">
          <p className="font-display font-extrabold group-hover:text-tomato">
            {creator.displayName}
          </p>
          <p className="truncate text-sm text-ink-soft">{creator.context.label}</p>
          <p className="text-xs font-semibold text-sage-deep">
            See the full household context →
          </p>
        </div>
      </Link>

      <div className="mt-5 flex flex-wrap gap-2">
        <SaveButton slug={system.slug} title={system.title} />
        {system.listSlugs.map((slug) => {
          const list = getList(slug);
          return list ? (
            <Link
              key={slug}
              href={`/lists/${slug}`}
              className="rounded-full border-2 border-ink bg-tomato px-4 py-2 text-sm font-extrabold text-cream shadow-[3px_3px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
            >
              Open the list: {list.title} →
            </Link>
          ) : null;
        })}
      </div>

      {/* The problem */}
      <section aria-labelledby="problem" className="mt-10">
        <h2 id="problem" className="font-display text-2xl font-extrabold">
          The problem
        </h2>
        <p className="mt-2 leading-relaxed text-ink-soft">{system.problem}</p>
      </section>

      {/* The story — why this exists, what failed, what changed */}
      <section aria-labelledby="story" className="mt-8">
        <h2 id="story" className="font-display text-2xl font-extrabold">
          The story
        </h2>
        <div className="mt-3 space-y-5">
          {system.story.map((section) => (
            <div key={section.heading} className="border-l-4 border-mustard pl-4">
              <h3 className="font-display text-lg font-extrabold">{section.heading}</h3>
              <p className="mt-1 leading-relaxed text-ink-soft">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Routines */}
      {system.routines.length > 0 && (
        <section aria-labelledby="routines" className="mt-10">
          <h2 id="routines" className="font-display text-2xl font-extrabold">
            The routine{system.routines.length > 1 ? "s" : ""}
          </h2>
          {system.routines.map((routine) => (
            <div
              key={routine.title}
              className="mt-4 rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#221a14]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-extrabold">{routine.title}</h3>
                <p className="text-xs font-bold uppercase tracking-wide text-sage-deep">
                  {routine.frequency}
                </p>
              </div>
              <ol className="mt-3 space-y-3">
                {routine.steps.map((step) => (
                  <li key={step.when + step.what} className="flex gap-3">
                    <span className="min-w-24 shrink-0 text-sm font-extrabold text-tomato">
                      {step.when}
                    </span>
                    <span className="text-sm leading-relaxed text-ink-soft">{step.what}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      )}

      {/* Recipes */}
      {system.recipes.length > 0 && (
        <section aria-labelledby="recipes" className="mt-10">
          <h2 id="recipes" className="font-display text-2xl font-extrabold">
            From this system&apos;s kitchen
          </h2>
          {system.recipes.map((recipe) => (
            <div
              key={recipe.title}
              className="mt-4 rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#221a14]"
            >
              <h3 className="font-display text-xl font-extrabold">{recipe.title}</h3>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-sage-deep">
                {recipe.servings} · {recipe.time}
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                    Ingredients
                  </h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                    {recipe.ingredients.map((ing) => (
                      <li key={ing}>{ing}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                    Method
                  </h4>
                  <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
                    {recipe.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
              {recipe.note && (
                <p className="mt-3 border-l-4 border-mustard pl-3 text-sm italic text-ink-soft">
                  {recipe.note}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Affiliate disclosure — visible where the economics are */}
      {system.disclosure && (
        <p className="mt-10 rounded-2xl border-2 border-ink bg-sage-soft p-4 text-sm">
          <span className="font-extrabold">Affiliate disclosure:</span>{" "}
          {system.disclosure}
        </p>
      )}

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
