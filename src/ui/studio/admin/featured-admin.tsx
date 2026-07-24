"use client";

import { useState } from "react";
import type { FeaturedPlacement, FeaturedStatus } from "@/domain/moderation";
import { useModeration } from "../use-moderation";

const STATUS_STYLE: Record<FeaturedStatus, string> = {
  active: "border-sage bg-sage-soft text-sage-deep",
  draft: "border-mustard bg-mustard-soft text-ink",
  expired: "border-ink/20 bg-cream text-ink-soft",
  retired: "border-ink/20 bg-cream text-ink-soft",
};

function PlacementRow({ placement }: { placement: FeaturedPlacement }) {
  const { setFeatured } = useModeration();
  const [rationale, setRationale] = useState("");
  const [order, setOrder] = useState(String(placement.displayOrder));
  const [error, setError] = useState<string | null>(null);

  function run(toStatus: FeaturedStatus, displayOrder?: number) {
    setError(null);
    const result = setFeatured({ placementId: placement.id, toStatus, displayOrder, rationale });
    if (!result.ok) setError(result.reason ?? "Action failed.");
    else setRationale("");
  }

  const live = placement.status === "active";
  return (
    <div className="rounded-2xl border border-ink/15 bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display font-extrabold">{placement.targetType}: {placement.targetId}</p>
          <p className="text-[11px] text-ink-soft">{placement.placement} · order {placement.displayOrder}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[placement.status]}`}>{placement.status}</span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">{placement.editorialRationale}</p>
      <p className="mt-1 text-[11px] text-ink-soft">Featuring never mutates the canonical system/creator and implies no endorsement.</p>

      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        rows={2}
        placeholder="Rationale (required)…"
        className="mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {live ? (
          <button type="button" onClick={() => run("retired")} className="rounded-full border border-ink/30 px-3 py-1.5 text-xs font-bold text-ink-soft hover:border-tomato hover:text-tomato-deep">
            Unfeature (retire)
          </button>
        ) : (
          <button type="button" onClick={() => run("active")} className="rounded-full border-2 border-ink bg-sage px-3 py-1.5 text-xs font-bold text-cream hover:bg-sage-deep">
            Feature (activate)
          </button>
        )}
        <span className="flex items-center gap-1 text-xs text-ink-soft">
          order
          <input value={order} onChange={(e) => setOrder(e.target.value)} inputMode="numeric" className="w-14 rounded-lg border border-ink/20 bg-paper px-2 py-1 text-xs" />
          <button
            type="button"
            onClick={() => run(placement.status, Number(order) || 0)}
            className="rounded-full border border-ink/30 px-2 py-1 text-[11px] font-bold hover:border-sage"
          >
            Reorder
          </button>
        </span>
      </div>
      {error && <p className="mt-2 text-[11px] font-semibold text-tomato-deep">{error}</p>}
    </div>
  );
}

export function FeaturedAdmin() {
  const { ready, placements } = useModeration();
  if (!ready) return <p className="text-sm text-ink-soft">Loading placements…</p>;
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Featured placements</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Curation is a separate record — it never edits canonical content. Only active placements within their window render publicly, in a
        deterministic order. Popularity and affiliate value never influence rank.
      </p>
      <div className="mt-4 space-y-3">
        {placements.map((p) => (
          <PlacementRow key={p.id} placement={p} />
        ))}
      </div>
    </div>
  );
}
