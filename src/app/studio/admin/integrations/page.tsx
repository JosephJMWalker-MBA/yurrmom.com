import type { Metadata } from "next";
import { describeIntegrations } from "@/domain/moderation";
import { getRenderFeatureStatus } from "@/server/render-config";
import { IntegrationsAdmin } from "@/ui/studio/admin/integrations-admin";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Honest, local-device capability overview of every adapter. No secrets shown.",
};

/**
 * Server component: reads the render feature status server-side (so credential
 * PRESENCE is a boolean, never a value) and folds the distribution registry in
 * via describeIntegrations. Nothing secret crosses to the client.
 */
export default function IntegrationsPage() {
  const render = getRenderFeatureStatus();
  const integrations = describeIntegrations({
    modelCredentialsConfigured: render.credentialsPresent,
    modelEnabled: render.enabled,
    modelProvider: render.provider,
    modelReason: render.reason,
    now: new Date().toISOString(),
  });
  return <IntegrationsAdmin integrations={integrations} />;
}
