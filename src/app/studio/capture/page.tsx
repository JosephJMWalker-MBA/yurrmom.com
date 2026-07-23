"use client";

import { useState } from "react";
import Link from "next/link";
import type { Capture } from "@/domain/workspace";
import { useWorkspace } from "@/ui/studio/use-workspace";
import { Field, PrimaryButton, Select } from "@/ui/studio/fields";

const kinds: { value: Capture["kind"]; label: string }[] = [
  { value: "idea", label: "💡 Idea" },
  { value: "list-item", label: "🛒 List item" },
  { value: "lesson", label: "📌 Lesson" },
  { value: "warning", label: "⚠️ Warning" },
];

/**
 * Mobile capture: one thumb, ten seconds, mid-chaos. The note lands in the
 * system's capture inbox; structuring happens later in the editor. Nothing
 * here overwrites structured content.
 */
export default function CapturePage() {
  const { ready, systemList, addCapture } = useWorkspace();
  const [kind, setKind] = useState<Capture["kind"]>("idea");
  const [text, setText] = useState("");
  const [target, setTarget] = useState<string>("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (!ready) return <p className="text-sm text-ink-soft">Loading…</p>;

  const targetSlug = target || systemList[0]?.system.slug || "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !targetSlug) return;
    addCapture(targetSlug, kind, text.trim());
    const title =
      systemList.find((s) => s.system.slug === targetSlug)?.system.title ?? "";
    setSentTo(title);
    setText("");
    setTimeout(() => setSentTo(null), 3000);
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sage">
        Quick capture
      </p>
      <h1 className="mt-1 font-display text-3xl font-extrabold">
        Get it down before the toddler wakes up
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Ten seconds, one thumb. It lands in the system&apos;s inbox — you&apos;ll
        structure it later at the desk.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-ink/15 bg-paper p-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Capture kind">
          {kinds.map((k) => (
            <button
              key={k.value}
              type="button"
              role="radio"
              aria-checked={kind === k.value}
              onClick={() => setKind(k.value)}
              className={`rounded-full border-2 px-3.5 py-2 text-sm font-bold transition-colors ${
                kind === k.value
                  ? "border-ink bg-mustard"
                  : "border-ink/20 text-ink-soft hover:border-ink"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder={
            kind === "list-item"
              ? "Squeeze-bottle mustard — ends the knife double-dip…"
              : "The label check works better BEFORE putting groceries away…"
          }
          className="w-full rounded-xl border border-ink/25 bg-cream p-3 text-base leading-relaxed focus:border-sage focus:outline focus:outline-2 focus:outline-sage/30"
          aria-label="Capture text"
          autoFocus
        />

        {systemList.length > 1 && (
          <Field label="Send to" htmlFor="cap-target">
            <Select
              id="cap-target"
              value={targetSlug}
              onChange={setTarget}
              options={systemList.map((s) => ({
                value: s.system.slug,
                label: s.system.title,
              }))}
            />
          </Field>
        )}

        <div className="flex items-center justify-between gap-2">
          <PrimaryButton type="submit" disabled={!text.trim() || !targetSlug}>
            Capture it
          </PrimaryButton>
          <span className="text-xs text-ink-soft" aria-live="polite">
            {sentTo ? `Saved to “${sentTo}” inbox ✓` : `${text.length}/500`}
          </span>
        </div>
      </form>

      <p className="mt-4 text-xs text-ink-soft">
        Captures save to this device and appear in the{" "}
        <Link
          href={
            targetSlug ? `/studio/systems/${targetSlug}/edit` : "/studio/systems"
          }
          className="font-bold underline"
        >
          editor&apos;s inbox
        </Link>{" "}
        for sorting into story sections or list items.
      </p>
    </div>
  );
}
