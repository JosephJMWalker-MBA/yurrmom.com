import type { IntegrationCapability, IntegrationDescriptor } from "@/domain/moderation";

const CAP_STYLE: Record<IntegrationCapability, string> = {
  "connected-publishable": "border-sage bg-sage-soft text-sage-deep",
  "connected-export-only": "border-sage bg-sage-soft text-sage-deep",
  "manual-copy": "border-mustard bg-mustard-soft text-ink",
  "link-only": "border-mustard bg-mustard-soft text-ink",
  "export-only": "border-mustard bg-mustard-soft text-ink",
  planned: "border-ink/25 bg-cream text-ink-soft",
  unavailable: "border-ink/20 bg-cream text-ink-soft",
};

/**
 * Read-only integration overview. Capability truth comes from the actual
 * adapters/env (see describeIntegrations). Never renders a secret — only a
 * `credentialsConfigured` boolean.
 */
export function IntegrationsAdmin({ integrations }: { integrations: IntegrationDescriptor[] }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Integration capability overview</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Every external boundary in the app, with its honest capability state. This is local-device only. No API keys, tokens, or credential
        values are shown — only whether credentials are configured, as a boolean.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/20 text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <th className="py-2 pr-3">Integration</th>
              <th className="py-2 pr-3">Capability</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Env</th>
              <th className="py-2 pr-3">Creds</th>
              <th className="py-2 pr-3">Prod</th>
            </tr>
          </thead>
          <tbody>
            {integrations.map((i) => (
              <tr key={i.id} className="border-b border-ink/10 align-top">
                <td className="py-2 pr-3">
                  <p className="font-bold text-ink">{i.label}</p>
                  <p className="text-[11px] text-ink-soft">{i.domain}</p>
                  <p className="mt-1 max-w-md text-[11px] text-ink-soft">{i.userFacingBehavior}</p>
                  {i.missingRequirements.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-ink-soft">Missing: {i.missingRequirements.join(", ")}</p>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${CAP_STYLE[i.capability]}`}>{i.capability}</span>
                </td>
                <td className="py-2 pr-3 text-[11px] text-ink-soft">{i.implementationType}</td>
                <td className="py-2 pr-3 text-[11px] text-ink-soft">{i.environment}</td>
                <td className="py-2 pr-3 text-[11px] font-bold">{i.credentialsConfigured ? "yes" : "no"}</td>
                <td className="py-2 pr-3 text-[11px] font-bold">{i.productionAllowed ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
