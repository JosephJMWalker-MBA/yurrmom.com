"use client";

import type { WorkspaceSystem } from "@/domain/workspace";
import {
  ChipsInput,
  Field,
  GhostButton,
  SectionCard,
  Select,
  TextArea,
  TextInput,
} from "./fields";

type Update = (fn: (ws: WorkspaceSystem) => void) => void;

/**
 * Routines & recipes: ordered steps, timing, frequency, prerequisites, notes.
 * Each routine can optionally describe what it teaches a kid — the Cred at
 * Home structural seam. No scores, no judgments, no rewards: those are
 * intentionally impossible here.
 */
export function RoutinesSection({ ws, update }: { ws: WorkspaceSystem; update: Update }) {
  const routines = ws.system.routines;
  const recipes = ws.system.recipes;

  return (
    <SectionCard
      title="Routines & recipes"
      intro="The repeatable moves that make the system run. Steps stay ordered; timing and frequency make them followable."
    >
      {/* ---------------- Routines ---------------- */}
      <div className="space-y-4">
        {routines.map((routine, ri) => (
          <div key={ri} className="rounded-xl border border-ink/15 bg-cream/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-mustard-soft px-2.5 py-0.5 text-[11px] font-bold text-ink">
                Routine
              </span>
              <GhostButton
                danger
                onClick={() => update((d) => void d.system.routines.splice(ri, 1))}
              >
                Remove
              </GhostButton>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Routine name" htmlFor={`r-${ri}-title`}>
                <TextInput
                  id={`r-${ri}-title`}
                  value={routine.title}
                  onChange={(e) =>
                    update((d) => void (d.system.routines[ri].title = e.target.value))
                  }
                  placeholder="The Sunday Label Check"
                />
              </Field>
              <Field label="Frequency & timing" htmlFor={`r-${ri}-freq`}>
                <TextInput
                  id={`r-${ri}-freq`}
                  value={routine.frequency}
                  onChange={(e) =>
                    update(
                      (d) => void (d.system.routines[ri].frequency = e.target.value),
                    )
                  }
                  placeholder="Weekly · 10 minutes"
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field
                label="Prerequisites"
                hint="What must already be true before this routine can run."
                htmlFor={`r-${ri}-pre`}
              >
                <ChipsInput
                  id={`r-${ri}-pre`}
                  values={routine.prerequisites ?? []}
                  onChange={(v) =>
                    update((d) => void (d.system.routines[ri].prerequisites = v))
                  }
                  placeholder="Green/red zones set up, label kit stocked"
                />
              </Field>
            </div>

            {/* Ordered steps */}
            <div className="mt-3">
              <p className="text-sm font-bold">Steps, in order</p>
              <div className="mt-2 space-y-2">
                {routine.steps.map((step, si) => (
                  <div
                    key={si}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/15 bg-paper p-2"
                  >
                    <span className="w-5 text-center text-xs font-extrabold text-ink-soft">
                      {si + 1}
                    </span>
                    <TextInput
                      aria-label={`Step ${si + 1} timing`}
                      value={step.when}
                      onChange={(e) =>
                        update(
                          (d) =>
                            void (d.system.routines[ri].steps[si].when =
                              e.target.value),
                        )
                      }
                      placeholder="Sunday, while coffee brews"
                      className="!w-auto min-w-32 flex-1"
                    />
                    <TextInput
                      aria-label={`Step ${si + 1} action`}
                      value={step.what}
                      onChange={(e) =>
                        update(
                          (d) =>
                            void (d.system.routines[ri].steps[si].what =
                              e.target.value),
                        )
                      }
                      placeholder="what happens"
                      className="!w-auto min-w-44 flex-[2]"
                    />
                    <GhostButton
                      danger
                      onClick={() =>
                        update(
                          (d) => void d.system.routines[ri].steps.splice(si, 1),
                        )
                      }
                    >
                      ×
                    </GhostButton>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <GhostButton
                  onClick={() =>
                    update(
                      (d) =>
                        void d.system.routines[ri].steps.push({ when: "", what: "" }),
                    )
                  }
                >
                  + Add step
                </GhostButton>
              </div>
            </div>

            <div className="mt-3">
              <Field label="Note (optional)" htmlFor={`r-${ri}-note`}>
                <TextInput
                  id={`r-${ri}-note`}
                  value={routine.note ?? ""}
                  onChange={(e) =>
                    update((d) => void (d.system.routines[ri].note = e.target.value))
                  }
                  placeholder="The slot is non-negotiable; everything else flexes."
                />
              </Field>
            </div>

            {/* Culture & translation readiness — optional, honest (Phase 3) */}
            <details className="mt-3 rounded-lg border border-ink/15 bg-paper p-3">
              <summary className="cursor-pointer text-sm font-bold text-sage-deep">
                Does this transfer across cultures &amp; languages? (optional)
              </summary>
              <p className="mt-2 text-xs text-ink-soft">
                Some practices depend on local labels, laws, stores, or customs.
                Saying so here keeps a future translation from giving someone
                false confidence.
              </p>
              <div className="mt-3 space-y-3">
                <Field
                  label="How this varies by culture or household"
                  htmlFor={`r-${ri}-culture`}
                >
                  <TextArea
                    id={`r-${ri}-culture`}
                    rows={2}
                    value={routine.culturalNote ?? ""}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.routines[ri].culturalNote =
                            e.target.value),
                      )
                    }
                    placeholder="Built around US grocery labeling; the zone idea transfers anywhere…"
                  />
                </Field>
                <Field
                  label="Caution for translators"
                  hint="What would break if this were translated word-for-word?"
                  htmlFor={`r-${ri}-transcaution`}
                >
                  <TextArea
                    id={`r-${ri}-transcaution`}
                    rows={2}
                    value={routine.translationCaution ?? ""}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.routines[ri].translationCaution =
                            e.target.value),
                      )
                    }
                    placeholder="Certification marks differ by country — the label check must be re-taught locally…"
                  />
                </Field>
              </div>
            </details>

            {/* Cred at Home structural seam — human, optional, no scores */}
            <details className="mt-3 rounded-lg border border-ink/15 bg-paper p-3">
              <summary className="cursor-pointer text-sm font-bold text-sage-deep">
                Can this routine teach a kid something? (optional)
              </summary>
              <p className="mt-2 text-xs text-ink-soft">
                Describe what it teaches and how you&apos;d know they&apos;ve got it.
                This never scores or judges a child — it only records what the
                routine can teach, in your words.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Skill taught" htmlFor={`r-${ri}-skill`}>
                  <TextInput
                    id={`r-${ri}-skill`}
                    value={routine.cred?.skillTaught ?? ""}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.routines[ri].cred = {
                            ...d.system.routines[ri].cred,
                            skillTaught: e.target.value,
                          }),
                      )
                    }
                    placeholder="Reading allergen labels"
                  />
                </Field>
                <Field label="Age it fits" htmlFor={`r-${ri}-age`}>
                  <TextInput
                    id={`r-${ri}-age`}
                    value={routine.cred?.ageApplicability ?? ""}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.routines[ri].cred = {
                            ...d.system.routines[ri].cred,
                            ageApplicability: e.target.value,
                          }),
                      )
                    }
                    placeholder="About 9+ alongside an adult"
                  />
                </Field>
                <Field label="Supervision" htmlFor={`r-${ri}-sup`}>
                  <Select
                    id={`r-${ri}-sup`}
                    value={routine.cred?.supervisionLevel ?? "nearby"}
                    onChange={(v) =>
                      update(
                        (d) =>
                          void (d.system.routines[ri].cred = {
                            ...d.system.routines[ri].cred,
                            supervisionLevel: v as "none" | "nearby" | "direct",
                          }),
                      )
                    }
                    options={[
                      { value: "direct", label: "Adult does it with them" },
                      { value: "nearby", label: "Adult nearby" },
                      { value: "none", label: "Independent once learned" },
                    ]}
                  />
                </Field>
                <Field label="Practice rhythm" htmlFor={`r-${ri}-practice`}>
                  <TextInput
                    id={`r-${ri}-practice`}
                    value={routine.cred?.practiceFrequency ?? ""}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.routines[ri].cred = {
                            ...d.system.routines[ri].cred,
                            practiceFrequency: e.target.value,
                          }),
                      )
                    }
                    placeholder="Weekly — it IS the routine"
                  />
                </Field>
              </div>
              <div className="mt-3 space-y-3">
                <Field
                  label="How you'd know they've got it"
                  htmlFor={`r-${ri}-comp`}
                >
                  <TextArea
                    id={`r-${ri}-comp`}
                    rows={2}
                    value={routine.cred?.competenceCriteria ?? ""}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.routines[ri].cred = {
                            ...d.system.routines[ri].cred,
                            competenceCriteria: e.target.value,
                          }),
                      )
                    }
                    placeholder="Can explain why 'unsure counts as fail'…"
                  />
                </Field>
                <Field
                  label="What counts as having done it"
                  htmlFor={`r-${ri}-evid`}
                >
                  <TextInput
                    id={`r-${ri}-evid`}
                    value={routine.cred?.evidenceOfCompletion ?? ""}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.routines[ri].cred = {
                            ...d.system.routines[ri].cred,
                            evidenceOfCompletion: e.target.value,
                          }),
                      )
                    }
                    placeholder="Runs the whole check, three Sundays in a row"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={routine.cred?.demonstrationRequired ?? false}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.routines[ri].cred = {
                            ...d.system.routines[ri].cred,
                            demonstrationRequired: e.target.checked,
                          }),
                      )
                    }
                    className="size-4 accent-sage"
                  />
                  They should demonstrate it before doing it solo
                </label>
              </div>
            </details>
          </div>
        ))}
      </div>

      <div>
        <GhostButton
          onClick={() =>
            update(
              (d) =>
                void d.system.routines.push({
                  title: "",
                  frequency: "",
                  steps: [{ when: "", what: "" }],
                }),
            )
          }
        >
          + Add routine
        </GhostButton>
      </div>

      {/* ---------------- Recipes ---------------- */}
      <div className="border-t border-ink/10 pt-4">
        <p className="font-display text-lg font-extrabold">Recipes</p>
        <div className="mt-3 space-y-4">
          {recipes.map((recipe, ci) => (
            <div key={ci} className="rounded-xl border border-ink/15 bg-cream/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-mustard-soft px-2.5 py-0.5 text-[11px] font-bold text-ink">
                  Recipe
                </span>
                <GhostButton
                  danger
                  onClick={() => update((d) => void d.system.recipes.splice(ci, 1))}
                >
                  Remove
                </GhostButton>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Recipe name" htmlFor={`c-${ci}-title`}>
                  <TextInput
                    id={`c-${ci}-title`}
                    value={recipe.title}
                    onChange={(e) =>
                      update((d) => void (d.system.recipes[ci].title = e.target.value))
                    }
                    placeholder="The Tuesday Ziti"
                  />
                </Field>
                <Field label="Servings" htmlFor={`c-${ci}-serv`}>
                  <TextInput
                    id={`c-${ci}-serv`}
                    value={recipe.servings}
                    onChange={(e) =>
                      update(
                        (d) => void (d.system.recipes[ci].servings = e.target.value),
                      )
                    }
                    placeholder="Family of 4 + leftovers"
                  />
                </Field>
                <Field label="Time" htmlFor={`c-${ci}-time`}>
                  <TextInput
                    id={`c-${ci}-time`}
                    value={recipe.time}
                    onChange={(e) =>
                      update((d) => void (d.system.recipes[ci].time = e.target.value))
                    }
                    placeholder="40 min, one pot"
                  />
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field
                  label="Ingredients — one per line"
                  htmlFor={`c-${ci}-ing`}
                >
                  <TextArea
                    id={`c-${ci}-ing`}
                    rows={5}
                    value={recipe.ingredients.join("\n")}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.recipes[ci].ingredients = e.target.value
                            .split("\n")
                            .filter((l) => l.trim() !== "")),
                      )
                    }
                    placeholder={"1 lb GF penne\n1 jar marinara"}
                  />
                </Field>
                <Field label="Steps — one per line, in order" htmlFor={`c-${ci}-steps`}>
                  <TextArea
                    id={`c-${ci}-steps`}
                    rows={5}
                    value={recipe.steps.join("\n")}
                    onChange={(e) =>
                      update(
                        (d) =>
                          void (d.system.recipes[ci].steps = e.target.value
                            .split("\n")
                            .filter((l) => l.trim() !== "")),
                      )
                    }
                    placeholder={"Boil the penne one minute short…\nBrown the meat…"}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Note (optional)" htmlFor={`c-${ci}-note`}>
                  <TextInput
                    id={`c-${ci}-note`}
                    value={recipe.note ?? ""}
                    onChange={(e) =>
                      update((d) => void (d.system.recipes[ci].note = e.target.value))
                    }
                    placeholder="The recipe that ended the 'GF food is sad' era."
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <GhostButton
            onClick={() =>
              update(
                (d) =>
                  void d.system.recipes.push({
                    title: "",
                    servings: "",
                    time: "",
                    ingredients: [],
                    steps: [],
                  }),
              )
            }
          >
            + Add recipe
          </GhostButton>
        </div>
      </div>
    </SectionCard>
  );
}
