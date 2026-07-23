import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Link from "next/link";
import { copy } from "@/i18n";
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
    default: "yurrmom.com — Steal a household system that actually works",
    template: "%s · yurrmom.com",
  },
  description:
    "yurrmom.com preserves and distributes practical household knowledge so families don't have to reinvent everyday life from scratch.",
};

const navLinks = [
  { href: "/find-help", label: copy.nav.findHelp },
  { href: "/creators", label: copy.nav.creators },
  { href: "/roast", label: copy.nav.roast },
  { href: "/shop", label: copy.nav.shop },
  { href: "/studio", label: copy.nav.studio },
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
          {copy.nav.skipToContent}
        </a>

        <header className="no-print sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur">
          <nav
            aria-label={copy.nav.mainNavLabel}
            className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3"
          >
            <Link
              href="/"
              className="font-display text-lg font-extrabold tracking-tight sm:text-xl"
            >
              yurr<span className="text-tomato">mom</span>
              <span className="text-mustard">.com</span>
            </Link>
            <div className="flex min-w-0 items-center gap-3 overflow-x-auto whitespace-nowrap sm:gap-5">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="shrink-0 text-[13px] font-semibold text-ink-soft transition-colors hover:text-tomato sm:text-sm"
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
              yurr<span className="text-tomato">mom</span>
              <span className="text-mustard">.com</span>
            </p>
            <p className="mt-2 max-w-xl text-sm text-cream/80">
              {copy.footer.mission}
            </p>

            <div className="mt-6 grid gap-6 text-sm sm:grid-cols-3">
              <div>
                <p className="font-semibold text-mustard">{copy.footer.siteHeading}</p>
                <ul className="mt-2 space-y-1 text-cream/80">
                  <li><Link className="hover:text-cream" href="/find-help">{copy.nav.findHelp}</Link></li>
                  <li><Link className="hover:text-cream" href="/creators">{copy.nav.creators}</Link></li>
                  <li><Link className="hover:text-cream" href="/roast">{copy.footer.theRoast}</Link></li>
                  <li><Link className="hover:text-cream" href="/shop">{copy.nav.shop}</Link></li>
                  <li><Link className="hover:text-cream" href="/about">{copy.footer.aboutMission}</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-mustard">{copy.footer.promisesHeading}</p>
                <ul className="mt-2 space-y-1 text-cream/80">
                  <li>{copy.footer.promiseEarnings}</li>
                  <li>{copy.footer.promisePortable}</li>
                  <li>{copy.footer.promiseFictional}</li>
                  <li>{copy.footer.promiseMerch}</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-mustard">{copy.footer.honestyHeading}</p>
                <ul className="mt-2 space-y-1 text-cream/80">
                  <li>{copy.footer.honestyPreview}</li>
                  <li>{copy.footer.honestyLinks}</li>
                  <li>{copy.footer.honestyCheckout}</li>
                  <li>{copy.footer.honestyNoPretending}</li>
                </ul>
              </div>
            </div>

            <p className="mt-8 border-t border-cream/20 pt-4 text-xs text-cream/60">
              {copy.footer.affiliateDisclosure}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
