import type { Metadata } from "next";
import Link from "next/link";
import { getCreator } from "@/data";
import { SEED_IDENTITY_HANDLE } from "@/data/workspace-repo";
import { IdentityBadge } from "@/ui/studio/status";
import { copy } from "@/i18n";

export const metadata: Metadata = {
  title: { default: "Studio", template: "%s · Studio · yurrmom.com" },
  description: "The yurrmom.com creator workspace — document a household system once.",
};

const studioLinks = [
  { href: "/studio", label: copy.studio.overview },
  { href: "/studio/systems", label: copy.studio.systems },
  { href: "/studio/content", label: copy.studio.content },
  { href: "/studio/capture", label: copy.studio.capture },
  { href: "/studio/intelligence", label: copy.studio.intelligence },
  { href: "/studio/references", label: copy.studio.references },
];

/**
 * Creator workspace shell. Calmer than the public site, same brand.
 * Identity is the honest seeded creator — no authentication in this phase.
 */
export default function StudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const creator = getCreator(SEED_IDENTITY_HANDLE);
  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-ink/15 bg-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <nav
            aria-label={copy.studio.navLabel}
            className="flex min-w-0 items-center gap-4 overflow-x-auto whitespace-nowrap"
          >
            <span className="shrink-0 font-display text-sm font-extrabold uppercase tracking-wide text-sage-deep">
              {copy.studio.name}
            </span>
            {studioLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 text-[13px] font-semibold text-ink-soft transition-colors hover:text-sage-deep"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <IdentityBadge name={creator?.displayName ?? "Creator"} />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
