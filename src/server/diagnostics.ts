/**
 * Safe render diagnostics (Phase 7) — SERVER ONLY.
 *
 * Retains only non-sensitive fields and is not persisted. It NEVER logs API
 * keys, full prompts, full source text, complete model outputs, user-entered
 * household details, or provider response bodies. Development console output is
 * concise and redacted.
 */
export interface RenderDiagnostics {
  timestamp: string;
  provider: string;
  model: string;
  planFingerprint?: string;
  candidateFingerprint?: string;
  finalFingerprint?: string;
  status: string;
  latencyMs?: number;
  tokenUsage?: { input?: number; output?: number };
  requestId?: string;
  validationErrorCodes?: string[];
}

export function makeDiagnostics(d: Omit<RenderDiagnostics, "timestamp">): RenderDiagnostics {
  return { timestamp: new Date().toISOString(), ...d };
}

/** Concise, redacted dev log. No secrets, no bodies, no user details. */
export function logDiagnostics(d: RenderDiagnostics): void {
  if (process.env.NODE_ENV === "production") return;
  const parts = [
    `[render] ${d.status}`,
    `provider=${d.provider}`,
    `model=${d.model || "-"}`,
    d.latencyMs !== undefined ? `${d.latencyMs}ms` : "",
    d.planFingerprint ? `plan=${d.planFingerprint}` : "",
    d.finalFingerprint ? `final=${d.finalFingerprint}` : "",
    d.requestId ? `req=${d.requestId}` : "",
    d.validationErrorCodes?.length ? `errors=[${d.validationErrorCodes.join(",")}]` : "",
  ].filter(Boolean);
  // eslint-disable-next-line no-console
  console.info(parts.join(" "));
}
