import Link from "next/link";
import type { Creator, HouseholdSystem } from "@/domain/types";
import { CreatorAvatar } from "./avatar";
import { Kicker } from "./badges";

export function SystemCard({
  system,
  creator,
}: {
  system: HouseholdSystem;
  creator: Creator;
}) {
  return (
    <Link
      href={`/systems/${system.slug}`}
      className="group flex h-full flex-col rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
    >
      <Kicker tone="sage">Household system · v{system.version}</Kicker>
      <h3 className="mt-2 font-display text-xl font-extrabold leading-tight group-hover:text-tomato">
        {system.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{system.promise}</p>
      <div className="mt-4 flex items-center gap-2 border-t border-ink/10 pt-3">
        <CreatorAvatar creator={creator} size={30} />
        <div className="min-w-0 text-xs">
          <p className="font-bold">{creator.displayName}</p>
          <p className="truncate text-ink-soft">{creator.context.label}</p>
        </div>
      </div>
    </Link>
  );
}

export function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <Link
      href={`/creators/${creator.handle}`}
      className="group flex h-full flex-col rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#221a14] transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3">
        <CreatorAvatar creator={creator} size={48} />
        <div>
          <h3 className="font-display text-lg font-extrabold leading-tight group-hover:text-tomato">
            {creator.displayName}
          </h3>
          <p className="text-xs font-semibold text-ink-soft">{creator.context.label}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{creator.tagline}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {creator.specialties.slice(0, 3).map((s) => (
          <li
            key={s}
            className="rounded-full bg-sage-soft px-2 py-0.5 text-[11px] font-semibold text-sage-deep"
          >
            {s}
          </li>
        ))}
      </ul>
    </Link>
  );
}
