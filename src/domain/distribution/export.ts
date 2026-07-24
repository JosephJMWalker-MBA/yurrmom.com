/**
 * Deterministic asset export (Phase 8).
 *
 * Export is manual and honest: it produces a text/markdown/json rendering of the
 * asset for the creator to copy or save. It is NOT publishing — no network, no
 * destination account, no "success". Every export carries a provenance +
 * disclosure footer (source system, version, creator, locale, translation
 * status, and every required disclosure). A stale or invalid asset cannot be
 * exported as current; `exportAsset` refuses and explains why.
 */
import type { DistributionAsset, DistributionContentBlock } from "./types";
import { isExportable } from "./validate";

export type ExportFormat = "markdown" | "text" | "json";

export type ExportResult =
  | { ok: true; format: ExportFormat; filename: string; content: string }
  | { ok: false; reason: string };

/** Blocks that carry visible body content (exclude the internal source-note). */
function bodyBlocks(asset: DistributionAsset): DistributionContentBlock[] {
  return asset.blocks.filter((b) => b.kind !== "source-note" && b.text.trim());
}

function footerLines(asset: DistributionAsset): string[] {
  const p = asset.provenance;
  const lines = [
    `Source system: ${p.sourceSystemSlug} (v${asset.sourceSystemVersion})`,
    `Creator: ${p.creatorHandle}`,
    `Locale: ${asset.assetLocale}${asset.assetLocale !== asset.sourceLocale ? ` (from ${asset.sourceLocale})` : ""}`,
    `Translation: ${p.translationStatus}${p.translatorAttribution ? ` — ${p.translatorAttribution}` : ""}`,
    `Template: ${asset.templateId} @ ${asset.templateVersion}`,
    `Origin: ${asset.origin} — a derivative of the canonical system on yurrmom.com, not a new source of truth.`,
  ];
  for (const d of asset.disclosures.filter((d) => d.required)) lines.push(`Disclosure (${d.kind}): ${d.text}`);
  return lines;
}

function slug(asset: DistributionAsset): string {
  return `${asset.sourceSystemSlug}-${asset.assetType}-${asset.assetLocale}`.replace(/[^a-z0-9-]/gi, "-");
}

function renderMarkdown(asset: DistributionAsset): string {
  const parts: string[] = [`<!-- Content preview — not published. Manual export from yurrmom.com Content Studio. -->`];
  for (const b of bodyBlocks(asset)) {
    const label = b.label ?? b.kind;
    parts.push(`**${label}:** ${b.text}`);
  }
  parts.push("", "---", "", ...footerLines(asset).map((l) => `- ${l}`));
  return parts.join("\n");
}

function renderText(asset: DistributionAsset): string {
  const parts: string[] = ["Content preview — not published. Manual export from yurrmom.com Content Studio.", ""];
  for (const b of bodyBlocks(asset)) parts.push(`[${b.kind}] ${b.text}`);
  parts.push("", "----", ...footerLines(asset));
  return parts.join("\n");
}

function renderJson(asset: DistributionAsset): string {
  return JSON.stringify(
    {
      note: "Content preview — not published. Derivative export; canonical system remains the source of truth.",
      id: asset.id,
      assetType: asset.assetType,
      channel: asset.channel,
      locale: asset.assetLocale,
      sourceSystemSlug: asset.sourceSystemSlug,
      sourceSystemVersion: asset.sourceSystemVersion,
      templateId: asset.templateId,
      templateVersion: asset.templateVersion,
      provenance: asset.provenance,
      blocks: bodyBlocks(asset).map((b) => ({ kind: b.kind, text: b.text, provenance: b.provenance, sourceRef: b.sourceRef })),
      disclosures: asset.disclosures,
      origin: asset.origin,
    },
    null,
    2,
  );
}

export function exportAsset(asset: DistributionAsset, format: ExportFormat): ExportResult {
  if (!isExportable(asset)) {
    const why =
      asset.status === "stale" || asset.status === "needs-review"
        ? "The source system has changed — review the asset before exporting."
        : "The asset has unresolved validation issues.";
    return { ok: false, reason: `Cannot export as current: ${why}` };
  }
  const ext = format === "markdown" ? "md" : format === "json" ? "json" : "txt";
  const content =
    format === "markdown" ? renderMarkdown(asset) : format === "json" ? renderJson(asset) : renderText(asset);
  return { ok: true, format, filename: `${slug(asset)}.${ext}`, content };
}

/** Mark an asset as exported (records the timestamp; still local, never published). */
export function markExported(asset: DistributionAsset, now?: string): DistributionAsset {
  const ts = now ?? new Date().toISOString();
  return { ...asset, status: "exported", exportedAt: ts, updatedAt: ts };
}
