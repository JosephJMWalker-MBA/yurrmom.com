"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { copy, fmt } from "@/i18n";
import { getList } from "@/data";
import {
  DISTRIBUTION_TEMPLATES,
  getTemplate,
  type AssetType,
  type SourceSelection,
} from "@/domain/distribution";
import { useDistribution } from "./use-distribution";

const ASSET_TYPES: { type: AssetType; label: string }[] = [
  { type: "short-form-video", label: "Short-form video" },
  { type: "social-post", label: "Social post" },
  { type: "pinterest-pin", label: "Pinterest pin" },
  { type: "newsletter-section", label: "Newsletter section" },
  { type: "blog-draft", label: "Blog draft" },
];

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-ink/10 bg-cream px-3 py-2 text-sm hover:border-sage">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-sage-deep"
      />
      <span className="text-ink">{children}</span>
    </label>
  );
}

export function ContentCreate() {
  const router = useRouter();
  const { ready, systems, create } = useDistribution();
  const [systemSlug, setSystemSlug] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("short-form-video");
  const [templateId, setTemplateId] = useState("");
  const [internalName, setInternalName] = useState("");
  const [selection, setSelection] = useState<SourceSelection>({ problem: true });
  const [error, setError] = useState<string | null>(null);

  const system = useMemo(() => systems.find((s) => s.slug === systemSlug), [systems, systemSlug]);
  const lists = useMemo(
    () => (system ? system.listSlugs.map((s) => getList(s)).filter((l): l is NonNullable<typeof l> => Boolean(l)) : []),
    [system],
  );
  const templates = useMemo(
    () => Object.values(DISTRIBUTION_TEMPLATES).filter((t) => t.assetType === assetType),
    [assetType],
  );

  if (!ready) return <p className="text-sm text-ink-soft">Loading…</p>;

  const toggle = (patch: Partial<SourceSelection>) => setSelection((s) => ({ ...s, ...patch }));
  const toggleIndex = (key: "storyIndices" | "routineIndices" | "recipeIndices", i: number) =>
    setSelection((s) => {
      const set = new Set(s[key] ?? []);
      if (set.has(i)) set.delete(i);
      else set.add(i);
      return { ...s, [key]: [...set].sort((a, b) => a - b) };
    });
  const toggleListItem = (idKey: string) =>
    setSelection((s) => {
      const set = new Set(s.listItemIds ?? []);
      if (set.has(idKey)) set.delete(idKey);
      else set.add(idKey);
      return { ...s, listItemIds: [...set] };
    });

  const onCreate = () => {
    setError(null);
    if (!system) return setError("Choose a source system.");
    const tid = templateId || templates[0]?.id;
    if (!tid) return setError("Choose a template.");
    const result = create({ systemSlug: system.slug, templateId: tid, selection, internalName: internalName.trim() || undefined });
    if (!result.ok) return setError(result.reason);
    router.push(`/studio/content/${encodeURIComponent(result.asset.id)}`);
  };

  const selectedTemplateId = templateId || templates[0]?.id || "";
  const selectedTemplate = getTemplate(selectedTemplateId);

  return (
    <div className="max-w-3xl">
      <Link href="/studio/content" className="text-sm font-semibold text-ink-soft hover:text-sage-deep">
        {copy.content.backToOverview}
      </Link>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{copy.content.createTitle}</h1>
      <p className="mt-2 text-sm text-ink-soft">{copy.content.createTagline}</p>
      <p className="mt-3 rounded-xl border border-ink/15 bg-cream px-4 py-2.5 text-xs text-ink-soft">
        {copy.content.localeNote}
      </p>

      <div className="mt-6 space-y-6">
        {/* system */}
        <div>
          <label className="block text-sm font-bold text-ink">{copy.content.sourceSystemLabel}</label>
          <select
            value={systemSlug}
            onChange={(e) => {
              setSystemSlug(e.target.value);
              setSelection({ problem: true });
            }}
            className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm"
          >
            <option value="">— choose —</option>
            {systems.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title} (v{s.version})
              </option>
            ))}
          </select>
        </div>

        {/* format + template */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-ink">{copy.content.formatLabel}</label>
            <select
              value={assetType}
              onChange={(e) => {
                setAssetType(e.target.value as AssetType);
                setTemplateId("");
              }}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-ink">{copy.content.templateLabel}</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} → {t.channels.join(" / ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* source material */}
        {system && (
          <div>
            <p className="text-sm font-bold text-ink">{copy.content.includeLabel}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {selectedTemplate ? `Channel: ${selectedTemplate.channels[0]}` : ""}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Check checked={!!selection.promise} onChange={(v) => toggle({ promise: v })}>
                {copy.content.includePromise}
              </Check>
              <Check checked={!!selection.problem} onChange={(v) => toggle({ problem: v })}>
                {copy.content.includeProblem}
              </Check>
              {system.audience && (
                <Check checked={!!selection.householdContext} onChange={(v) => toggle({ householdContext: v })}>
                  {copy.content.includeContext}
                </Check>
              )}
              {system.observedResults && (
                <Check checked={!!selection.observedOutcomes} onChange={(v) => toggle({ observedOutcomes: v })}>
                  {copy.content.includeObserved}
                </Check>
              )}
              {system.limitations && (
                <Check checked={!!selection.limitations} onChange={(v) => toggle({ limitations: v })}>
                  {copy.content.includeLimitations}
                </Check>
              )}
              {system.story.map((s, i) => (
                <Check
                  key={`story-${i}`}
                  checked={(selection.storyIndices ?? []).includes(i)}
                  onChange={() => toggleIndex("storyIndices", i)}
                >
                  {fmt(copy.content.includeStory, { heading: s.heading })}
                </Check>
              ))}
              {system.routines.map((r, i) => (
                <Check
                  key={`routine-${i}`}
                  checked={(selection.routineIndices ?? []).includes(i)}
                  onChange={() => toggleIndex("routineIndices", i)}
                >
                  {fmt(copy.content.includeRoutine, { title: r.title })}
                </Check>
              ))}
              {system.recipes.map((r, i) => (
                <Check
                  key={`recipe-${i}`}
                  checked={(selection.recipeIndices ?? []).includes(i)}
                  onChange={() => toggleIndex("recipeIndices", i)}
                >
                  {fmt(copy.content.includeRecipe, { title: r.title })}
                </Check>
              ))}
              {lists.flatMap((l) =>
                l.items.map((it) => {
                  const idKey = `${l.slug}#${it.id}`;
                  return (
                    <Check
                      key={idKey}
                      checked={(selection.listItemIds ?? []).includes(idKey)}
                      onChange={() => toggleListItem(idKey)}
                    >
                      {fmt(copy.content.includeListItem, { need: it.need })}
                    </Check>
                  );
                }),
              )}
            </div>
          </div>
        )}

        {/* internal name */}
        <div>
          <label className="block text-sm font-bold text-ink">{copy.content.internalNameLabel}</label>
          <input
            value={internalName}
            onChange={(e) => setInternalName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm"
            placeholder={system ? `${system.title} — ${assetType}` : ""}
          />
        </div>

        {error && <p className="rounded-lg border border-tomato/50 bg-cream px-3 py-2 text-sm text-tomato-deep">{error}</p>}

        <button
          type="button"
          onClick={onCreate}
          disabled={!system}
          className="rounded-full border-2 border-ink bg-sage px-6 py-2.5 text-sm font-extrabold text-cream transition-colors hover:bg-sage-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copy.content.createButton}
        </button>
      </div>
    </div>
  );
}
