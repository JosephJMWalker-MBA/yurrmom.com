/**
 * Adapter capability states for the public slice — the single honest source
 * of truth the UI reads. Per docs/00-non-negotiables.md §12 and docs/05:
 * nothing may imply a capability an adapter does not truly provide.
 */
import type { AdapterState } from "@/domain/types";

export interface AdapterStatus {
  name: string;
  state: AdapterState;
  /** Copy shown to users where the boundary is visible. */
  publicNote: string;
}

export const adapters = {
  retailerLinks: {
    name: "Retailer links",
    state: "link-only",
    publicNote: "Links open at the retailer. No cart sync — that's planned, not pretended.",
  },
  cartSync: {
    name: "Cart sync",
    state: "planned",
    publicNote: "Sending a list into a cart or delivery service is planned. It is not connected yet.",
  },
  listExport: {
    name: "List export",
    state: "export",
    publicNote: "Print, copy, and file export work right here on your device.",
  },
  socialPublishing: {
    name: "Social publishing",
    state: "planned",
    publicNote: "Creators copy and export today. Direct publishing is planned, not faked.",
  },
  printfulFulfillment: {
    name: "Printful fulfillment",
    state: "planned",
    publicNote: "The shop is a preview. Checkout opens when fulfillment is actually connected.",
  },
  translation: {
    name: "Translation",
    state: "planned",
    publicNote:
      "Translations are shown with full provenance when they exist. Nothing generates them yet — no provider is connected.",
  },
} as const satisfies Record<string, AdapterStatus>;

/** Human labels for badge rendering. */
export const stateLabels: Record<AdapterState, string> = {
  "connected-publishable": "Connected",
  "connected-export-only": "Export only",
  "manual-copy": "Manual copy",
  "link-only": "Opens at retailer",
  export: "Works on-device",
  planned: "Planned — not connected",
  unavailable: "Unavailable",
};
