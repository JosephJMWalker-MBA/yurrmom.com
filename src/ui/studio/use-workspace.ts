"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Capture, WorkspaceState, WorkspaceSystem } from "@/domain/workspace";
import { slugify } from "@/domain/workspace";
import {
  newCapture,
  newEmptySystem,
  workspaceRepo,
} from "@/data/workspace-repo";
import { getCreator } from "@/data";

export type SaveStatus = "idle" | "saving" | "saved";

/**
 * The single client-side API for the creator workspace. State loads from the
 * repository seam after mount (localStorage has no SSR), mutations update
 * React state immediately and persist with a short debounce — honest local
 * autosave, surfaced to the creator as "Saved on this device".
 */
export function useWorkspace() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Latest unwritten state — flushed (never dropped) on unmount. */
  const pendingState = useRef<WorkspaceState | null>(null);

  useEffect(() => {
    setState(workspaceRepo.load());
    return () => {
      // Flush, don't discard: navigating away must never lose a keystroke.
      if (persistTimer.current) clearTimeout(persistTimer.current);
      if (pendingState.current) workspaceRepo.save(pendingState.current);
    };
  }, []);

  const persistSoon = useCallback((next: WorkspaceState) => {
    setSaveStatus("saving");
    pendingState.current = next;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      workspaceRepo.save(next);
      pendingState.current = null;
      setSaveStatus("saved");
      setLastSavedAt(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    }, 500);
  }, []);

  const mutate = useCallback(
    (fn: (draft: WorkspaceState) => void) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev)) as WorkspaceState;
        fn(next);
        persistSoon(next);
        return next;
      });
    },
    [persistSoon],
  );

  const updateSystem = useCallback(
    (slug: string, fn: (ws: WorkspaceSystem) => void) => {
      mutate((draft) => {
        const ws = draft.systems[slug];
        if (!ws) return;
        fn(ws);
        ws.hasLocalEdits = true;
        ws.updatedAtLocal = new Date().toISOString();
      });
    },
    [mutate],
  );

  const createSystem = useCallback(
    (title: string, domain?: string): string | null => {
      if (!state) return null;
      const creator = getCreator(state.identityHandle);
      if (!creator) return null;
      let slug = slugify(title) || "untitled-system";
      let n = 2;
      while (state.systems[slug]) slug = `${slugify(title)}-${n++}`;
      const ws = newEmptySystem(title, slug, creator.handle, domain, creator.context);
      // Creation persists synchronously — the caller navigates immediately,
      // and a debounced write would be lost with the unmount.
      const next = JSON.parse(JSON.stringify(state)) as WorkspaceState;
      next.systems[slug] = ws;
      workspaceRepo.save(next);
      setState(next);
      return slug;
    },
    [state, mutate],
  );

  const publishSystem = useCallback(
    (slug: string) => {
      mutate((draft) => {
        const ws = draft.systems[slug];
        if (!ws) return;
        if (ws.hasLocalEdits && ws.status === "published") {
          ws.system.version += 1;
        }
        ws.status = "published";
        ws.hasLocalEdits = false;
        ws.system.lastUpdated = new Date().toISOString().slice(0, 10);
        ws.publishedAtLocal = new Date().toISOString();
      });
    },
    [mutate],
  );

  const addCapture = useCallback(
    (slug: string, kind: Capture["kind"], text: string) => {
      // Captures land in the inbox only — they are NOT canonical content yet,
      // so they don't mark the system as having unpublished edits. Triage
      // into a story section or list item is what changes the document.
      mutate((draft) => {
        const ws = draft.systems[slug];
        if (!ws) return;
        ws.captures.push(newCapture(kind, text));
        ws.updatedAtLocal = new Date().toISOString();
      });
    },
    [mutate],
  );

  const resetDemo = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    pendingState.current = null;
    setState(workspaceRepo.reset());
    setSaveStatus("idle");
    setLastSavedAt(null);
  }, []);

  const creator = state ? getCreator(state.identityHandle) : undefined;
  const systemList: WorkspaceSystem[] = state
    ? Object.values(state.systems).sort((a, b) =>
        b.updatedAtLocal.localeCompare(a.updatedAtLocal),
      )
    : [];

  return {
    ready: state !== null,
    state,
    creator,
    systemList,
    getSystem: (slug: string) => state?.systems[slug],
    updateSystem,
    createSystem,
    publishSystem,
    addCapture,
    resetDemo,
    saveStatus,
    lastSavedAt,
  };
}
