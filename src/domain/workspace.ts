/**
 * Creator-workspace domain (Phase 2).
 *
 * A WorkspaceSystem is the editable document: the canonical HouseholdSystem
 * plus its embedded portable lists, draft/publish status, and the mobile
 * capture inbox. Canonical creator-entered knowledge lives here and is never
 * written by any generated derivative (there is no generation in this phase,
 * and the seam keeps it that way structurally).
 *
 * No framework imports belong in this module.
 */
import type {
  HouseholdContext,
  HouseholdSystem,
  PortableList,
  StoryKind,
} from "./types";

export type SystemStatus = "draft" | "published";

/** A quick idea captured on the go — triaged into structure in the editor. */
export interface Capture {
  id: string;
  kind: "idea" | "list-item" | "lesson" | "warning";
  text: string;
  createdAt: string; // ISO
  /** Language the capture was written in — inherits creator locale if absent. */
  locale?: import("./i18n").LocaleMeta;
}

export interface WorkspaceSystem {
  /** Canonical knowledge — the creator's, verbatim. */
  system: HouseholdSystem;
  /**
   * The household context this system is interpreted through (docs/07).
   * Seeded from the creator's profile context; editable per system.
   */
  context: HouseholdContext;
  /** Embedded portable lists (slugs stay stable for public routes). */
  lists: PortableList[];
  status: SystemStatus;
  /** True when local edits exist that postdate the last publish. */
  hasLocalEdits: boolean;
  captures: Capture[];
  /** Last local save (device time, ISO). */
  updatedAtLocal: string;
  publishedAtLocal?: string;
}

export interface WorkspaceState {
  /** Honest seeded identity for this phase — no authentication exists. */
  identityHandle: string;
  systems: Record<string, WorkspaceSystem>;
  seededAt: string;
}

// ----------------------------------------------------------------- helpers

export const storyKindLabels: Record<StoryKind, string> = {
  "what-happened": "What happened",
  "what-failed": "What failed",
  "what-changed": "What changed",
  "what-works-now": "What works now",
  "lessons-learned": "Lessons learned",
  warnings: "Warnings & mistakes to avoid",
};

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export interface EditorSectionProgress {
  id: string;
  label: string;
  done: boolean;
  hint: string;
}

/**
 * Honest progress: which parts of the document actually have content.
 * Drives the editor's progress indicator — guidance, not a gate.
 */
export function sectionProgress(ws: WorkspaceSystem): EditorSectionProgress[] {
  const s = ws.system;
  const hasContext = Boolean(
    ws.context.householdSize &&
      (ws.context.diet.length > 0 || ws.context.constraints.length > 0),
  );
  return [
    {
      id: "context",
      label: "Household context",
      done: hasContext,
      hint: "Who this system's household actually is",
    },
    {
      id: "promise",
      label: "Problem & promise",
      done: Boolean(s.promise && s.problem),
      hint: "What it solves, for whom, honestly",
    },
    {
      id: "story",
      label: "Story & lessons",
      done: s.story.length > 0,
      hint: "What happened, failed, changed",
    },
    {
      id: "lists",
      label: "Lists",
      done: ws.lists.some((l) => l.items.length > 0),
      hint: "Portable needs, picks, substitutions",
    },
    {
      id: "routines",
      label: "Routines & recipes",
      done: s.routines.length > 0 || s.recipes.length > 0,
      hint: "Ordered steps, timing, frequency",
    },
    {
      id: "trust",
      label: "Trust & provenance",
      done: Boolean(s.provenance?.lastReviewed),
      hint: "Source, disclosures, limitations",
    },
  ];
}
