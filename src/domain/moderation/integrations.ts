/**
 * Integration capability overview (Phase 9) — read-only, honest, local-only.
 *
 * Capability truth is sourced from the actual adapters where one exists (the
 * distribution destination registry, the render feature status) rather than
 * duplicated as disconnected UI copy. NO secret is ever surfaced —
 * `credentialsConfigured` is a boolean only; keys, tokens, and values never
 * appear. Nothing here reports a capability the app does not actually have.
 */
import { DISTRIBUTION_DESTINATIONS } from "../distribution/destinations";
import type { IntegrationDescriptor } from "./types";

/** Boolean signals computed server-side (never the values themselves). */
export interface IntegrationSignals {
  /** From getRenderFeatureStatus(): OPENAI_API_KEY present. */
  modelCredentialsConfigured: boolean;
  /** From getRenderFeatureStatus(): renderer actually enabled + guarded. */
  modelEnabled: boolean;
  /** Human-safe provider/model names (never secrets). */
  modelProvider: string;
  modelReason?: string;
  now?: string;
}

export function describeIntegrations(signals: IntegrationSignals): IntegrationDescriptor[] {
  const now = signals.now;

  // Distribution destinations: fold the adapter registry into one honest row.
  const anyPublishable = DISTRIBUTION_DESTINATIONS.some((d) => d.capability === "connected-publishable");
  const distribution: IntegrationDescriptor = {
    id: "distribution-destinations",
    label: "Distribution destinations",
    domain: "Content Studio → social/email",
    capability: anyPublishable ? "connected-publishable" : "export-only",
    implementationType: "adapter-stub",
    environment: "local-device",
    userFacingBehavior:
      "Manual copy and file export work. TikTok/Instagram/Pinterest/newsletter are planned — nothing posts externally.",
    missingRequirements: ["Provider APIs", "OAuth", "Scheduling — all deferred"],
    lastCheckedAt: now,
    credentialsConfigured: false,
    productionAllowed: false,
  };

  return [
    {
      id: "retailer-links",
      label: "Retailer links",
      domain: "Commerce",
      capability: "link-only",
      implementationType: "manual",
      environment: "local-device",
      userFacingBehavior: "Offers open at the retailer in a new tab. No cart sync; affiliate URLs are never rewritten.",
      missingRequirements: ["Retailer/cart APIs (deferred)"],
      lastCheckedAt: now,
      credentialsConfigured: false,
      productionAllowed: true,
    },
    distribution,
    {
      id: "model-renderer",
      label: "Model-assisted answer renderer",
      domain: "Intelligence",
      capability: signals.modelEnabled ? "connected-export-only" : "unavailable",
      implementationType: signals.modelEnabled ? "live-guarded" : "adapter-stub",
      environment: "server-guarded",
      userFacingBehavior: signals.modelEnabled
        ? `Composition-only, server-guarded (${signals.modelProvider}). Never writes trusted claims.`
        : `Deterministic fallback only. ${signals.modelReason ?? "Not enabled."}`,
      missingRequirements: signals.modelEnabled ? [] : ["Enable flag + credentials (guarded, non-production)"],
      lastCheckedAt: now,
      credentialsConfigured: signals.modelCredentialsConfigured,
      productionAllowed: false,
    },
    {
      id: "translation",
      label: "Translation provider",
      domain: "Localization",
      capability: "planned",
      implementationType: "none",
      environment: "local-device",
      userFacingBehavior: "No live translation. Machine drafts are seeded demo data and clearly labeled.",
      missingRequirements: ["Provider integration", "Human review workflow"],
      lastCheckedAt: now,
      credentialsConfigured: false,
      productionAllowed: false,
    },
    {
      id: "reference-ingestion",
      label: "Reference ingestion",
      domain: "Knowledge",
      capability: "manual-copy",
      implementationType: "manual",
      environment: "local-device",
      userFacingBehavior: "Manual entry / local import only. No web fetching, scraping, or PDF parsing.",
      missingRequirements: ["Ingestion pipeline (deferred)"],
      lastCheckedAt: now,
      credentialsConfigured: false,
      productionAllowed: false,
    },
    {
      id: "fulfillment",
      label: "Printful / fulfillment",
      domain: "Merch",
      capability: "planned",
      implementationType: "none",
      environment: "local-device",
      userFacingBehavior: "Shop is a catalog preview. Checkout opens only when fulfillment is truly connected.",
      missingRequirements: ["Printful API", "Order pipeline"],
      lastCheckedAt: now,
      credentialsConfigured: false,
      productionAllowed: false,
    },
    {
      id: "payment",
      label: "Payment processing",
      domain: "Commerce",
      capability: "unavailable",
      implementationType: "none",
      environment: "local-device",
      userFacingBehavior: "No payment processing exists. No money moves anywhere in this prototype.",
      missingRequirements: ["Payment provider", "PCI scope", "Production auth"],
      lastCheckedAt: now,
      credentialsConfigured: false,
      productionAllowed: false,
    },
    {
      id: "authentication",
      label: "Authentication",
      domain: "Platform",
      capability: "unavailable",
      implementationType: "none",
      environment: "local-device",
      userFacingBehavior: "Identities are seeded prototype labels. There is no login, account, or role system.",
      missingRequirements: ["Auth vendor", "Account model", "Roles/permissions"],
      lastCheckedAt: now,
      credentialsConfigured: false,
      productionAllowed: false,
    },
    {
      id: "media-storage",
      label: "Media storage",
      domain: "Platform",
      capability: "unavailable",
      implementationType: "local-only",
      environment: "local-device",
      userFacingBehavior: "Illustrations are inline SVG. No uploads, no object storage, no CDN.",
      missingRequirements: ["Object storage", "Upload pipeline"],
      lastCheckedAt: now,
      credentialsConfigured: false,
      productionAllowed: false,
    },
  ];
}
