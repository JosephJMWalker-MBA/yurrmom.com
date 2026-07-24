/**
 * Content Studio distribution repository (Phase 8) — editorial persistence seam.
 *
 * HONEST PERSISTENCE NOTE: identical stance to the reference/workspace repos.
 * Assets live in device-local storage (localStorage) behind an interface. There
 * is no server, no database, and NO publishing. Local assets are never
 * presented as globally published; their `origin` stays "local-device". This
 * interface is the single replacement point for a future real backend — do not
 * add a production database or any social/email integration to simulate it.
 *
 * The local store SEEDS from the built-in demo assets (relabeled local-device),
 * so the Studio opens with honest examples; creators then add their own.
 */
import type { DistributionAsset } from "@/domain/distribution";
import { seededDistributionAssets } from "./distribution-seed";

const STORAGE_KEY = "ym:distribution:v1";

export interface DistributionStore {
  assets: DistributionAsset[];
  origin: "production-seed" | "local-device";
}

export interface DistributionRepository {
  load(): DistributionStore;
  save(store: DistributionStore): void;
  reset(): DistributionStore;
  upsert(asset: DistributionAsset): DistributionStore;
  remove(assetId: string): DistributionStore;
  get(assetId: string): DistributionAsset | undefined;
}

function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function bootstrap(): DistributionStore {
  // Seed from the demo assets, relabeled local-device: anything the creator
  // edits or adds is a local draft, never a global publication.
  return {
    assets: seededDistributionAssets.map((a) => ({ ...deepCopy(a), origin: "local-device" })),
    origin: "local-device",
  };
}

export class LocalDistributionRepository implements DistributionRepository {
  load(): DistributionStore {
    if (typeof window === "undefined") return bootstrap();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DistributionStore;
        if (parsed && Array.isArray(parsed.assets)) return parsed;
      }
    } catch {
      /* corrupted/unavailable → fresh seed */
    }
    const fresh = bootstrap();
    this.save(fresh);
    return fresh;
  }

  save(store: DistributionStore): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* storage full/blocked — the UI surfaces save state, not exceptions */
    }
  }

  reset(): DistributionStore {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    return this.load();
  }

  upsert(asset: DistributionAsset): DistributionStore {
    const store = this.load();
    const idx = store.assets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) store.assets[idx] = asset;
    else store.assets.push(asset);
    this.save(store);
    return store;
  }

  remove(assetId: string): DistributionStore {
    const store = this.load();
    store.assets = store.assets.filter((a) => a.id !== assetId);
    this.save(store);
    return store;
  }

  get(assetId: string): DistributionAsset | undefined {
    return this.load().assets.find((a) => a.id === assetId);
  }
}

export const distributionRepo: DistributionRepository = new LocalDistributionRepository();
