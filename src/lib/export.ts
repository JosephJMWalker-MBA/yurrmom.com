import type { PortableList } from "@/domain/types";

/**
 * On-device list exports — the honest handoffs that always work
 * (docs/02 portable-list architecture; docs/05 REQUIRED NOW tier).
 */

export function listToPlainText(list: PortableList): string {
  const lines: string[] = [list.title.toUpperCase(), ""];
  for (const item of list.items) {
    lines.push(`[ ] ${item.need} — ${item.quantity} (${item.recurrence})`);
    if (item.preferred) lines.push(`    Preferred: ${item.preferred.name}`);
    for (const sub of item.substitutions) {
      lines.push(`    Sub OK: ${sub.name} — ${sub.note}`);
    }
    if (item.notes) lines.push(`    Note: ${item.notes}`);
  }
  lines.push("", "From yurrmom.com — a portable list. It works at any store.");
  return lines.join("\n");
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function listToCsv(list: PortableList): string {
  const header = ["Need", "Quantity", "Recurrence", "Preferred product", "Substitutions", "Notes"];
  const rows = list.items.map((item) =>
    [
      item.need,
      item.quantity,
      item.recurrence,
      item.preferred?.name ?? "",
      item.substitutions.map((s) => `${s.name} (${s.note})`).join("; "),
      item.notes ?? "",
    ].map(csvEscape).join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function listToJson(list: PortableList): string {
  // Full structured export — intent preserved, retailer-independent.
  return JSON.stringify(list, null, 2);
}

export function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
