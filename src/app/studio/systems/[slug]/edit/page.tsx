"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sectionProgress } from "@/domain/workspace";
import type { WorkspaceSystem } from "@/domain/workspace";
import { useWorkspace } from "@/ui/studio/use-workspace";
import { SaveIndicator, StatusBadge } from "@/ui/studio/status";
import { copy, fmt } from "@/i18n";
import { ContextSection, PromiseSection } from "@/ui/studio/editor-basics";
import { StorySection } from "@/ui/studio/editor-story";
import { ListsSection } from "@/ui/studio/editor-lists";
import { RoutinesSection } from "@/ui/studio/editor-routines";
import { TrustSection } from "@/ui/studio/editor-trust";
import { LanguagePanel } from "@/ui/studio/editor-language";
import { CaptureInbox } from "@/ui/studio/editor-inbox";

type SectionId = "context" | "promise" | "story" | "lists" | "routines" | "trust";

/**
 * The system editor. One document, six structured sections, honest local
 * autosave. Documenting a proven method — not writing a post.
 */
export default function EditSystemPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const {
    ready,
    getSystem,
    updateSystem,
    publishSystem,
    saveStatus,
    lastSavedAt,
  } = useWorkspace();
  const [active, setActive] = useState<SectionId>("context");
  const [confirmingPublish, setConfirmingPublish] = useState(false);

  if (!ready) return <p className="text-sm text-ink-soft">Opening editor…</p>;

  const ws = getSystem(slug);
  if (!ws) {
    return (
      <div>
        <p className="font-display text-xl font-extrabold">
          That system isn&apos;t in this device&apos;s workspace.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Drafts live locally in this phase. Start one from{" "}
          <Link href="/studio/systems" className="font-bold underline">
            your systems
          </Link>
          .
        </p>
      </div>
    );
  }

  const update = (fn: (d: WorkspaceSystem) => void) => updateSystem(slug, fn);
  const progress = sectionProgress(ws);
  const doneCount = progress.filter((p) => p.done).length;

  function publish() {
    if (!confirmingPublish) {
      setConfirmingPublish(true);
      setTimeout(() => setConfirmingPublish(false), 4000);
      return;
    }
    publishSystem(slug);
    setConfirmingPublish(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-72">
          <Link
            href="/studio/systems"
            className="text-xs font-bold text-ink-soft hover:text-sage-deep"
          >
            ← All systems
          </Link>
          <input
            aria-label="System title"
            value={ws.system.title}
            onChange={(e) => update((d) => void (d.system.title = e.target.value))}
            className="mt-1 block w-full bg-transparent font-display text-2xl font-extrabold text-ink outline-none placeholder:text-ink-soft/40 focus:border-b-2 focus:border-sage"
            placeholder="Untitled system"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge ws={ws} />
          <Link
            href={`/studio/systems/${slug}/preview`}
            className="rounded-full border border-ink/30 px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:border-sage hover:text-sage-deep"
          >
            {copy.buttons.preview}
          </Link>
          <button
            type="button"
            onClick={publish}
            disabled={ws.status === "published" && !ws.hasLocalEdits}
            className="rounded-full border-2 border-ink bg-sage px-5 py-2 text-sm font-extrabold text-cream transition-colors hover:bg-sage-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmingPublish
              ? fmt(copy.buttons.confirmPublish, {
                  version:
                    ws.status === "published"
                      ? ws.system.version + 1
                      : ws.system.version,
                })
              : ws.status === "draft"
                ? copy.buttons.publish
                : ws.hasLocalEdits
                  ? copy.buttons.publishUpdate
                  : copy.buttons.published}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
        <p className="text-xs text-ink-soft">
          Publishing updates the record on this device — accounts &amp; sync are a
          later phase, and this build says so instead of pretending.
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[230px_1fr]">
        {/* Progress nav */}
        <nav
          aria-label="Editor sections"
          className="flex gap-2 overflow-x-auto md:sticky md:top-20 md:flex-col md:self-start"
        >
          <p className="hidden text-xs font-bold text-ink-soft md:block">
            {doneCount}/{progress.length} sections have content
          </p>
          {progress.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id as SectionId)}
              aria-current={active === s.id ? "true" : undefined}
              className={`shrink-0 rounded-xl border px-3.5 py-2 text-left text-sm font-bold transition-colors md:w-full ${
                active === s.id
                  ? "border-ink bg-paper shadow-[2px_2px_0_0_#221a14]"
                  : "border-ink/15 bg-cream text-ink-soft hover:border-sage hover:text-sage-deep"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={`inline-block size-2 rounded-full ${
                    s.done ? "bg-sage" : "border border-ink/30"
                  }`}
                />
                {s.label}
              </span>
              <span className="mt-0.5 hidden text-[11px] font-normal text-ink-soft md:block">
                {s.hint}
              </span>
            </button>
          ))}
        </nav>

        {/* Active section */}
        <div className="min-w-0 space-y-5">
          <CaptureInbox ws={ws} update={update} />
          {active === "context" && <ContextSection ws={ws} update={update} />}
          {active === "promise" && <PromiseSection ws={ws} update={update} />}
          {active === "story" && <StorySection ws={ws} update={update} />}
          {active === "lists" && <ListsSection ws={ws} update={update} />}
          {active === "routines" && <RoutinesSection ws={ws} update={update} />}
          {active === "trust" && (
            <>
              <TrustSection ws={ws} update={update} />
              <LanguagePanel ws={ws} update={update} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
