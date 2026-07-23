"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/ui/studio/use-workspace";
import { StatusBadge } from "@/ui/studio/status";
import { SystemArticle } from "@/ui/system-article";
import { ListInteractive } from "@/ui/client/list-interactive";
import { getTranslationsForSystem } from "@/data";

/**
 * Public-page preview — rendered with the exact same components the public
 * route uses, fed from the local draft. What you see here IS what publishing
 * produces; preview cannot drift from reality.
 */
export default function PreviewSystemPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { ready, creator, getSystem } = useWorkspace();

  if (!ready) return <p className="text-sm text-ink-soft">Building preview…</p>;

  const ws = getSystem(slug);
  if (!ws || !creator) {
    return (
      <p className="text-sm text-ink-soft">
        Nothing to preview —{" "}
        <Link href="/studio/systems" className="font-bold underline">
          back to your systems
        </Link>
        .
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/15 bg-paper p-4">
        <div>
          <p className="font-display font-extrabold">
            Preview: exactly how the public page renders
          </p>
          <p className="text-xs text-ink-soft">
            Same components, same layout — fed from your local draft.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusBadge ws={ws} />
          <Link
            href={`/studio/systems/${slug}/edit`}
            className="rounded-full border-2 border-ink bg-paper px-4 py-2 text-sm font-bold transition-colors hover:bg-mustard"
          >
            ← Back to editor
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl rounded-3xl border-2 border-dashed border-ink/30 bg-cream px-4 py-10 sm:px-8">
        <SystemArticle
          system={ws.system}
          creator={creator}
          context={ws.context}
          lists={ws.lists}
          mode="preview"
          translations={getTranslationsForSystem(ws.system.slug)}
        />

        {/* List page previews — same interactive component as the live route */}
        {ws.lists.map((list) => (
          <section
            key={list.slug}
            id={`preview-list-${list.slug}`}
            aria-label={`List preview: ${list.title}`}
            className="mt-12 border-t-2 border-ink/20 pt-8"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sage">
              Portable list · public page preview
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold">
              {list.title || "Untitled list"}
            </h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{list.intro}</p>
            <div className="mt-5">
              <ListInteractive list={list} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
