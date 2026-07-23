/**
 * Translation adapter boundary (Phase 3).
 *
 * The replaceable seam where machine/human translation providers will plug
 * in later. This phase ships ONLY the honest placeholder: no vendor SDK, no
 * live API, no fake "Translate" action anywhere in the UI. The interface is
 * the contract a real provider implementation must satisfy.
 */
import type { TranslatableRef, TranslationRecord } from "@/domain/translation";

export type TranslationCapability =
  | "unavailable"
  | "manual-only"
  | "machine-draft-available"
  | "review-required"
  | "approved";

export interface TranslationDraftRequest {
  source: TranslatableRef;
  sourceLocale: string;
  targetLocale: string;
  sourceVersion: number;
}

export type TranslationDraftResult =
  | { ok: true; record: TranslationRecord }
  | { ok: false; reason: string };

export interface TranslationAdapter {
  name: string;
  /** What this adapter can honestly do for a language pair, today. */
  capability(sourceLocale: string, targetLocale: string): TranslationCapability;
  /** Human-readable note the UI may show beside the capability. */
  publicNote: string;
  /**
   * Request a draft translation. The placeholder never fabricates success;
   * a real provider implementation replaces this class, not this interface.
   */
  requestDraft(req: TranslationDraftRequest): Promise<TranslationDraftResult>;
}

/**
 * The Phase 3 implementation: translation is not connected, and says so.
 * Existing translation records (seeded or manually authored) can be stored
 * and displayed — generation is what doesn't exist yet.
 */
export class NotConnectedTranslationAdapter implements TranslationAdapter {
  name = "Translation (not connected)";
  publicNote =
    "Translations are stored and shown with full provenance, but nothing generates them yet — no provider is connected, and no button pretends otherwise.";

  capability(): TranslationCapability {
    // Manual authoring of translation records is possible; generation is not.
    return "manual-only";
  }

  async requestDraft(): Promise<TranslationDraftResult> {
    return {
      ok: false,
      reason:
        "No translation provider is connected in this phase. This adapter exists so a real one can replace it without touching the editor.",
    };
  }
}

export const translationAdapter: TranslationAdapter =
  new NotConnectedTranslationAdapter();
