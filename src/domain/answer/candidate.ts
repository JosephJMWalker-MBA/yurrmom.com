/**
 * CompositionCandidate (Phase 7) — the model's structured PRESENTATION choice.
 *
 * It is NOT trusted prose. It carries only IDs (styles, templates, ordered
 * point IDs) plus a refusal flag. It supplies no propositions, citations,
 * warnings, qualifications, escalation wording, attribution, URLs, markdown,
 * HTML, or JavaScript — all of that is inserted by the deterministic compiler
 * from the trusted AnswerPlan.
 */
import { fingerprint } from "./fingerprint";
import type { RenderContract } from "./render-contract";

export const COMPOSITION_CANDIDATE_SCHEMA = "composition-candidate/1";

export interface CandidateSection {
  sectionTemplateId: string;
  orderedPointIds: string[];
}

export interface CompositionCandidate {
  schemaVersion: string;
  planId: string;
  planFingerprint: string;
  styleId: string;
  titleTemplateId: string;
  introTemplateId: string;
  sections: CandidateSection[];
  conclusionTemplateId: string;
  citationStyleId: string;
  refusal: boolean;
  refusalReason?: string;
}

export function fingerprintCandidate(candidate: CompositionCandidate): string {
  return fingerprint({
    schemaVersion: candidate.schemaVersion,
    planId: candidate.planId,
    planFingerprint: candidate.planFingerprint,
    styleId: candidate.styleId,
    titleTemplateId: candidate.titleTemplateId,
    introTemplateId: candidate.introTemplateId,
    sections: candidate.sections.map((s) => ({
      sectionTemplateId: s.sectionTemplateId,
      orderedPointIds: s.orderedPointIds,
    })),
    conclusionTemplateId: candidate.conclusionTemplateId,
    citationStyleId: candidate.citationStyleId,
    refusal: candidate.refusal,
  });
}

/**
 * Strict JSON Schema for OpenAI Structured Outputs. Point IDs and template IDs
 * are constrained to the current contract's actual values via enums, so a
 * schema-valid candidate cannot even name a point that isn't in the plan.
 * (Schema validates SHAPE, never epistemic correctness — deterministic
 * validation still runs afterward.)
 */
export function buildCandidateJsonSchema(contract: RenderContract): Record<string, unknown> {
  const pointIds = contract.permittedPoints.map((p) => p.id);
  const strEnum = (values: string[]) => ({ type: "string", enum: values });

  return {
    type: "object",
    additionalProperties: false,
    required: [
      "schemaVersion",
      "planId",
      "planFingerprint",
      "styleId",
      "titleTemplateId",
      "introTemplateId",
      "sections",
      "conclusionTemplateId",
      "citationStyleId",
      "refusal",
    ],
    properties: {
      schemaVersion: { type: "string", enum: [COMPOSITION_CANDIDATE_SCHEMA] },
      planId: { type: "string", enum: [contract.planId] },
      planFingerprint: { type: "string", enum: [contract.planFingerprint] },
      styleId: strEnum(contract.allowedStyleIds),
      titleTemplateId: strEnum(contract.allowedTitleTemplateIds),
      introTemplateId: strEnum(contract.allowedIntroTemplateIds),
      sections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["sectionTemplateId", "orderedPointIds"],
          properties: {
            sectionTemplateId: strEnum(contract.allowedSectionTemplateIds),
            orderedPointIds: {
              type: "array",
              items: pointIds.length > 0 ? strEnum(pointIds) : { type: "string" },
            },
          },
        },
      },
      conclusionTemplateId: strEnum(contract.allowedConclusionTemplateIds),
      citationStyleId: strEnum(contract.allowedCitationStyleIds),
      refusal: { type: "boolean" },
      refusalReason: { type: "string" },
    },
  };
}
