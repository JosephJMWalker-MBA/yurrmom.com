/**
 * Reference ingestion boundary (Phase 5).
 *
 * The replaceable seam through which source material ENTERS the registry.
 * This phase supports ONLY manual entry and optional local-JSON import. There
 * is no live URL fetching, no web scraping, no PDF extraction, and no vendor
 * SDK. The adapter produces source/version CANDIDATES for editorial review —
 * never automatically approved knowledge.
 */
import type { ReferenceRegistry } from "@/domain/reference";

export type IngestionCapability =
  | "manual-entry"
  | "local-import"
  | "external-fetch-unavailable"
  | "parsing-unavailable"
  | "review-required";

export interface IngestionCandidate {
  /** What the editor typed or imported — NOT yet reviewed or approved. */
  registry: ReferenceRegistry;
  note: string;
}

export interface ReferenceIngestionAdapter {
  name: string;
  capabilities(): IngestionCapability[];
  publicNote: string;
  /** Parse a local JSON fixture into a candidate registry (no network). */
  importLocalJson(json: string): { ok: true; candidate: IngestionCandidate } | { ok: false; reason: string };
  /** Live fetch is intentionally unavailable in this phase. */
  fetchFromUrl(url: string): { ok: false; reason: string };
}

export class ManualIngestionAdapter implements ReferenceIngestionAdapter {
  name = "Manual reference ingestion";
  publicNote =
    "Sources and evidence are entered by hand (or imported from a local JSON fixture) and always land as review-required candidates. No web fetching, scraping, or PDF parsing exists in this phase.";

  capabilities(): IngestionCapability[] {
    return [
      "manual-entry",
      "local-import",
      "external-fetch-unavailable",
      "parsing-unavailable",
      "review-required",
    ];
  }

  importLocalJson(json: string) {
    try {
      const parsed = JSON.parse(json) as ReferenceRegistry;
      if (!parsed || !Array.isArray(parsed.sources)) {
        return { ok: false as const, reason: "Not a reference registry shape." };
      }
      // Imported data is a candidate, explicitly marked local-device origin —
      // never presented as globally published.
      return {
        ok: true as const,
        candidate: {
          registry: { ...parsed, origin: "local-device" as const },
          note: "Imported as review-required candidate. Nothing is approved until an editor runs the review checklist.",
        },
      };
    } catch (e) {
      return {
        ok: false as const,
        reason: `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`,
      };
    }
  }

  fetchFromUrl(url: string) {
    return {
      ok: false as const,
      reason: `Live fetching is unavailable in this phase. Enter "${url}" manually as a citation locator instead.`,
    };
  }
}

export const referenceIngestionAdapter: ReferenceIngestionAdapter =
  new ManualIngestionAdapter();
