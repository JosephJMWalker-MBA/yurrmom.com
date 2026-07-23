"use client";

import type { WorkspaceSystem } from "@/domain/workspace";
import { GhostButton } from "./fields";

type Update = (fn: (ws: WorkspaceSystem) => void) => void;

const kindLabels = {
  idea: "Idea",
  "list-item": "List item",
  lesson: "Lesson",
  warning: "Warning",
} as const;

/**
 * Capture inbox: quick notes from mobile capture, triaged into structure
 * here. Converting never deletes the creator's words — it moves them.
 */
export function CaptureInbox({ ws, update }: { ws: WorkspaceSystem; update: Update }) {
  if (ws.captures.length === 0) return null;

  function toStory(i: number) {
    update((d) => {
      const cap = d.captures[i];
      const kind = cap.kind === "warning" ? "warnings" : "lessons-learned";
      d.system.story.push({
        kind,
        heading: cap.kind === "warning" ? "Warnings & mistakes to avoid" : "Lessons learned",
        body: cap.text,
      });
      d.captures.splice(i, 1);
    });
  }

  function toListItem(i: number) {
    update((d) => {
      const cap = d.captures[i];
      if (d.lists.length === 0) {
        d.lists.push({
          slug: `${d.system.slug}-list-1`,
          systemSlug: d.system.slug,
          title: "New list",
          intro: "",
          items: [],
        });
        d.system.listSlugs = d.lists.map((l) => l.slug);
      }
      d.lists[0].items.push({
        id: `item-${Date.now()}`,
        need: cap.text,
        quantity: "",
        recurrence: "",
        importance: "optional",
        substitutions: [],
      });
      d.captures.splice(i, 1);
    });
  }

  return (
    <section
      aria-label="Capture inbox"
      className="rounded-2xl border border-mustard bg-mustard-soft/50 p-4"
    >
      <p className="text-sm font-extrabold">
        📥 Capture inbox — {ws.captures.length} to sort
      </p>
      <ul className="mt-2 space-y-2">
        {ws.captures.map((cap, i) => (
          <li
            key={cap.id}
            className="flex flex-wrap items-center gap-2 rounded-xl bg-paper p-2.5"
          >
            <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-soft">
              {kindLabels[cap.kind]}
            </span>
            <span className="min-w-0 flex-1 text-sm">{cap.text}</span>
            <span className="flex gap-1.5">
              <GhostButton onClick={() => toStory(i)}>→ story</GhostButton>
              <GhostButton onClick={() => toListItem(i)}>→ list item</GhostButton>
              <GhostButton
                danger
                onClick={() => update((d) => void d.captures.splice(i, 1))}
              >
                discard
              </GhostButton>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
