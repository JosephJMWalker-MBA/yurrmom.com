"use client";

import type { StoryKind } from "@/domain/types";
import type { WorkspaceSystem } from "@/domain/workspace";
import { storyKindLabels } from "@/domain/workspace";
import { Field, GhostButton, SectionCard, TextArea, TextInput } from "./fields";

type Update = (fn: (ws: WorkspaceSystem) => void) => void;

const kinds = Object.keys(storyKindLabels) as StoryKind[];

/**
 * Story & lessons — structured sections, deliberately not one blank blog box.
 * The section kinds ARE the interview: what happened, what failed, what
 * changed, what works, lessons, warnings.
 */
export function StorySection({ ws, update }: { ws: WorkspaceSystem; update: Update }) {
  const sections = ws.system.story;
  const usedKinds = new Set(sections.map((s) => s.kind));

  function addSection(kind: StoryKind) {
    update((d) => {
      d.system.story.push({ kind, heading: storyKindLabels[kind], body: "" });
    });
  }

  return (
    <SectionCard
      title="Story & lessons"
      intro="The story is why a stranger trusts the method. Each block answers one question — write like you'd tell a friend at the kitchen table."
    >
      {sections.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink/30 bg-cream p-4 text-sm text-ink-soft">
          No story yet. Start with <span className="font-bold">What happened</span> —
          the moment this system became necessary.
        </p>
      )}

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="rounded-xl border border-ink/15 bg-cream/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-mustard-soft px-2.5 py-0.5 text-[11px] font-bold text-ink">
                {section.kind ? storyKindLabels[section.kind] : "Section"}
              </span>
              <GhostButton
                danger
                onClick={() =>
                  update((d) => void d.system.story.splice(i, 1))
                }
              >
                Remove
              </GhostButton>
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Heading" htmlFor={`story-h-${i}`}>
                <TextInput
                  id={`story-h-${i}`}
                  value={section.heading}
                  onChange={(e) =>
                    update((d) => void (d.system.story[i].heading = e.target.value))
                  }
                />
              </Field>
              <Field label="The story" htmlFor={`story-b-${i}`}>
                <TextArea
                  id={`story-b-${i}`}
                  rows={5}
                  value={section.body}
                  onChange={(e) =>
                    update((d) => void (d.system.story[i].body = e.target.value))
                  }
                  placeholder="Write it the way it actually went…"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-bold">Add a section</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => addSection(kind)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                usedKinds.has(kind)
                  ? "border-ink/15 text-ink-soft/50 hover:border-sage hover:text-sage-deep"
                  : "border-ink/30 hover:border-sage hover:bg-sage-soft hover:text-sage-deep"
              }`}
            >
              + {storyKindLabels[kind]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          You can add the same kind twice (v2 lessons and v4 lessons are both
          real). Reordering arrives in a later phase.
        </p>
      </div>
    </SectionCard>
  );
}
