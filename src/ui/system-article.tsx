import Link from "next/link";
import type {
  Creator,
  HouseholdContext,
  HouseholdSystem,
  PortableList,
  SourceType,
} from "@/domain/types";
import { CreatorAvatar } from "@/ui/avatar";
import { Kicker } from "@/ui/badges";

const sourceTypeLabels: Record<SourceType, { label: string; caveat: string }> = {
  "personal-experience": {
    label: "Personal experience",
    caveat:
      "What worked in one real household — not medical, legal, nutritional, educational, or developmental advice.",
  },
  "professional-guidance": {
    label: "Professional guidance",
    caveat:
      "The creator states relevant professional experience. YurrMom labels this claim; it does not verify credentials.",
  },
  "sourced-reference": {
    label: "Sourced reference",
    caveat: "Relays external sources — weigh them yourself.",
  },
};

/**
 * The canonical public rendering of a household system. Shared verbatim by
 * the public route and the creator-workspace preview, so "preview" can never
 * drift from what publishing actually looks like.
 */
export function SystemArticle({
  system,
  creator,
  context,
  lists,
  mode,
  actions,
}: {
  system: HouseholdSystem;
  creator: Creator;
  /** The household context to display (workspace drafts carry their own). */
  context?: HouseholdContext;
  lists: PortableList[];
  mode: "public" | "preview";
  /** Extra action buttons (e.g. device-save) rendered next to list CTAs. */
  actions?: React.ReactNode;
}) {
  const ctx = context ?? creator.context;
  const listHref = (slug: string) =>
    mode === "public" ? `/lists/${slug}` : `#preview-list-${slug}`;

  return (
    <article>
      <Kicker tone="sage">
        Household system · v{system.version} · updated {system.lastUpdated}
      </Kicker>
      <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">
        {system.title || "Untitled system"}
      </h1>
      <p className="mt-3 text-lg font-semibold leading-relaxed">{system.promise}</p>

      {system.audience && (
        <p className="mt-2 text-sm text-ink-soft">
          <span className="font-bold text-ink">For:</span> {system.audience}
        </p>
      )}

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
          <p className="truncate text-sm text-ink-soft">{ctx.label}</p>
          <p className="text-xs font-semibold text-sage-deep">
            See the full household context →
          </p>
        </div>
      </Link>

      <div className="mt-5 flex flex-wrap gap-2">
        {actions}
        {lists.map((list) => (
          <a
            key={list.slug}
            href={listHref(list.slug)}
            className="rounded-full border-2 border-ink bg-tomato px-4 py-2 text-sm font-extrabold text-cream shadow-[3px_3px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
          >
            Open the list: {list.title || "Untitled list"} →
          </a>
        ))}
      </div>

      {/* The problem */}
      <section aria-labelledby="problem" className="mt-10">
        <h2 id="problem" className="font-display text-2xl font-extrabold">
          The problem
        </h2>
        <p className="mt-2 leading-relaxed text-ink-soft">{system.problem}</p>
        {system.observedResults && (
          <p className="mt-3 rounded-xl bg-sage-soft/60 p-3 text-sm leading-relaxed">
            <span className="font-extrabold text-sage-deep">
              What {creator.displayName.split(" ")[0]} has actually seen:
            </span>{" "}
            {system.observedResults}
          </p>
        )}
        {system.limitations && (
          <p className="mt-3 rounded-xl border border-ink/15 bg-cream p-3 text-sm leading-relaxed text-ink-soft">
            <span className="font-extrabold text-ink">Where it may not apply:</span>{" "}
            {system.limitations}
          </p>
        )}
      </section>

      {/* The story */}
      {system.story.length > 0 && (
        <section aria-labelledby="story" className="mt-8">
          <h2 id="story" className="font-display text-2xl font-extrabold">
            The story
          </h2>
          <div className="mt-3 space-y-5">
            {system.story.map((section, i) => (
              <div key={i} className="border-l-4 border-mustard pl-4">
                <h3 className="font-display text-lg font-extrabold">
                  {section.heading}
                </h3>
                <p className="mt-1 leading-relaxed text-ink-soft">{section.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Routines */}
      {system.routines.length > 0 && (
        <section aria-labelledby="routines" className="mt-10">
          <h2 id="routines" className="font-display text-2xl font-extrabold">
            The routine{system.routines.length > 1 ? "s" : ""}
          </h2>
          {system.routines.map((routine, i) => (
            <div
              key={i}
              className="mt-4 rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#221a14]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-extrabold">
                  {routine.title}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wide text-sage-deep">
                  {routine.frequency}
                </p>
              </div>
              {routine.prerequisites && routine.prerequisites.length > 0 && (
                <p className="mt-2 text-xs font-semibold text-ink-soft">
                  Before you start: {routine.prerequisites.join(" · ")}
                </p>
              )}
              <ol className="mt-3 space-y-3">
                {routine.steps.map((step, si) => (
                  <li key={si} className="flex gap-3">
                    <span className="min-w-24 shrink-0 text-sm font-extrabold text-tomato">
                      {step.when}
                    </span>
                    <span className="text-sm leading-relaxed text-ink-soft">
                      {step.what}
                    </span>
                  </li>
                ))}
              </ol>
              {routine.note && (
                <p className="mt-3 border-l-4 border-mustard pl-3 text-sm italic text-ink-soft">
                  {routine.note}
                </p>
              )}
              {routine.cred?.skillTaught && (
                <p className="mt-3 rounded-xl bg-sage-soft/60 p-2.5 text-xs font-semibold text-sage-deep">
                  👧 Teaches: {routine.cred.skillTaught}
                  {routine.cred.ageApplicability
                    ? ` · ${routine.cred.ageApplicability}`
                    : ""}
                  {routine.cred.supervisionLevel === "nearby"
                    ? " · adult nearby"
                    : routine.cred.supervisionLevel === "direct"
                      ? " · with an adult"
                      : ""}
                </p>
              )}
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
          {system.recipes.map((recipe, i) => (
            <div
              key={i}
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
                    {recipe.ingredients.map((ing, j) => (
                      <li key={j}>{ing}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                    Method
                  </h4>
                  <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
                    {recipe.steps.map((step, j) => (
                      <li key={j}>{step}</li>
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

      {/* Trust & provenance — content, not chrome */}
      {system.provenance && (
        <section
          aria-label="Trust and provenance"
          className="mt-10 rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#3d7a61]"
        >
          <h2 className="font-display text-xl font-extrabold">
            What kind of knowledge is this?
          </h2>
          <p className="mt-2 text-sm">
            <span className="rounded-full bg-sage-soft px-2.5 py-0.5 font-bold text-sage-deep">
              {sourceTypeLabels[system.provenance.sourceType].label}
            </span>
            {system.provenance.livedExperience && (
              <span className="ml-2 rounded-full border border-ink/20 px-2.5 py-0.5 text-xs font-bold text-ink-soft">
                Lived daily by the creator
              </span>
            )}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            {sourceTypeLabels[system.provenance.sourceType].caveat}
          </p>
          {system.provenance.creatorNote && (
            <p className="mt-2 border-l-4 border-sage pl-3 text-sm italic text-ink-soft">
              “{system.provenance.creatorNote}”
            </p>
          )}
          {system.provenance.lastReviewed && (
            <p className="mt-2 text-xs font-semibold text-ink-soft">
              Last reviewed for accuracy: {system.provenance.lastReviewed}
            </p>
          )}
        </section>
      )}

      {/* Affiliate disclosure */}
      {system.disclosure && (
        <p className="mt-6 rounded-2xl border-2 border-ink bg-sage-soft p-4 text-sm">
          <span className="font-extrabold">Affiliate disclosure:</span>{" "}
          {system.disclosure}
        </p>
      )}
    </article>
  );
}
