/**
 * Workspace repository (Phase 2) — the persistence seam for creator drafts.
 *
 * HONEST PERSISTENCE NOTE: this phase deliberately uses device-local storage
 * (localStorage) behind a repository interface. There is no server, no
 * database, and no account — and the UI says so. The interface is the
 * replacement point: a future phase swaps `LocalWorkspaceRepository` for a
 * real backend without touching the editor. Do not add a production database
 * to simulate persistence (Phase 2 assignment, docs/08 §1 seam).
 */
import type { Capture, WorkspaceState, WorkspaceSystem } from "@/domain/workspace";
import type { HouseholdContext, HouseholdSystem } from "@/domain/types";
import { creators } from "./creators";
import { systems } from "./systems";
import { lists } from "./lists";

const STORAGE_KEY = "ym:studio:v1";

/** The honest seeded identity for this phase — no authentication exists. */
export const SEED_IDENTITY_HANDLE = "maya-runs-the-kitchen";
/** The one seeded editable system (Phase 2 assignment). */
export const SEED_SYSTEM_SLUG = "celiac-safe-pantry-reset";

// ------------------------------------------------------------ repository

export interface WorkspaceRepository {
  load(): WorkspaceState;
  save(state: WorkspaceState): void;
  reset(): WorkspaceState;
}

function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function bootstrap(): WorkspaceState {
  const creator = creators.find((c) => c.handle === SEED_IDENTITY_HANDLE);
  const system = systems.find((s) => s.slug === SEED_SYSTEM_SLUG);
  if (!creator || !system) {
    throw new Error("Workspace seed data missing — check seed slugs.");
  }
  const embeddedLists = lists.filter((l) => l.systemSlug === system.slug);
  const now = new Date().toISOString();
  const ws: WorkspaceSystem = {
    system: deepCopy(system),
    context: deepCopy(creator.context),
    lists: deepCopy(embeddedLists),
    status: "published", // it is live on the public site (from the seed)
    hasLocalEdits: false,
    captures: [],
    updatedAtLocal: now,
    publishedAtLocal: system.lastUpdated,
  };
  return {
    identityHandle: creator.handle,
    systems: { [system.slug]: ws },
    seededAt: now,
  };
}

export class LocalWorkspaceRepository implements WorkspaceRepository {
  load(): WorkspaceState {
    if (typeof window === "undefined") return bootstrap();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as WorkspaceState;
    } catch {
      /* corrupted or unavailable storage → fresh seed */
    }
    const fresh = bootstrap();
    this.save(fresh);
    return fresh;
  }

  save(state: WorkspaceState): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full/blocked — the UI surfaces save state, not exceptions */
    }
  }

  reset(): WorkspaceState {
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

export const workspaceRepo: WorkspaceRepository = new LocalWorkspaceRepository();

// ------------------------------------------------------------ factories

export function newEmptySystem(
  title: string,
  slug: string,
  creatorHandle: string,
  domain: string | undefined,
  baseContext: HouseholdContext,
): WorkspaceSystem {
  const now = new Date().toISOString();
  const system: HouseholdSystem = {
    slug,
    creatorHandle,
    title,
    promise: "",
    problem: "",
    situationTags: [],
    lastUpdated: now.slice(0, 10),
    version: 1,
    story: [],
    listSlugs: [],
    routines: [],
    recipes: [],
    provenance: {
      sourceType: "personal-experience",
      livedExperience: true,
    },
    facets: domain ? { domain } : {},
    relatedSystemSlugs: [],
  };
  return {
    system,
    context: deepCopy(baseContext),
    lists: [],
    status: "draft",
    hasLocalEdits: true,
    captures: [],
    updatedAtLocal: now,
  };
}

export function newCapture(kind: Capture["kind"], text: string): Capture {
  return {
    id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    text,
    createdAt: new Date().toISOString(),
  };
}
