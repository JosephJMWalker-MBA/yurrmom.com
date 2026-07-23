import type { Metadata } from "next";
import Link from "next/link";
import { merch } from "@/data";
import { adapters } from "@/adapters/states";
import { AdapterBadge, Kicker, MerchBadge } from "@/ui/badges";
import { MerchArt } from "@/ui/merch-art";

export const metadata: Metadata = {
  title: "Shop — Original yurrmom.com Merch",
  description:
    "Original yurrmom.com merchandise. It funds the platform so creators keep 100% of their affiliate earnings.",
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-2">
        <Kicker>The shop</Kicker>
        <MerchBadge />
      </div>
      <h1 className="mt-2 font-display text-4xl font-extrabold">
        Merch with a business model
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        Every item here is an original yurrmom.com design. This is how the platform
        pays for itself — <span className="font-bold text-ink">so it never has to
        take a cut of a creator&apos;s affiliate earnings.</span> Buying a mug here
        literally funds the no-commission promise.
      </p>

      {/* The honest commerce boundary, stated once, up front */}
      <p className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-ink bg-cream p-4 text-sm">
        <AdapterBadge state={adapters.printfulFulfillment.state} />
        <span className="text-ink-soft">
          {adapters.printfulFulfillment.publicNote} No fake checkout here — when
          the buy button appears, it will actually work.
        </span>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {merch.map((item) => (
          <article
            key={item.slug}
            className="flex flex-col rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_0_#221a14]"
          >
            <div className="relative">
              <MerchArt item={item} className="w-full rounded-xl" />
              {item.badge && (
                <span className="absolute left-2 top-2 rounded-full border-2 border-ink bg-tomato px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-cream">
                  {item.badge}
                </span>
              )}
            </div>
            <h2 className="mt-3 font-display text-lg font-extrabold leading-tight">
              {item.title}
            </h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">
              {item.blurb}
            </p>
            {item.variants && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Variants">
                {item.variants.map((v) => (
                  <li
                    key={v}
                    className="rounded-full border border-ink/30 px-2 py-0.5 text-[11px] font-semibold text-ink-soft"
                  >
                    {v}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
              <p className="font-display text-lg font-extrabold text-sage-deep">
                {item.price}
              </p>
              <span
                className="rounded-full border-2 border-ink/30 bg-cream px-3 py-1.5 text-xs font-bold text-ink-soft"
                title={adapters.printfulFulfillment.publicNote}
              >
                Checkout opens with fulfillment
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Bridge back into the funnel */}
      <section className="mt-12 rounded-3xl border-2 border-ink bg-ink px-6 py-8 text-cream shadow-[6px_6px_0_0_#e9a63a]">
        <h2 className="font-display text-2xl font-extrabold">
          Came for the stickers, staying for the systems?
        </h2>
        <p className="mt-2 max-w-2xl text-cream/80">
          The archetypes on the stickers all have real fixes.{" "}
          <span className="font-bold text-mustard">Mount Washmore</span> has a laundry
          line. The <span className="font-bold text-mustard">Sacred Second Toaster</span>{" "}
          guards a celiac-safe kitchen. Deb… Deb is a work in progress.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/find-help"
            className="rounded-full border-2 border-cream px-5 py-2.5 font-bold transition-colors hover:bg-cream hover:text-ink"
          >
            Find your fix →
          </Link>
          <Link
            href="/roast"
            className="rounded-full border-2 border-cream/50 px-5 py-2.5 font-bold text-cream/80 transition-colors hover:border-cream hover:text-cream"
          >
            Back to the roast
          </Link>
        </div>
      </section>
    </div>
  );
}
