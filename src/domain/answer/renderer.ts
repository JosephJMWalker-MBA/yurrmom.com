/**
 * Answer renderer boundary (Phase 6).
 *
 * The replaceable seam where a future renderer (or constrained model) turns an
 * AnswerPlan into prose. This phase ships ONLY a deterministic preview: no
 * model, no vendor SDK, no "Generate answer" action, no provider config. The
 * adapter accepts an AnswerPlan — NEVER a raw EvidencePacket — so a renderer
 * can only ever say what the plan permits.
 */
import type { AnswerPlan } from "./types";

export type RendererCapability =
  | "unavailable"
  | "deterministic-preview-only"
  | "external-model-not-connected"
  | "review-required"
  | "validated-output-available";

export interface RendererPreview {
  /** Structured, non-conversational preview blocks. */
  blocks: { heading: string; lines: string[] }[];
  /** A flat text rendering of the same content. */
  text: string;
}

export interface AnswerRendererAdapter {
  name: string;
  capability(plan: AnswerPlan): RendererCapability;
  publicNote: string;
  /** Deterministic preview. Refuses to render an invalid plan. */
  renderPreview(plan: AnswerPlan): { ok: true; preview: RendererPreview } | { ok: false; reason: string };
}

export class DeterministicPreviewRenderer implements AnswerRendererAdapter {
  name = "Deterministic plan preview";
  publicNote =
    "A structured, non-conversational preview of exactly what the plan permits. No model is connected, and no free-form answer is generated. A future model would receive this plan as a hard constraint — never a raw evidence packet.";

  capability(plan: AnswerPlan): RendererCapability {
    if (!plan.validation.valid) return "review-required";
    return "deterministic-preview-only";
  }

  renderPreview(plan: AnswerPlan) {
    if (!plan.validation.valid) {
      return { ok: false as const, reason: "Plan failed validation; nothing is rendered." };
    }
    const blocks: RendererPreview["blocks"] = [];

    blocks.push({
      heading: "Disposition",
      lines: [`${plan.disposition}`, `Coverage: ${plan.coverage}`],
    });

    const authoritative = plan.authoritativePoints;
    if (authoritative.length > 0) {
      blocks.push({
        heading: "Authoritative guidance (reviewed, in scope)",
        lines: authoritative.map(
          (p) => `${p.proposition} ${cite(p.citationIds)}${p.applicability ? ` — ${p.applicability}` : ""}`,
        ),
      });
    }

    const experience = plan.livedExperienceExamples;
    if (experience.length > 0 && plan.escalation.householdExamplesAllowed) {
      blocks.push({
        heading: "Household experience (labeled as experience, not instruction)",
        lines: experience.map((p) => `${p.proposition} ${cite(p.citationIds)}`),
      });
    }

    if (plan.conflicts.length > 0) {
      blocks.push({ heading: "Unresolved conflicts (must be disclosed)", lines: plan.conflicts });
    }
    if (plan.missingEvidence.length > 0) {
      blocks.push({ heading: "Missing evidence", lines: plan.missingEvidence });
    }
    if (plan.limitations.length > 0) {
      blocks.push({ heading: "Mandatory qualifications", lines: plan.limitations });
    }
    if (plan.escalation.type !== "none") {
      blocks.push({
        heading: "Escalation directive",
        lines: [`Type: ${plan.escalation.type}`, plan.escalation.requiredWording],
      });
    }
    blocks.push({
      heading: "Prohibited assertions",
      lines: plan.prohibitedAssertions.map((p) => `• ${p.text}`),
    });
    blocks.push({
      heading: "Citations",
      lines: plan.citationMap.map(
        (c) => `[${c.label}] ${c.attribution} — “${truncate(c.exactExcerpt, 120)}” (${c.locale}; ${c.translationStatus})`,
      ),
    });

    const text = blocks
      .map((b) => `## ${b.heading}\n${b.lines.map((l) => `- ${l}`).join("\n")}`)
      .join("\n\n");

    return { ok: true as const, preview: { blocks, text } };
  }
}

function cite(labels: string[]): string {
  return labels.length ? labels.map((l) => `[${l}]`).join("") : "";
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export const answerRenderer: AnswerRendererAdapter = new DeterministicPreviewRenderer();
