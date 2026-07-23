"use client";

import type { SourceType } from "@/domain/types";
import type { WorkspaceSystem } from "@/domain/workspace";
import { Field, SectionCard, Select, TextArea, TextInput } from "./fields";

type Update = (fn: (ws: WorkspaceSystem) => void) => void;

const sourceTypeNotes: Record<SourceType, string> = {
  "personal-experience":
    "Renders publicly as lived experience — what worked in one real household. yurrmom.com will not present it as medical, legal, nutritional, educational, or developmental authority.",
  "professional-guidance":
    "Only choose this if you hold relevant credentials you can name below. yurrmom.com labels what you tell it — it does not verify credentials, and the public page will say so.",
  "sourced-reference":
    "You're relaying information from an external source. Name the source below so readers can weigh it themselves.",
  "community-adaptation":
    "You adapted another household's method. Credit the original in your note below — adaptation is honorable, uncredited copying isn't.",
  // Derivative types below are assigned by the platform (translations, AI,
  // synthesis) and are deliberately NOT offered in the creator select — a
  // creator's own declaration can't be a derivative of itself.
  "translated-derivative":
    "Platform-assigned: a linked translation of an original. Never selectable by a creator.",
  "platform-synthesis":
    "Platform-assigned: assembled from multiple sources. Never selectable by a creator.",
  "ai-assisted-draft":
    "Platform-assigned: drafted with AI assistance. Never selectable by a creator.",
};

/** Only these are creator-declarable in the editor. */
const declarableSourceTypes: { value: SourceType; label: string }[] = [
  { value: "personal-experience", label: "Personal experience — I live this" },
  { value: "professional-guidance", label: "Professional guidance — I work in this field" },
  { value: "sourced-reference", label: "Sourced reference — relaying others' work" },
  { value: "community-adaptation", label: "Community adaptation — I adapted someone's method" },
];

/**
 * Trust & provenance. What kind of knowledge this is, when it was last
 * reviewed, and what it deliberately does not claim. These fields render
 * publicly — trust is content, not chrome.
 */
export function TrustSection({ ws, update }: { ws: WorkspaceSystem; update: Update }) {
  const s = ws.system;
  const prov = s.provenance ?? {
    sourceType: "personal-experience" as SourceType,
    livedExperience: true,
  };

  return (
    <SectionCard
      title="Trust & provenance"
      intro="Readers deserve to know what kind of knowledge this is. Plain labels beat implied authority."
    >
      <Field label="This system is…" htmlFor="t-source">
        <Select
          id="t-source"
          value={prov.sourceType}
          onChange={(v) =>
            update((d) => {
              d.system.provenance = {
                ...prov,
                ...d.system.provenance,
                sourceType: v as SourceType,
              };
            })
          }
          options={declarableSourceTypes}
        />
      </Field>
      <p className="rounded-lg bg-mustard-soft/60 p-3 text-xs leading-relaxed text-ink">
        {sourceTypeNotes[prov.sourceType]}
      </p>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={prov.livedExperience}
          onChange={(e) =>
            update((d) => {
              d.system.provenance = {
                ...prov,
                ...d.system.provenance,
                livedExperience: e.target.checked,
              };
            })
          }
          className="size-4 accent-sage"
        />
        I actually run this system in my own household
      </label>

      <Field
        label="Where this knowledge comes from — in your words"
        htmlFor="t-note"
      >
        <TextArea
          id="t-note"
          rows={2}
          value={prov.creatorNote ?? ""}
          onChange={(e) =>
            update((d) => {
              d.system.provenance = {
                ...prov,
                ...d.system.provenance,
                creatorNote: e.target.value,
              };
            })
          }
          placeholder="Everything here comes from running this kitchen daily since the 2024 diagnosis…"
        />
      </Field>

      <Field
        label="Last reviewed for accuracy"
        hint="Shown publicly. Stale advice erodes trust — review beats re-write."
        htmlFor="t-reviewed"
      >
        <TextInput
          id="t-reviewed"
          type="date"
          value={prov.lastReviewed ?? ""}
          onChange={(e) =>
            update((d) => {
              d.system.provenance = {
                ...prov,
                ...d.system.provenance,
                lastReviewed: e.target.value,
              };
            })
          }
        />
      </Field>

      <Field
        label="Affiliate disclosure"
        hint="Renders wherever your retailer links appear. Required if any offer is an affiliate link."
        htmlFor="t-disclosure"
      >
        <TextArea
          id="t-disclosure"
          rows={3}
          value={s.disclosure ?? ""}
          onChange={(e) => update((d) => void (d.system.disclosure = e.target.value))}
          placeholder="Some retailer links on this system are my affiliate links…"
        />
      </Field>

      <p className="text-xs text-ink-soft">
        Known limitations live in{" "}
        <span className="font-bold">Problem &amp; promise → Where it may NOT
        apply</span> and render beside the promise and in the trust box — one
        field, honest in both places.
      </p>
    </SectionCard>
  );
}
