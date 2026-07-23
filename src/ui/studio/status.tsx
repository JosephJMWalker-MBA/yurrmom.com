"use client";

import type { WorkspaceSystem } from "@/domain/workspace";
import type { SaveStatus } from "./use-workspace";

/** Draft / published state, honestly including "published + local edits". */
export function StatusBadge({ ws }: { ws: WorkspaceSystem }) {
  if (ws.status === "draft") {
    return (
      <span className="inline-flex items-center rounded-full border border-mustard bg-mustard-soft px-2.5 py-0.5 text-[11px] font-bold text-ink">
        Draft
      </span>
    );
  }
  if (ws.hasLocalEdits) {
    return (
      <span className="inline-flex items-center rounded-full border border-tomato/50 bg-cream px-2.5 py-0.5 text-[11px] font-bold text-tomato-deep">
        Published · unpublished edits
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-sage bg-sage-soft px-2.5 py-0.5 text-[11px] font-bold text-sage-deep">
      Published v{ws.system.version}
    </span>
  );
}

/** Honest autosave indicator: this is device-local persistence, and says so. */
export function SaveIndicator({
  status,
  lastSavedAt,
}: {
  status: SaveStatus;
  lastSavedAt: string | null;
}) {
  return (
    <span className="text-xs font-semibold text-ink-soft" aria-live="polite">
      {status === "saving" && "Saving…"}
      {status === "saved" && `Saved on this device · ${lastSavedAt}`}
      {status === "idle" && "Changes save to this device automatically"}
    </span>
  );
}

/** The honest seeded identity — no authentication exists in this phase. */
export function IdentityBadge({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink-soft"
      title="Seeded demo identity — real accounts arrive in a later phase"
    >
      <span className="size-1.5 rounded-full bg-sage" aria-hidden />
      Editing as {name} · seeded identity
    </span>
  );
}
