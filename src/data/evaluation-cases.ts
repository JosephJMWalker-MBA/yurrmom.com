import type { KnowledgeQuery } from "@/domain/knowledge";

/**
 * Seeded evaluation cases (Phase 4). Repeatable fixtures the Evidence Explorer
 * offers as one-click presets and the committed tests assert against. Each
 * documents an EXPECTATION in prose; the tests encode the machine-checkable
 * form. None of these fabricate authoritative sources — case 3 is expected to
 * demonstrate honest insufficiency.
 */
export interface EvaluationCase {
  id: string;
  title: string;
  expectation: string;
  query: KnowledgeQuery;
}

export const evaluationCases: EvaluationCase[] = [
  {
    id: "celiac-shared-kitchen",
    title: "Celiac shared-kitchen retrieval",
    expectation:
      "The celiac pantry system ranks first; reasons cite label/kitchen tokens and its constraints.",
    query: {
      text: "shared kitchen celiac label checks",
      requestedLocale: "en",
      representationPolicy: "public-safe",
      guidanceRisk: "ordinary-household",
    },
  },
  {
    id: "family-laundry",
    title: "Family laundry retrieval",
    expectation:
      "The family-of-six laundry system ranks first on laundry/washer/kid signals.",
    query: {
      text: "kids help with laundry one washer",
      requestedLocale: "en",
      representationPolicy: "public-safe",
      guidanceRisk: "ordinary-household",
    },
  },
  {
    id: "developmental-insufficiency",
    title: "Developmental guidance insufficiency",
    expectation:
      "Guidance risk is developmental; lived experience may appear but the packet reports authoritative-support-required because no authoritative source exists.",
    query: {
      text: "what chores are appropriate for a four-year-old?",
      requestedLocale: "en",
      developmentalStage: "four-year-old",
      guidanceRisk: "developmental",
      representationPolicy: "public-safe",
    },
  },
  {
    id: "translation-public-safe",
    title: "Translation policy — public-safe (Spanish)",
    expectation:
      "Requesting Spanish in public-safe mode must NOT serve the stale/unapproved machine draft as primary; the original English remains authoritative.",
    query: {
      text: "celiac shared kitchen",
      requestedLocale: "es",
      systemScope: "celiac-safe-pantry-reset",
      representationPolicy: "public-safe",
      guidanceRisk: "ordinary-household",
    },
  },
  {
    id: "translation-editorial",
    title: "Translation policy — editorial inspection (Spanish)",
    expectation:
      "Editorial-inspection mode may surface the Spanish machine draft, but always with status, attribution, and caution notes.",
    query: {
      text: "celiac shared kitchen",
      requestedLocale: "es",
      systemScope: "celiac-safe-pantry-reset",
      representationPolicy: "editorial-inspection",
      guidanceRisk: "ordinary-household",
    },
  },
];

export function getEvaluationCase(id: string): EvaluationCase | undefined {
  return evaluationCases.find((c) => c.id === id);
}
