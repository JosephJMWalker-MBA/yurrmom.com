"use client";

import { useEffect, useState } from "react";
import type { PortableList } from "@/domain/types";
import { AdapterBadge, AffiliateBadge, CreatorLinkBadge } from "@/ui/badges";
import { adapters } from "@/adapters/states";
import { download, listToCsv, listToJson, listToPlainText } from "@/lib/export";

/**
 * The portable list, live: checkoff persists on-device; print/copy/export are
 * honest local actions; retailer links open at the retailer (link-only state).
 * No cart sync exists, so none is offered (docs/05).
 */
export function ListInteractive({ list }: { list: PortableList }) {
  const storageKey = `ym:list:${list.slug}:checked`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* private mode etc. — checkoff just won't persist */
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked, loaded, storageKey]);

  const doneCount = list.items.filter((i) => checked[i.id]).length;

  async function copyList() {
    try {
      await navigator.clipboard.writeText(listToPlainText(list));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const btn =
    "rounded-full border-2 border-ink bg-paper px-4 py-2 text-sm font-bold transition-colors hover:bg-mustard focus-visible:outline focus-visible:outline-2 focus-visible:outline-tomato";

  return (
    <div>
      {/* Action bar — every button here genuinely works, on-device */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className={btn} onClick={copyList} aria-live="polite">
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => download(`${list.slug}.csv`, "text/csv", listToCsv(list))}
        >
          Export CSV
        </button>
        <button
          type="button"
          className={btn}
          onClick={() =>
            download(`${list.slug}.json`, "application/json", listToJson(list))
          }
        >
          Export JSON
        </button>
        <span className="ml-1 text-xs font-semibold text-ink-soft">
          {doneCount}/{list.items.length} checked
        </span>
      </div>

      {/* Honest boundary: what we deliberately do NOT pretend to do */}
      <p className="no-print mt-3 rounded-xl border border-ink/15 bg-cream px-3 py-2 text-xs text-ink-soft">
        <span className="font-bold text-ink">Cart sync:</span>{" "}
        {adapters.cartSync.publicNote}{" "}
        <AdapterBadge state={adapters.cartSync.state} />
      </p>

      {/* The list itself */}
      <ul className="mt-6 space-y-4">
        {list.items.map((item) => (
          <li
            key={item.id}
            className="print-plain rounded-2xl border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_0_#221a14]"
          >
            <div className="flex items-start gap-3">
              <input
                id={`chk-${item.id}`}
                type="checkbox"
                className="ym-check no-print mt-1 size-5 shrink-0 accent-sage"
                checked={!!checked[item.id]}
                onChange={(e) =>
                  setChecked((c) => ({ ...c, [item.id]: e.target.checked }))
                }
                aria-label={`Check off: ${item.need}`}
              />
              <span className="min-w-0 flex-1">
                <label
                  htmlFor={`chk-${item.id}`}
                  className="font-display text-base font-extrabold leading-snug"
                >
                  {item.need}
                </label>
                <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
                  {item.quantity} · {item.recurrence}
                </span>

                {item.preferred && (
                  <span className="mt-3 block rounded-xl bg-sage-soft/60 p-3">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wide text-sage-deep">
                      Creator&apos;s pick
                    </span>
                    <span className="block font-semibold">{item.preferred.name}</span>
                    <span className="mt-0.5 block text-sm text-ink-soft">
                      {item.preferred.why}
                    </span>
                    {item.preferred.offers.length > 0 && (
                      <span className="no-print mt-2 flex flex-wrap items-center gap-2">
                        {item.preferred.offers.map((offer) => (
                          <a
                            key={offer.retailer}
                            href={offer.url}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="inline-flex items-center gap-1 rounded-full border-2 border-sage-deep bg-paper px-3 py-1 text-xs font-bold text-sage-deep transition-colors hover:bg-sage-deep hover:text-cream"
                          >
                            {offer.retailer} ↗
                          </a>
                        ))}
                        {item.preferred.offers.some((o) => o.affiliate) ? (
                          <AffiliateBadge />
                        ) : (
                          <CreatorLinkBadge />
                        )}
                      </span>
                    )}
                  </span>
                )}

                {item.substitutions.length > 0 && (
                  <span className="mt-2 block">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                      Subs that work
                    </span>
                    <span className="mt-1 block space-y-1">
                      {item.substitutions.map((sub) => (
                        <span key={sub.name} className="block text-sm text-ink-soft">
                          <span className="font-semibold text-ink">{sub.name}</span> — {sub.note}
                        </span>
                      ))}
                    </span>
                  </span>
                )}

                {item.notes && (
                  <span className="mt-2 block border-l-4 border-mustard pl-3 text-sm italic text-ink-soft">
                    {item.notes}
                  </span>
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
