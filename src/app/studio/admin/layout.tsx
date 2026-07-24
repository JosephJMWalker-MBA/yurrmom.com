import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Studio · yurrmom.com" },
  description: "Local-device moderation, curation, and platform administration prototype.",
};

const adminTabs = [
  { href: "/studio/admin", label: "Overview" },
  { href: "/studio/admin/moderation", label: "Moderation" },
  { href: "/studio/admin/roast", label: "Roast" },
  { href: "/studio/admin/featured", label: "Featured" },
  { href: "/studio/admin/taxonomy", label: "Taxonomy" },
  { href: "/studio/admin/integrations", label: "Integrations" },
];

/**
 * Platform-administration shell (Phase 9). This is a device-local PROTOTYPE —
 * there is no authentication, no roles, and no shared state. The banner says so
 * wherever an admin works.
 */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <div className="rounded-2xl border border-tomato/40 bg-tomato/5 px-4 py-2.5 text-xs font-semibold text-tomato-deep">
        Local-device admin prototype — no authentication, no roles, no shared state. Every action here saves to this device only and is
        never globally published. This is not production moderation infrastructure.
      </div>

      <nav
        aria-label="Admin sections"
        className="mt-4 flex flex-wrap gap-2 overflow-x-auto border-b border-ink/10 pb-3"
      >
        {adminTabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="shrink-0 rounded-full border border-ink/20 bg-paper px-3.5 py-1.5 text-[13px] font-bold text-ink-soft transition-colors hover:border-sage hover:text-sage-deep"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
