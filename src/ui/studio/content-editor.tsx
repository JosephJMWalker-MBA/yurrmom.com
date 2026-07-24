"use client";

import { useState } from "react";
import Link from "next/link";
import { copy, fmt } from "@/i18n";
import type {
  BlockProvenance,
  DistributionAsset,
  DistributionContentBlock,
  ExportFormat,
} from "@/domain/distribution";
import { destinationsForChannel } from "@/domain/distribution";
import { useDistribution } from "./use-distribution";

const PROVENANCE_LABEL: Record<BlockProvenance, string> = {
  "source-backed": copy.content.sourceBacked,
  "creator-authored-derivative": copy.content.edited,
  "creator-authored": "Your words",
  "deterministic-template": copy.content.templateText,
  "translated-derivative": "Translated",
};

const PROVENANCE_STYLE: Record<BlockProvenance, string> = {
  "source-backed": "border-sage bg-sage-soft text-sage-deep",
  "creator-authored-derivative": "border-mustard bg-mustard-soft text-ink",
  "creator-authored": "border-ink/20 bg-cream text-ink-soft",
  "deterministic-template": "border-ink/20 bg-cream text-ink-soft",
  "translated-derivative": "border-tomato/40 bg-cream text-tomato-deep",
};

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function BlockRow({
  block,
  onEdit,
  onRemove,
}: {
  block: DistributionContentBlock;
  onEdit: (text: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink/12 bg-paper p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">{block.kind}</span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PROVENANCE_STYLE[block.provenance]}`}>
            {PROVENANCE_LABEL[block.provenance]}
          </span>
          {block.required && (
            <span className="rounded-full border border-ink/20 bg-cream px-2 py-0.5 text-[10px] font-bold text-ink-soft">
              {copy.content.required}
            </span>
          )}
        </div>
        {!block.required && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] font-semibold text-ink-soft underline decoration-dotted hover:text-tomato-deep"
          >
            {copy.content.remove}
          </button>
        )}
      </div>
      {block.editable ? (
        <textarea
          value={block.text}
          onChange={(e) => onEdit(e.target.value)}
          rows={Math.max(2, Math.ceil(block.text.length / 60))}
          className="mt-2 w-full resize-y rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm text-ink"
        />
      ) : (
        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-ink/10 bg-cream px-3 py-2 text-sm text-ink-soft">
          {block.text}
        </p>
      )}
      {block.sourceRef && (
        <p className="mt-1 text-[11px] text-ink-soft">
          ↳ {block.sourceRef.sourceObjectType} · {block.sourceRef.owningSystemSlug} v{block.sourceRef.sourceVersion}
          {block.editedFromExact ? " · edited from exact source" : ""}
        </p>
      )}
    </div>
  );
}

/** Channel-aware preview, always labeled as a preview and never as published. */
function ChannelPreview({ asset }: { asset: DistributionAsset }) {
  const body = asset.blocks.filter((b) => b.kind !== "source-note" && b.text.trim());
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-ink/20 bg-cream">
      <div className="flex items-center justify-between gap-2 bg-tomato/10 px-4 py-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-tomato-deep">
          {copy.content.notPublishedBanner}
        </span>
        <span className="text-[11px] font-semibold text-ink-soft">{asset.channel}</span>
      </div>
      <div className="space-y-2 p-4">
        {body.map((b) => (
          <p key={b.id} className="text-sm leading-relaxed text-ink">
            <span className="mr-1 text-[10px] font-bold uppercase text-ink-soft">[{b.kind}]</span>
            {b.text}
          </p>
        ))}
      </div>
    </div>
  );
}

