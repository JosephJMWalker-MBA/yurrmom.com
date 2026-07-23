"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReferenceRegistry } from "@/domain/reference";
import { referenceRepo } from "@/data/reference-repo";

export type RefSaveStatus = "idle" | "saving" | "saved";

/**
 * Local editorial state for the Reference Desk. Mirrors the Phase 2 workspace
 * hook: loads from the repository seam after mount (localStorage has no SSR),
 * persists mutations with a short debounce, flushes on unmount. Honest local
 * persistence — never presented as globally published.
 */
export function useReferences() {
  const [registry, setRegistry] = useState<ReferenceRegistry | null>(null);
  const [saveStatus, setSaveStatus] = useState<RefSaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<ReferenceRegistry | null>(null);

  useEffect(() => {
    setRegistry(referenceRepo.load());
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (pending.current) referenceRepo.save(pending.current);
    };
  }, []);

  const persist = useCallback((next: ReferenceRegistry) => {
    setSaveStatus("saving");
    pending.current = next;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      referenceRepo.save(next);
      pending.current = null;
      setSaveStatus("saved");
    }, 400);
  }, []);

  const update = useCallback(
    (fn: (reg: ReferenceRegistry) => ReferenceRegistry) => {
      setRegistry((prev) => {
        if (!prev) return prev;
        const next = fn(structuredClone(prev));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    pending.current = null;
    setRegistry(referenceRepo.reset());
    setSaveStatus("idle");
  }, []);

  return { registry, update, reset, saveStatus, ready: registry !== null };
}
