"use client";

import type { WorkspaceSystem } from "@/domain/workspace";
import { ChipsInput, Field, SectionCard, TextArea, TextInput } from "./fields";

type Update = (fn: (ws: WorkspaceSystem) => void) => void;

/**
 * Household context — the interpretive frame that makes advice judgeable.
 * Human questions on the surface; structured context + semantic circumstance
 * facets underneath (Phase 2 semantic foundation).
 */
export function ContextSection({ ws, update }: { ws: WorkspaceSystem; update: Update }) {
  const ctx = ws.context;
  return (
    <SectionCard
      title="Household context"
      intro="Visitors judge whether a system transfers by whether your household resembles theirs. Specific beats flattering."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Household size" htmlFor="ctx-size">
          <TextInput
            id="ctx-size"
            value={ctx.householdSize}
            onChange={(e) => update((d) => void (d.context.householdSize = e.target.value))}
            placeholder="2 adults · 2 kids"
          />
        </Field>
        <Field label="Family stage" htmlFor="ctx-stage">
          <TextInput
            id="ctx-stage"
            value={ctx.familyStage ?? ""}
            onChange={(e) => update((d) => void (d.context.familyStage = e.target.value))}
            placeholder="school-age kids / newborn weeks / empty nest…"
          />
        </Field>
      </div>

      <Field label="Kids' ages (if any)" htmlFor="ctx-ages">
        <ChipsInput
          id="ctx-ages"
          values={ctx.ageRanges}
          onChange={(v) => update((d) => void (d.context.ageRanges = v))}
          placeholder="7, 10"
        />
      </Field>

      <Field
        label="Dietary or medical constraints"
        hint="Medical facts stay yours to state — yurrmom.com never diagnoses."
        htmlFor="ctx-diet"
      >
        <ChipsInput
          id="ctx-diet"
          values={ctx.diet}
          onChange={(v) => update((d) => void (d.context.diet = v))}
          placeholder="Gluten-free (celiac — medical), …"
        />
      </Field>

      <Field label="Hard constraints" htmlFor="ctx-constraints">
        <ChipsInput
          id="ctx-constraints"
          values={ctx.constraints}
          onChange={(v) => update((d) => void (d.context.constraints = v))}
          placeholder="One shared kitchen, no second fridge…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Budget orientation" htmlFor="ctx-budget">
          <TextInput
            id="ctx-budget"
            value={ctx.budgetOrientation}
            onChange={(e) => update((d) => void (d.context.budgetOrientation = e.target.value))}
            placeholder="Mid-budget, brand-flexible…"
          />
        </Field>
        <Field label="Schedule / work constraints" htmlFor="ctx-schedule">
          <TextInput
            id="ctx-schedule"
            value={ctx.schedule}
            onChange={(e) => update((d) => void (d.context.schedule = e.target.value))}
            placeholder="Two working parents, dinners under 40 min"
          />
        </Field>
      </div>

      <Field label="Stores commonly used" htmlFor="ctx-stores">
        <ChipsInput
          id="ctx-stores"
          values={ctx.storesUsed}
          onChange={(v) => update((d) => void (d.context.storesUsed = v))}
          placeholder="Kroger, Target, Costco"
        />
      </Field>

      <Field
        label="Setting — climate, location, classroom, caregiving…"
        htmlFor="ctx-env"
      >
        <TextInput
          id="ctx-env"
          value={ctx.environment ?? ""}
          onChange={(e) => update((d) => void (d.context.environment = e.target.value))}
          placeholder="Suburban Ohio / small apartment / classroom of 24…"
        />
      </Field>

      <Field
        label="Anything else about your circumstances"
        hint="Plain language. Whatever the boxes above missed."
        htmlFor="ctx-more"
      >
        <TextArea
          id="ctx-more"
          value={ctx.additionalContext ?? ""}
          onChange={(e) => update((d) => void (d.context.additionalContext = e.target.value))}
          placeholder="We host both grandmothers every other weekend, which doubles the kitchen traffic…"
        />
      </Field>

      <Field
        label="Circumstances that define this system"
        hint="Short phrases a future search can match on — e.g. 'celiac child', 'one shared kitchen'."
        htmlFor="ctx-circumstances"
      >
        <ChipsInput
          id="ctx-circumstances"
          values={ws.system.facets?.householdCircumstances ?? []}
          onChange={(v) =>
            update((d) => {
              d.system.facets = { ...d.system.facets, householdCircumstances: v };
            })
          }
          placeholder="celiac child, one shared kitchen"
        />
      </Field>

      <Field
        label="One-line context label (shown publicly)"
        htmlFor="ctx-label"
      >
        <TextInput
          id="ctx-label"
          value={ctx.label}
          onChange={(e) => update((d) => void (d.context.label = e.target.value))}
          placeholder="Suburban household of four, one celiac kid"
        />
      </Field>
    </SectionCard>
  );
}