export function ContentEditor({ assetId }: { assetId: string }) {
  const { ready, get, editBlock, dropBlock, markReady, reviewStale, doExport } = useDistribution();
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedFmt, setCopiedFmt] = useState<ExportFormat | null>(null);

  if (!ready) return <p className="text-sm text-ink-soft">Loading…</p>;
  const asset = get(assetId);
  if (!asset) {
    return (
      <div>
        <Link href="/studio/content" className="text-sm font-semibold text-ink-soft hover:text-sage-deep">
          {copy.content.backToOverview}
        </Link>
        <p className="mt-4 text-sm text-ink-soft">This content draft was not found on this device.</p>
      </div>
    );
  }

  const isStale = asset.status === "stale" || asset.status === "needs-review";
  const validation = asset.validation;

  const runExport = (format: ExportFormat, copyOnly: boolean) => {
    const result = doExport(assetId, format);
    if (!result.ok) return setNotice(result.reason);
    setNotice(null);
    if (copyOnly) {
      void navigator.clipboard?.writeText(result.content).then(() => {
        setCopiedFmt(format);
        setTimeout(() => setCopiedFmt(null), 1500);
      });
    } else {
      const mime =
        format === "json" ? "application/json" : format === "markdown" ? "text/markdown" : "text/plain";
      download(result.filename, result.content, mime);
    }
  };

  return (
    <div>
      <Link href="/studio/content" className="text-sm font-semibold text-ink-soft hover:text-sage-deep">
        {copy.content.backToOverview}
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{asset.internalName}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {asset.assetType} · {asset.channel} · from{" "}
            <span className="font-semibold">{asset.sourceSystemSlug}</span> v{asset.sourceSystemVersion} ·{" "}
            {asset.templateId}
          </p>
        </div>
      </div>

      {isStale && (
        <div className="mt-4 rounded-2xl border-2 border-tomato/50 bg-cream p-4">
          <p className="font-display text-lg font-extrabold text-tomato-deep">{copy.content.staleHeading}</p>
          <p className="mt-1 text-sm text-ink-soft">{copy.content.staleBody}</p>
          <button
            type="button"
            onClick={() => reviewStale(assetId)}
            className="mt-3 rounded-full border-2 border-ink bg-mustard px-4 py-1.5 text-sm font-bold text-ink transition-colors hover:bg-mustard-soft"
          >
            {copy.content.reviewStale}
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* left: blocks */}
        <div>
          <h2 className="font-display text-xl font-extrabold">{copy.content.blocksHeading}</h2>
          <div className="mt-3 space-y-3">
            {asset.blocks.map((b) => (
              <BlockRow
                key={b.id}
                block={b}
                onEdit={(text) => editBlock(assetId, b.id, text)}
                onRemove={() => dropBlock(assetId, b.id)}
              />
            ))}
          </div>
        </div>

        {/* right: preview + validation + export */}
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-extrabold">{copy.content.previewHeading}</h2>
            <div className="mt-3">
              <ChannelPreview asset={asset} />
            </div>
          </div>

          {/* validation */}
          <div>
            <h2 className="font-display text-xl font-extrabold">{copy.content.validationHeading}</h2>
            {validation?.valid ? (
              <p className="mt-2 rounded-lg border border-sage bg-sage-soft px-3 py-2 text-sm font-semibold text-sage-deep">
                {copy.content.valid}
              </p>
            ) : (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-semibold text-tomato-deep">
                  {fmt(copy.content.invalid, { count: validation?.errors.length ?? 0 })}
                </p>
                <ul className="space-y-1">
                  {validation?.errors.map((e, i) => (
                    <li key={i} className="rounded-lg border border-tomato/40 bg-cream px-3 py-1.5 text-xs text-tomato-deep">
                      <span className="font-mono font-bold">{e.code}</span> — {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {validation?.warnings.length ? (
              <ul className="mt-2 space-y-1">
                {validation.warnings.map((w, i) => (
                  <li key={i} className="rounded-lg border border-mustard bg-mustard-soft px-3 py-1.5 text-xs text-ink">
                    {w.message}
                  </li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={() => {
                const r = markReady(assetId);
                setNotice(r.ok ? null : r.reason ?? null);
              }}
              disabled={!validation?.valid || isStale}
              className="mt-3 rounded-full border-2 border-ink bg-sage px-4 py-1.5 text-sm font-bold text-cream transition-colors hover:bg-sage-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.content.markReady}
            </button>
          </div>

          {/* disclosures */}
          <div>
            <h2 className="font-display text-xl font-extrabold">{copy.content.disclosuresHeading}</h2>
            <ul className="mt-2 space-y-1">
              {asset.disclosures.map((d) => (
                <li key={d.id} className="rounded-lg border border-ink/12 bg-cream px-3 py-1.5 text-xs text-ink">
                  <span className="font-bold">{d.kind}</span>
                  {d.required ? " · required" : ""}: {d.text}
                </li>
              ))}
            </ul>
          </div>

          {/* export + destinations */}
          <div>
            <h2 className="font-display text-xl font-extrabold">{copy.content.exportHeading}</h2>
            {isStale && (
              <p className="mt-2 rounded-lg border border-tomato/40 bg-cream px-3 py-1.5 text-xs text-tomato-deep">
                {copy.content.exportBlockedStale}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runExport("markdown", false)}
                className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold transition-colors hover:bg-mustard"
              >
                {copy.content.exportMarkdown}
              </button>
              <button
                type="button"
                onClick={() => runExport("text", false)}
                className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold transition-colors hover:bg-mustard"
              >
                {copy.content.exportText}
              </button>
              <button
                type="button"
                onClick={() => runExport("json", false)}
                className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold transition-colors hover:bg-mustard"
              >
                {copy.content.exportJson}
              </button>
              <button
                type="button"
                onClick={() => runExport("text", true)}
                className="rounded-full border border-ink/30 px-3 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-sage hover:text-sage-deep"
              >
                {copiedFmt === "text" ? copy.content.copied : copy.content.copyText}
              </button>
            </div>
            {notice && (
              <p className="mt-2 rounded-lg border border-tomato/40 bg-cream px-3 py-1.5 text-xs text-tomato-deep">{notice}</p>
            )}
            <p className="mt-3 text-xs text-ink-soft">{copy.content.destinationsNote}</p>
            <ul className="mt-2 space-y-1">
              {destinationsForChannel(asset.channel).map((d) => (
                <li key={d.id} className="rounded-lg border border-ink/12 bg-cream px-3 py-1.5 text-xs text-ink-soft">
                  <span className="font-bold text-ink">{d.name}</span>{" "}
                  <span className="rounded-full border border-ink/20 px-1.5 py-0.5 text-[10px] font-bold">{d.capability}</span>
                  <br />
                  {d.note}
                </li>
              ))}
            </ul>
          </div>

          {/* provenance */}
          <div>
            <h2 className="font-display text-xl font-extrabold">{copy.content.provenanceHeading}</h2>
            <dl className="mt-2 space-y-1 text-xs text-ink-soft">
              <div>
                <dt className="inline font-bold text-ink">Creator: </dt>
                <dd className="inline">{asset.provenance.creatorHandle}</dd>
              </div>
              <div>
                <dt className="inline font-bold text-ink">Source: </dt>
                <dd className="inline">
                  {asset.provenance.sourceSystemSlug} v{asset.sourceSystemVersion} ({asset.sourceLocale})
                </dd>
              </div>
              <div>
                <dt className="inline font-bold text-ink">Locale: </dt>
                <dd className="inline">
                  {asset.assetLocale} · {asset.provenance.translationStatus}
                </dd>
              </div>
              <div>
                <dt className="inline font-bold text-ink">Origin: </dt>
                <dd className="inline">{asset.origin} (derivative — not a source of truth)</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
