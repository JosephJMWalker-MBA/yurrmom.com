import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body-stack",
});

export const metadata: Metadata = {
  title: {
    default: "YurrMom — Steal a household system that actually works",
    template: "%s · YurrMom",
  },
  description:
    "YurrMom preserves and distributes practical household knowledge so families don't have to reinvent everyday life from scratch.",
};

const navLinks = [
  { href: "/find-help", label: "Find Help" },
  { href: "/creators", label: "Creators" },
  { href: "/roast", label: "Roast" },
  { href: "/shop", label: "Shop" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-cream"
        >
          Skip to content
        </a>

        <header className="no-print sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur">
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3"
          >
            <Link
              href="/"
              className="font-display text-lg font-extrabold tracking-tight sm:text-xl"
            >
              YURR<span className="text-tomato">MOM</span>
              <span className="text-mustard">.</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-5">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[13px] font-semibold text-ink-soft transition-colors hover:text-tomato sm:text-sm"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        <main id="main">{children}</main>

        <footer className="no-print mt-16 border-t-2 border-ink bg-ink text-cream">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <p className="font-display text-xl font-bold">
              YURR<span className="text-tomato">MOM</span>
              <span className="text-mustard">.</span>
            </p>
            <p className="mt-2 max-w-xl text-sm text-cream/80">
              We preserve and distribute practical household knowledge, so
              families can start from proven experience instead of from zero.
              Humor gets you in the door. The systems are why you stay.
            </p>

            <div className="mt-6 grid gap-6 text-sm sm:grid-cols-3">
              <div>
                <p className="font-semibold text-mustard">The site</p>
                <ul className="mt-2 space-y-1 text-cream/80">
                  <li><Link className="hover:text-cream" href="/find-help">Find Help</Link></li>
                  <li><Link className="hover:text-cream" href="/creators">Creators</Link></li>
                  <li><Link className="hover:text-cream" href="/roast">The Roast</Link></li>
                  <li><Link className="hover:text-cream" href="/shop">Shop</Link></li>
                  <li><Link className="hover:text-cream" href="/about">About &amp; mission</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-mustard">The promises</p>
                <ul className="mt-2 space-y-1 text-cream/80">
                  <li>Creators keep 100% of their affiliate earnings.</li>
                  <li>Lists stay portable — no retailer owns them.</li>
                  <li>Roast subjects are fictional. Always.</li>
                  <li>YurrMom earns from its own merch, not from creators.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-mustard">Honesty notes</p>
                <ul className="mt-2 space-y-1 text-cream/80">
                  <li>This is a seeded preview build.</li>
                  <li>Retailer links open at the retailer — no cart sync yet.</li>
                  <li>Shop checkout opens when fulfillment is truly connected.</li>
                  <li>Nothing here pretends to be integrated when it isn&apos;t.</li>
                </ul>
              </div>
            </div>

            <p className="mt-8 border-t border-cream/20 pt-4 text-xs text-cream/60">
              Affiliate disclosure: creator pages may contain the creator&apos;s own
              affiliate links, marked where they appear. Purchases through them may
              earn that creator a commission. YurrMom takes 0% of creator affiliate
              earnings.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
