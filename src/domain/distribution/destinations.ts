/**
 * Destination adapters (Phase 8) — honest capability states only.
 *
 * There is NO direct-publishing integration: no OAuth, no social/email API, no
 * scheduler. This registry describes, truthfully, what each destination can do
 * TODAY. The only working paths are manual copy and file export. Social and
 * email destinations are declared `planned` and can never report a fake
 * "connected" or "published" state. `canPublish` is always false here — the
 * type leaves room for a future real adapter, but none exists.
 */
import type { Channel, DestinationCapability, DestinationDescriptor } from "./types";

export const DISTRIBUTION_DESTINATIONS: DestinationDescriptor[] = [
  {
    id: "manual-copy",
    name: "Copy to clipboard",
    capability: "manual-copy",
    note: "Copy the asset text and paste it into the channel yourself. Nothing is sent from here.",
  },
  {
    id: "file-export",
    name: "Export file (Markdown / text / JSON)",
    capability: "export-only",
    note: "Download the asset with its provenance footer. You publish it manually; yurrmom.com does not post anything.",
  },
  {
    id: "tiktok",
    name: "TikTok",
    capability: "planned",
    note: "No direct posting. Export or copy, then upload in TikTok yourself. A real connection does not exist yet.",
  },
  {
    id: "instagram",
    name: "Instagram / Reels",
    capability: "planned",
    note: "No direct posting. Export or copy, then post in Instagram yourself. A real connection does not exist yet.",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    capability: "planned",
    note: "No direct posting. Export or copy, then create the Pin yourself. A real connection does not exist yet.",
  },
  {
    id: "newsletter",
    name: "Email / newsletter",
    capability: "planned",
    note: "No direct sending. Export or copy into your email tool yourself. A real connection does not exist yet.",
  },
];

/** Which destinations are meaningful for a given channel (plus the always-on manual paths). */
export function destinationsForChannel(channel: Channel): DestinationDescriptor[] {
  const channelMatch: Record<string, string[]> = {
    tiktok: ["tiktok"],
    reels: ["instagram"],
    shorts: ["tiktok"],
    instagram: ["instagram"],
    facebook: ["instagram"],
    pinterest: ["pinterest"],
    newsletter: ["newsletter"],
    blog: [],
  };
  const wanted = new Set(channelMatch[channel] ?? []);
  return DISTRIBUTION_DESTINATIONS.filter(
    (d) => d.capability === "manual-copy" || d.capability === "export-only" || wanted.has(d.id),
  );
}

/** A capability is "working" only if it moves bytes to the creator, never externally. */
export function isWorkingDestination(cap: DestinationCapability): boolean {
  return cap === "manual-copy" || cap === "export-only";
}

/**
 * There is no publishable destination in this build. This helper exists so UI
 * and tests can assert the boundary rather than assume it — it always returns
 * false, and any attempt to treat a destination as publishable is a bug.
 */
export function canPublish(_descriptor: DestinationDescriptor): boolean {
  return false;
}