/** Problem & promise — what it solves, for whom, honestly bounded. */
export function PromiseSection({ ws, update }: { ws: WorkspaceSystem; update: Update }) {
  const s = ws.system;
  return (
    <SectionCard
      title="Problem & promise"
      intro="A stressed person should be able to read this block alone and know whether your system is for them."
    >
      <Field
        label="The problem this system solves"
        htmlFor="p-problem"
      >
        <TextArea
          id="p-problem"
          value={s.problem}
          onChange={(e) => update((d) => void (d.system.problem = e.target.value))}
          placeholder="After a celiac diagnosis, most families try to be careful everywhere, all the time…"
        />
      </Field>

      <Field
        label="The promise — one sentence"
        hint="What actually becomes true if someone adopts this."
        htmlFor="p-promise"
      >
        <TextArea
          id="p-promise"
          rows={2}
          value={s.promise}
          onChange={(e) => update((d) => void (d.system.promise = e.target.value))}
          placeholder="Rebuild one shared kitchen so the gluten-free person in it is safe by default…"
        />
      </Field>

      <Field label="Who it's useful for" htmlFor="p-audience">
        <TextInput
          id="p-audience"
          value={s.audience ?? ""}
          onChange={(e) => update((d) => void (d.system.audience = e.target.value))}
          placeholder="Families adapting one shared kitchen to a celiac diagnosis…"
        />
      </Field>

      <Field
        label="Results you have actually experienced"
        hint="Observed, not promised. Numbers and dates beat adjectives."
        htmlFor="p-results"
      >
        <TextArea
          id="p-results"
          value={s.observedResults ?? ""}
          onChange={(e) => update((d) => void (d.system.observedResults = e.target.value))}
          placeholder="Zero cross-contact incidents since 2024…"
        />
      </Field>

      <Field
        label="Where it may NOT apply"
        hint="Honesty is a feature. This renders publicly next to the promise."
        htmlFor="p-limits"
      >
        <TextArea
          id="p-limits"
          value={s.limitations ?? ""}
          onChange={(e) => update((d) => void (d.system.limitations = e.target.value))}
          placeholder="Assumes school-age kids; toddlers and shared rentals need tighter rules…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="In one line: what is this system's purpose?"
          htmlFor="p-purpose"
        >
          <TextInput
            id="p-purpose"
            value={s.facets?.purpose ?? ""}
            onChange={(e) =>
              update((d) => {
                d.system.facets = { ...d.system.facets, purpose: e.target.value };
              })
            }
            placeholder="Make a shared kitchen safe by default"
          />
        </Field>
        <Field label="What part of home life?" htmlFor="p-domain">
          <TextInput
            id="p-domain"
            value={s.facets?.domain ?? ""}
            onChange={(e) =>
              update((d) => {
                d.system.facets = { ...d.system.facets, domain: e.target.value };
              })
            }
            placeholder="Kitchen & food safety"
          />
        </Field>
      </div>

      <Field
        label="Situations this helps with"
        hint="Powers Find Help. Short, situation-shaped phrases."
        htmlFor="p-tags"
      >
        <ChipsInput
          id="p-tags"
          values={s.situationTags}
          onChange={(v) => update((d) => void (d.system.situationTags = v))}
          placeholder="gluten-free-household, shared-kitchen"
        />
      </Field>
    </SectionCard>
  );
}
