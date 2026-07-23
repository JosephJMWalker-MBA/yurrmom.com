import type { Metadata } from "next";
import Link from "next/link";
import { getCreator } from "@/data";
import { SEED_IDENTITY_HANDLE } from "@/data/workspace-repo";
import { IdentityBadge } from "@/ui/studio/status";

export const metadata: Metadata = {
  title: { default: "Studio", template: "%s · Studio · YurrMom" },
  description: "The YurrMom creator workspace — document a household system once.",
};

const studioLinks = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/systems", label: "Systems" },
  { href: "/studio/capture", label: "Capture" },
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
          <nav aria-label="Studio" className="flex items-center gap-4">
            <span className="font-display text-sm font-extrabold uppercase tracking-wide text-sage-deep">
              Studio
            </span>
            {studioLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] font-semibold text-ink-soft transition-colors hover:text-sage-deep"
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
