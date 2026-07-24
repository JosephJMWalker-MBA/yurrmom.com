/**
 * Moderation repository (Phase 9) — the device-local governance persistence seam.
 *
 * HONEST PERSISTENCE NOTE: same stance as the reference/workspace/distribution
 * repos. The whole moderation store lives in device-local storage behind an
 * interface. There is no server, no database, no shared moderation, and no
 * production authentication. Local governance state is never presented as
 * globally authoritative; its `origin` is relabeled `local-device`. This
 * interface is the single replacement point for a real backend — do not add a
 * production database or automated moderation to simulate it.
 *
 * Corruption-safe: a malformed payload falls back to a fresh seed. Reset is
 * deterministic (re-seeds from the built-in fixtures). The public projection is
 * computed elsewhere and never reads storage internals directly.
 */
import type { ModerationStore } from "@/domain/moderation";
import { buildModerationSeed } from "./moderation-seed";

const STORAGE_KEY = "ym:moderation:v1";

export interface ModerationRepository {
  load(): ModerationStore;
  save(store: ModerationStore): void;
  reset(): ModerationStore;
}

function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Start from the seed, relabeled local-device. */
function bootstrap(): ModerationStore {
  const seed = deepCopy(buildModerationSeed());
  seed.origin = "local-device";
  return seed;
}

/** Shape guard for corruption-safe loading. */
function looksValid(s: unknown): s is ModerationStore {
  if (!s || typeof s !== "object") return false;
  const st = s as Partial<ModerationStore>;
  return (
    Array.isArray(st.prompts) &&
    Array.isArray(st.entries) &&
    Array.isArray(st.reports) &&
    Array.isArray(st.actions) &&
    Array.isArray(st.featured) &&
    Array.isArray(st.taxonomy) &&
    typeof st.seq === "number"
  );
}

export class LocalModerationRepository implements ModerationRepository {
  load(): ModerationStore {
    if (typeof window === "undefined") return bootstrap();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (looksValid(parsed)) return parsed;
      }
    } catch {
      /* corrupted/unavailable → fresh seed */
    }
    const fresh = bootstrap();
    this.save(fresh);
    return fresh;
  }

  save(store: ModerationStore): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* storage full/blocked — the UI surfaces save state, not exceptions */
    }
  }

  reset(): ModerationStore {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    return this.load();
  }
}

export const moderationRepo: ModerationRepository = new LocalModerationRepository();
