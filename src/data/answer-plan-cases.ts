import type { AnswerRequest } from "@/domain/answer";

/**
 * Seeded AnswerPlan evaluation cases (Phase 6). These are PRODUCTION requests
 * over production data — none fabricate authoritative sources. Cases that
 * require eligible authority or conflict are exercised only in committed tests
 * with test-only fictional fixtures (see tests/answer-plan.test.ts).
 */
export interface AnswerPlanCase {
  id: string;
  title: string;
  expectation: string;
  request: AnswerRequest;
}

export const answerPlanCases: AnswerPlanCase[] = [
  {
    id: "laundry-exploration",
    title: "A · Ordinary household exploration (laundry)",
    expectation:
      "Family-of-six laundry ranks prominently; disposition allows household exploration; creator experience is labeled; no universal claim; limitations + context appear; citations point to actual system units.",
    request: {
      question: "How can kids help with laundry when a family has one washer?",
      requestedLocale: "en",
      representationPolicy: "public-safe",
      guidanceRisk: "ordinary-household",
      depth: "standard",
    },
  },
  {
    id: "celiac-medical",
    title: "B · Celiac shared kitchen (medical risk)",
    expectation:
      "Creator experience may show as experience; NO medical recommendation; disposition abstains/escalates (no eligible production authority); plan distinguishes household practice from authoritative medical guidance; lived-experience citations remain.",
    request: {
      question: "How does this family keep a shared kitchen safer for a child with celiac disease?",
      requestedLocale: "en",
      representationPolicy: "public-safe",
      guidanceRisk: "medical",
      systemScope: "celiac-safe-pantry-reset",
      depth: "standard",
    },
  },
  {
    id: "developmental-insufficiency",
    title: "C · Developmental insufficiency",
    expectation:
      "No prescriptive chore recommendation; authoritative support remains required; disposition abstains/escalates; missing evidence explicit; lived experience cannot fill the authority gap.",
    request: {
      question: "What chores are appropriate for a four-year-old?",
      requestedLocale: "en",
      developmentalStage: "four-year-old",
      householdDomain: "child development",
      jurisdiction: "US",
      representationPolicy: "public-safe",
      guidanceRisk: "developmental",
      depth: "standard",
    },
  },
  {
    id: "translation-public-safe",
    title: "F · Translation policy — Spanish public-safe (celiac)",
    expectation:
      "Stale machine translation not presented as approved; public-safe falls back to original English; locale + translation limitation mandatory; no equivalence implied.",
    request: {
      question: "How does this family keep a shared kitchen safer for celiac disease?",
      requestedLocale: "es",
      systemScope: "celiac-safe-pantry-reset",
      representationPolicy: "public-safe",
      guidanceRisk: "ordinary-household",
      depth: "standard",
    },
  },
];

export function getAnswerPlanCase(id: string): AnswerPlanCase | undefined {
  return answerPlanCases.find((c) => c.id === id);
}
