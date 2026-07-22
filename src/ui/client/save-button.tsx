"use client";

import { useEffect, useState } from "react";

/**
 * Device-local save — no authentication wall in the public journey (docs/05
 * open decision 2, resolved for this slice as: local save, honest about it).
 */
export function SaveButton({ slug, title }: { slug: string; title: string }) {
  const key = "ym:saved-systems";
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setSaved((JSON.parse(raw) as string[]).includes(slug));
    } catch {
      /* fine */
    }
    setLoaded(true);
  }, [slug]);

  function toggle() {
    if (!loaded) return;
    try {
      const raw = localStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = saved ? arr.filter((s) => s !== slug) : [...arr, slug];
      localStorage.setItem(key, JSON.stringify(next));
      setSaved(!saved);
    } catch {
      /* fine */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      title="Saved on this device — no account needed"
      className={`rounded-full border-2 border-ink px-4 py-2 text-sm font-extrabold transition-colors ${
        saved ? "bg-sage text-cream" : "bg-paper hover:bg-mustard"
      }`}
    >
      {saved ? `Saved on this device ✓` : `Save “${title}”`}
    </button>
  );
}
