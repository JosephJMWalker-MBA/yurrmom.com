"use client";

import { useState } from "react";

/**
 * Calm creator-tool form primitives. Same brand, lower volume than the
 * public site (docs/03 visual direction: creator tools become calmer and
 * more structured without feeling disconnected).
 */

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-ink">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border border-ink/25 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-sage focus:outline focus:outline-2 focus:outline-sage/30";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={props.rows ?? 3}
      {...props}
      className={`${inputBase} leading-relaxed ${props.className ?? ""}`}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  id,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} cursor-pointer`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Comma/Enter chip entry for string[] fields — human, not ontology. */
export function ChipsInput({
  values,
  onChange,
  placeholder,
  id,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  id?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const parts = draft
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length) onChange([...values, ...parts]);
    setDraft("");
  }

  return (
    <div className="rounded-lg border border-ink/25 bg-paper px-2 py-1.5 focus-within:border-sage">
      <div className="flex flex-wrap items-center gap-1.5">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-xs font-semibold text-sage-deep"
          >
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              className="font-bold hover:text-tomato"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={values.length === 0 ? placeholder : "add more…"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Backspace" && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={commit}
          className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-ink-soft/50"
        />
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink/15 bg-paper p-5">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      {intro && <p className="mt-1 text-sm text-ink-soft">{intro}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function GhostButton({
  children,
  onClick,
  type = "button",
  danger = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  danger?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
        danger
          ? "border-tomato/40 text-tomato hover:bg-tomato hover:text-cream"
          : "border-ink/30 text-ink-soft hover:border-sage hover:text-sage-deep"
      }`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border-2 border-ink bg-sage px-5 py-2 text-sm font-extrabold text-cream transition-colors hover:bg-sage-deep disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
