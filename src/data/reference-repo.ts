/**
 * Reference registry repository (Phase 5) — the editorial persistence seam.
 *
 * HONEST PERSISTENCE NOTE: like the Phase 2 workspace repo, this uses device-
 * local storage (localStorage) behind an interface. There is no server, no
 * database, and no shared publishing — local editorial data is NEVER presented
 * as globally published (its `origin` stays "local-device"). The interface is
 * the replacement point for a real backend. Do not add a production database
 * to simulate editorial persistence.
 *
 * The local registry SEEDS from the production registry so the Reference Desk
 * opens with the honest platform-internal example; editors then add their own
 * (still local-device) sources and claims.
 */
import type { ReferenceRegistry } from "@/domain/reference";
import { emptyRegistry } from "@/domain/reference";
import { productionReferenceRegistry } from "./reference-registry";

const STORAGE_KEY = "ym:references:v1";

/** Honest seeded editorial identity for this phase — no authentication. */
export const EDITORIAL_IDENTITY = "editorial-desk";

export interface ReferenceRepository {
  load(): ReferenceRegistry;
  save(reg: ReferenceRegistry): void;
  reset(): ReferenceRegistry;
}

function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function bootstrap(): ReferenceRegistry {
  // Start from the production example, relabeled local-device: anything the
  // editor adds locally is a local draft, not a global publication.
  const seed = deepCopy(productionReferenceRegistry);
  seed.origin = "local-device";
  return seed;
}

export class LocalReferenceRepository implements ReferenceRepository {
  load(): ReferenceRegistry {
    if (typeof window === "undefined") return bootstrap();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ReferenceRegistry;
        if (parsed && Array.isArray(parsed.sources)) return parsed;
      }
    } catch {
      /* corrupted/unavailable → fresh seed */
    }
    const fresh = bootstrap();
    this.save(fresh);
    return fresh;
  }

  save(reg: ReferenceRegistry): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reg));
    } catch {
      /* storage full/blocked — the UI surfaces save state, not exceptions */
    }
  }

  reset(): ReferenceRegistry {
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

export const referenceRepo: ReferenceRepository = new LocalReferenceRepository();

export { emptyRegistry };
