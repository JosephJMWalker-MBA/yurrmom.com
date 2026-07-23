/**
 * Live-renderer configuration (Phase 7) — SERVER ONLY.
 *
 * Reads environment variables. Never imported by a "use client" module. The
 * live renderer is enabled only in local development, only when explicitly
 * turned on, only for a configured provider with a present API key AND an
 * explicitly selected model. There is NO default model, and the route is
 * disabled in production regardless of other settings.
 */
import type { ProviderConfiguration } from "@/domain/answer";

export interface RenderFeatureStatus {
  enabled: boolean;
  localOnly: true;
  provider: string; // "none" | "openai"
  model: string; // configured model string, safe to display ("" if unset)
  credentialsPresent: boolean;
  /** Why the live renderer is off, when it is. Safe for display. */
  reason?: string;
}

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Compute feature status without exposing the API key. `model` is the
 * configured model string (a name, not a secret) and is safe to display.
 */
export function getRenderFeatureStatus(): RenderFeatureStatus {
  const provider = env("ANSWER_RENDERER_PROVIDER") || "none";
  const model = env("OPENAI_MODEL");
  const credentialsPresent = env("OPENAI_API_KEY").length > 0;
  const enabledFlag = env("ANSWER_RENDERER_ENABLED") === "true";

  const base: RenderFeatureStatus = {
    enabled: false,
    localOnly: true,
    provider,
    model,
    credentialsPresent,
  };

  if (isProduction()) return { ...base, reason: "Disabled in production." };
  if (!enabledFlag) return { ...base, reason: "ANSWER_RENDERER_ENABLED is not true." };
  if (provider !== "openai") return { ...base, reason: `Provider "${provider}" is not a live provider.` };
  if (!credentialsPresent) return { ...base, reason: "OPENAI_API_KEY is not set." };
  if (!model) return { ...base, reason: "OPENAI_MODEL is not set (no default is assumed)." };

  return { ...base, enabled: true };
}

/** Provider configuration surfaced to the domain provider interface. */
export function toProviderConfiguration(status: RenderFeatureStatus): ProviderConfiguration {
  return {
    provider: status.provider,
    model: status.model,
    credentialsPresent: status.credentialsPresent,
    enabled: status.enabled,
    localOnly: true,
  };
}

/** Bounds — kept here so the route and provider agree. */
export const RENDER_LIMITS = {
  requestBodyBytes: 8 * 1024,
  providerTimeoutMs: 20_000,
  maxOutputTokens: 700,
};
