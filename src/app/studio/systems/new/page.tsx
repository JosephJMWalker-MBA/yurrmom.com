"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/ui/studio/use-workspace";
import { Field, PrimaryButton, Select, TextInput } from "@/ui/studio/fields";

const domains = [
  "Kitchen & food safety",
  "Laundry & clothing",
  "Groceries & pantry",
  "Nights & sleep",
  "Cleaning & reset",
  "School & backpacks",
  "Caregiving",
  "Budget & planning",
  "Something else",
];

/**
 * Create workflow — deliberately tiny. A title and (optionally) which part
 * of home life it belongs to; everything else happens in the editor.
 */
export default function NewSystemPage() {
  const router = useRouter();
  const { ready, createSystem } = useWorkspace();
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState(domains[0]);

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const slug = createSystem(title.trim(), domain);
    if (slug) router.push(`/studio/systems/${slug}/edit`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sage">
        New system
      </p>
      <h1 className="mt-1 font-display text-3xl font-extrabold">
        Name the method you actually run
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Not a blog title — the household method itself. &ldquo;The Sunday Freezer
        Rotation.&rdquo; &ldquo;The One-Bin School Morning.&rdquo; You can rename it later.
      </p>

      <form onSubmit={create} className="mt-6 space-y-4 rounded-2xl border border-ink/15 bg-paper p-5">
        <Field label="System title" htmlFor="new-title">
          <TextInput
            id="new-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The …"
            maxLength={80}
            autoFocus
          />
        </Field>
        <Field
          label="What part of home life is this?"
          hint="Helps visitors find it by situation. Changeable later."
          htmlFor="new-domain"
        >
          <Select
            id="new-domain"
            value={domain}
            onChange={setDomain}
            options={domains.map((d) => ({ value: d, label: d }))}
          />
        </Field>
        <p className="text-xs text-ink-soft">
          Your household context comes in from your profile as a starting point —
          you&apos;ll adjust it in the editor. The new system starts as a{" "}
          <span className="font-bold">draft on this device</span>.
        </p>
        <PrimaryButton type="submit" disabled={!ready || !title.trim()}>
          Create draft →
        </PrimaryButton>
      </form>
    </div>
  );
}
