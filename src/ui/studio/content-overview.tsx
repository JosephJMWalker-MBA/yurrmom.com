"use client";

import Link from "next/link";
import { copy } from "@/i18n";
import type { DistributionAsset, DistributionAssetStatus } from "@/domain/distribution";
import { useDistribution } from "./use-distribution";

const ASSET_TYPE_LABEL: Record<string, string> = {
  "short-form-video": "Short-form video",
  "social-post": "Social post",
  "pinterest-pin": "Pinterest pin",
  "newsletter-section": "Newsletter section",
  "blog-draft": "Blog draft",
};

function StatusPill({ status }: { status: DistributionAssetStatus }) {
  const map: Record<DistributionAssetStatus, string> = {
    draft: "border-mustard bg-mustard-soft text-ink",
    ready: "border-sage bg-sage-soft text-sage-deep",
    exported: "border-sage bg-cream text-sage-deep",
    "needs-review": "border-tomato/50 bg-cream text-tomato-deep",
    stale: "border-tomato/50 bg-cream text-tomato-deep",
    archived: "border-ink/20 bg-cream text-ink-soft",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${map[status]}`}>
      {status}
    </span>
  );
}

export function ContentOverview() {
  const { ready, assets, reset } = useDistribution();

  if (!ready) return <p className="text-sm text-ink-soft">Loading content drafts…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sage">
            {copy.content.title}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">Content drafts</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">{copy.content.tagline}</p>
        </div>
        <Link
          href="/studio/content/new"
          className="rounded-full border-2 border-ink bg-sage px-5 py-2 text-sm font-extrabold text-cream transition-colors hover:bg-sage-deep"
        >
          {copy.content.newAsset}
        </Link>
      </div>

      <p className="mt-4 rounded-xl border border-ink/15 bg-cream px-4 py-2.5 text-xs text-ink-soft">
        {copy.content.persistenceNote}
      </p>

      {assets.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">{copy.content.empty}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {assets.map((a: DistributionAsset) => (
            <li key={a.id} className="rounded-2xl border border-ink/15 bg-paper p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-extrabold">{a.internalName}</h2>
                <StatusPill status={a.status} />
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {ASSET_TYPE_LABEL[a.assetType] ?? a.assetType} · {a.channel} · from{" "}
                <span className="font-semibold">{a.sourceSystemSlug}</span> v{a.sourceSystemVersion}
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                {a.blocks.length} blocks · {a.disclosures.filter((d) => d.required).length} required disclosures ·{" "}
                {a.validation?.valid ? "valid" : `${a.validation?.errors.length ?? 0} issue(s)`} · origin: {a.origin}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/studio/content/${encodeURIComponent(a.id)}`}
                  className="rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-sm font-bold transition-colors hover:bg-mustard"
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 border-t border-ink/10 pt-4">
        <button
          type="button"
          onClick={reset}
          className="text-xs font-semibold text-ink-soft underline decoration-dotted underline-offset-2 hover:text-tomato-deep"
        >
          {copy.content.reset}
        </button>
      </div>
    </div>
  );
}
