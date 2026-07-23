import type { AdapterState } from "@/domain/types";
import { stateLabels } from "@/adapters/states";

/**
 * The honesty system, rendered. These badges are how the four provenance
 * boundaries (docs/07) stay visible at all times:
 * fiction labels, creator-affiliate marks, yurrmom.com-merch marks, adapter states.
 */

export function FictionBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-ink bg-mustard px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink ${className}`}
    >
      100% fictional
    </span>
  );
}

export function AffiliateBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-sage-soft px-2 py-0.5 text-[11px] font-semibold text-sage-deep">
      creator&apos;s affiliate link
    </span>
  );
}

export function CreatorLinkBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-sage-soft px-2 py-0.5 text-[11px] font-semibold text-sage-deep">
      creator&apos;s link
    </span>
  );
}

export function MerchBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-ink bg-cream px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink">
      yurrmom.com original
    </span>
  );
}

export function AdapterBadge({ state }: { state: AdapterState }) {
  const tone =
    state === "planned" || state === "unavailable"
      ? "bg-cream text-ink-soft border-ink-soft/40"
      : "bg-sage-soft text-sage-deep border-sage/40";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      {stateLabels[state]}
    </span>
  );
}

export function Kicker({
  children,
  tone = "tomato",
}: {
  children: React.ReactNode;
  tone?: "tomato" | "sage" | "mustard" | "ink";
}) {
  const colors = {
    tomato: "text-tomato",
    sage: "text-sage",
    mustard: "text-mustard",
    ink: "text-ink",
  } as const;
  return (
    <p
      className={`text-xs font-extrabold uppercase tracking-[0.18em] ${colors[tone]}`}
    >
      {children}
    </p>
  );
}
