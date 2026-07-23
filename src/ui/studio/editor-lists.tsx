"use client";

import type { ItemImportance, ListItem } from "@/domain/types";
import type { WorkspaceSystem } from "@/domain/workspace";
import { slugify } from "@/domain/workspace";
import {
  Field,
  GhostButton,
  SectionCard,
  Select,
  TextArea,
  TextInput,
} from "./fields";

type Update = (fn: (ws: WorkspaceSystem) => void) => void;

const importanceOptions: { value: ItemImportance; label: string }[] = [
  { value: "required", label: "Required — system fails without it" },
  { value: "optional", label: "Optional — nice, not necessary" },
  { value: "situational", label: "Situational — depends on the household" },
];

function newItem(): ListItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    need: "",
    quantity: "",
    recurrence: "",
    importance: "required",
    substitutions: [],
  };
}

/**
 * Structured portable-list editor. The NEED is the primary field; the
 * creator's pick is separate; retailer/affiliate links are separate OFFERS
 * under the pick — never the product's identity (docs/07 separation 2).
 */
export function ListsSection({ ws, update }: { ws: WorkspaceSystem; update: Update }) {
  function addList() {
    update((d) => {
      const base = slugify(`${d.system.slug}-list-${d.lists.length + 1}`);
      const slug = d.lists.some((l) => l.slug === base) ? `${base}-b` : base;
      d.lists.push({
        slug,
        systemSlug: d.system.slug,
        title: "",
        intro: "",
        items: [],
      });
      d.system.listSlugs = d.lists.map((l) => l.slug);
    });
  }

  return (
    <SectionCard
      title="Portable lists"
      intro="A list describes needs, not SKUs — it has to work at any store. Products and links live underneath the need, never instead of it."
    >
      {ws.lists.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink/30 bg-cream p-4 text-sm text-ink-soft">
          No lists yet. Most systems have one — the recurring backbone of the
          method.
        </p>
      )}

      <div className="space-y-6">
        {ws.lists.map((list, li) => (
          <div key={list.slug} className="rounded-xl border border-ink/15 bg-cream/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-[11px] font-bold text-sage-deep">
                List {li + 1} · {list.items.length} item{list.items.length === 1 ? "" : "s"}
              </span>
              <GhostButton
                danger
                onClick={() =>
                  update((d) => {
                    d.lists.splice(li, 1);
                    d.system.listSlugs = d.lists.map((l) => l.slug);
                  })
                }
              >
                Remove list
              </GhostButton>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="List title" htmlFor={`l-${li}-title`}>
                <TextInput
                  id={`l-${li}-title`}
                  value={list.title}
                  onChange={(e) =>
                    update((d) => void (d.lists[li].title = e.target.value))
                  }
                  placeholder="Celiac-Safe Pantry Staples"
                />
              </Field>
              <Field label="One-line intro" htmlFor={`l-${li}-intro`}>
                <TextInput
                  id={`l-${li}-intro`}
                  value={list.intro}
                  onChange={(e) =>
                    update((d) => void (d.lists[li].intro = e.target.value))
                  }
                  placeholder="The recurring backbone of…"
                />
              </Field>
            </div>

            {/* Items */}
            <div className="mt-4 space-y-3">
              {list.items.map((item, ii) => (
                <details
                  key={item.id}
                  className="group rounded-xl border border-ink/15 bg-paper p-3"
                  open={!item.need}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">
                        {item.need || "New item — open to fill in"}
                      </span>
                      <span className="block text-xs text-ink-soft">
                        {[item.quantity, item.recurrence, item.importance]
                          .filter(Boolean)
                          .join(" · ") || "need · quantity · recurrence"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-ink-soft group-open:hidden">
                      edit ▾
                    </span>
                  </summary>

                  <div className="mt-3 space-y-3 border-t border-ink/10 pt-3">
                    <Field
                      label="The underlying need"
                      hint="Retailer-independent. What must be satisfied?"
                      htmlFor={`i-${item.id}-need`}
                    >
                      <TextInput
                        id={`i-${item.id}-need`}
                        value={item.need}
                        onChange={(e) =>
                          update(
                            (d) => void (d.lists[li].items[ii].need = e.target.value),
                          )
                        }
                        placeholder="Certified GF all-purpose flour"
                      />
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Quantity" htmlFor={`i-${item.id}-qty`}>
                        <TextInput
                          id={`i-${item.id}-qty`}
                          value={item.quantity}
                          onChange={(e) =>
                            update(
                              (d) =>
                                void (d.lists[li].items[ii].quantity = e.target.value),
                            )
                          }
                          placeholder="2 bags (3 lb ea.)"
                        />
                      </Field>
                      <Field label="Recurrence" htmlFor={`i-${item.id}-rec`}>
                        <TextInput
                          id={`i-${item.id}-rec`}
                          value={item.recurrence}
                          onChange={(e) =>
                            update(
                              (d) =>
                                void (d.lists[li].items[ii].recurrence =
                                  e.target.value),
                            )
                          }
                          placeholder="Monthly"
                        />
                      </Field>
                      <Field label="How essential?" htmlFor={`i-${item.id}-imp`}>
                        <Select
                          id={`i-${item.id}-imp`}
                          value={item.importance ?? "required"}
                          onChange={(v) =>
                            update(
                              (d) =>
                                void (d.lists[li].items[ii].importance =
                                  v as ItemImportance),
                            )
                          }
                          options={importanceOptions}
                        />
                      </Field>
                    </div>

                    {/* Creator's pick — identity, not an offer */}
                    <div className="rounded-lg bg-sage-soft/50 p-3">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-sage-deep">
                        Your pick (optional)
                      </p>
                      <div className="mt-2 space-y-3">
                        <Field label="Product" htmlFor={`i-${item.id}-pname`}>
                          <TextInput
                            id={`i-${item.id}-pname`}
                            value={item.preferred?.name ?? ""}
                            onChange={(e) =>
                              update((d) => {
                                const it = d.lists[li].items[ii];
                                it.preferred = {
                                  name: e.target.value,
                                  why: it.preferred?.why ?? "",
                                  offers: it.preferred?.offers ?? [],
                                };
                              })
                            }
                            placeholder="King Arthur Measure for Measure"
                          />
                        </Field>
                        <Field
                          label="Why this one"
                          hint="Your lived reason — this is the part strangers trust."
                          htmlFor={`i-${item.id}-pwhy`}
                        >
                          <TextArea
                            id={`i-${item.id}-pwhy`}
                            rows={2}
                            value={item.preferred?.why ?? ""}
                            onChange={(e) =>
                              update((d) => {
                                const it = d.lists[li].items[ii];
                                if (!it.preferred)
                                  it.preferred = { name: "", why: "", offers: [] };
                                it.preferred.why = e.target.value;
                              })
                            }
                            placeholder="Swaps 1:1 into the recipes the kids already loved…"
                          />
                        </Field>

                        {/* Offers — separate from identity, affiliate marked */}
                        <div>
                          <p className="text-xs font-bold">
                            Where to get it — links open at the retailer
                          </p>
                          <div className="mt-2 space-y-2">
                            {(item.preferred?.offers ?? []).map((offer, oi) => (
                              <div
                                key={oi}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/15 bg-paper p-2"
                              >
                                <TextInput
                                  aria-label="Retailer name"
                                  value={offer.retailer}
                                  onChange={(e) =>
                                    update(
                                      (d) =>
                                        void (d.lists[li].items[ii].preferred!.offers[
                                          oi
                                        ].retailer = e.target.value),
                                    )
                                  }
                                  placeholder="Target"
                                  className="!w-28"
                                />
                                <TextInput
                                  aria-label="Offer URL"
                                  value={offer.url}
                                  onChange={(e) =>
                                    update(
                                      (d) =>
                                        void (d.lists[li].items[ii].preferred!.offers[
                                          oi
                                        ].url = e.target.value),
                                    )
                                  }
                                  placeholder="https://…"
                                  className="!w-auto min-w-40 flex-1"
                                />
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                                  <input
                                    type="checkbox"
                                    checked={offer.affiliate}
                                    onChange={(e) =>
                                      update(
                                        (d) =>
                                          void (d.lists[li].items[ii].preferred!.offers[
                                            oi
                                          ].affiliate = e.target.checked),
                                      )
                                    }
                                    className="size-4 accent-sage"
                                  />
                                  my affiliate link
                                </label>
                                <GhostButton
                                  danger
                                  onClick={() =>
                                    update(
                                      (d) =>
                                        void d.lists[li].items[
                                          ii
                                        ].preferred!.offers.splice(oi, 1),
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
                                update((d) => {
                                  const it = d.lists[li].items[ii];
                                  if (!it.preferred)
                                    it.preferred = { name: "", why: "", offers: [] };
                                  it.preferred.offers.push({
                                    retailer: "",
                                    url: "",
                                    state: "link-only",
                                    affiliate: false,
                                  });
                                })
                              }
                            >
                              + Add retailer link
                            </GhostButton>
                          </div>
                          <p className="mt-1.5 text-[11px] text-ink-soft">
                            Affiliate links are marked publicly and the earnings
                            are 100% yours. Links are link-only — yurrmom.com never
                            fakes cart sync.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Substitutions */}
                    <div>
                      <p className="text-sm font-bold">Substitutions that work</p>
                      <div className="mt-2 space-y-2">
                        {item.substitutions.map((sub, si) => (
                          <div
                            key={si}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/15 bg-paper p-2"
                          >
                            <TextInput
                              aria-label="Substitution name"
                              value={sub.name}
                              onChange={(e) =>
                                update(
                                  (d) =>
                                    void (d.lists[li].items[ii].substitutions[
                                      si
                                    ].name = e.target.value),
                                )
                              }
                              placeholder="Bob's Red Mill 1-to-1"
                              className="!w-auto min-w-36 flex-1"
                            />
                            <TextInput
                              aria-label="Substitution tradeoff"
                              value={sub.note}
                              onChange={(e) =>
                                update(
                                  (d) =>
                                    void (d.lists[li].items[ii].substitutions[
                                      si
                                    ].note = e.target.value),
                                )
                              }
                              placeholder="the tradeoff, honestly"
                              className="!w-auto min-w-40 flex-[2]"
                            />
                            <GhostButton
                              danger
                              onClick={() =>
                                update(
                                  (d) =>
                                    void d.lists[li].items[ii].substitutions.splice(
                                      si,
                                      1,
                                    ),
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
                                void d.lists[li].items[ii].substitutions.push({
                                  name: "",
                                  note: "",
                                }),
                            )
                          }
                        >
                          + Add substitution
                        </GhostButton>
                      </div>
                    </div>

                    <Field
                      label="Notes on use"
                      hint="Where ten years of mistakes go to die."
                      htmlFor={`i-${item.id}-notes`}
                    >
                      <TextArea
                        id={`i-${item.id}-notes`}
                        rows={2}
                        value={item.notes ?? ""}
                        onChange={(e) =>
                          update(
                            (d) => void (d.lists[li].items[ii].notes = e.target.value),
                          )
                        }
                        placeholder="Lives in the GREEN-lid bin, always…"
                      />
                    </Field>

                    <div className="text-right">
                      <GhostButton
                        danger
                        onClick={() =>
                          update((d) => void d.lists[li].items.splice(ii, 1))
                        }
                      >
                        Remove item
                      </GhostButton>
                    </div>
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-3">
              <GhostButton
                onClick={() =>
                  update((d) => void d.lists[li].items.push(newItem()))
                }
              >
                + Add item
              </GhostButton>
            </div>
          </div>
        ))}
      </div>

      <div>
        <GhostButton onClick={addList}>+ Add a list</GhostButton>
      </div>
    </SectionCard>
  );
}
