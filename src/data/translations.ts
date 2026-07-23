import type { TranslationRecord } from "@/domain/translation";

/**
 * Seeded translation records (Phase 3 demonstration).
 *
 * One Spanish machine draft of the celiac system, honestly labeled: it was
 * authored as demo data in the style of machine output, no provider produced
 * it, and nothing anywhere presents it as Maya's own words or as reviewed.
 * Its `sourceVersion` (4) matches the seed — when a reviewer publishes a
 * local update in the Studio (bumping to v5), this record's effective status
 * becomes stale, demonstrating source-version-linked staleness live.
 */
export const translationRecords: TranslationRecord[] = [
  {
    id: "tr-celiac-es-001",
    source: { type: "system", id: "celiac-safe-pantry-reset" },
    sourceLocale: "en",
    targetLocale: "es",
    status: "machine-draft",
    method: "machine",
    attribution:
      "Seeded demo machine draft — no translation provider is connected; authored as demonstration data",
    sourceVersion: 4,
    createdAt: "2026-06-20T09:00:00.000Z",
    updatedAt: "2026-06-20T09:00:00.000Z",
    reviewNotes:
      "Awaiting creator review. Do not surface as authoritative in any locale.",
    cautionNotes: [
      "Machine draft — Maya has not reviewed or approved this text.",
      "The source assumes US labeling law (FDA rules, GFCO marks). Spanish-speaking regions certify gluten-free food differently (e.g. ELS 'espiga barrada' in Spain/EU, local norms in Latin America) — the label-check routine must be re-taught locally, not just translated.",
      "Measurements remain US-customary in this draft; a reviewed translation should convert to metric.",
    ],
    content: {
      title: "El reinicio de la despensa segura para celíacos",
      promise:
        "Reorganiza una cocina compartida para que la persona sin gluten esté segura por defecto — en un fin de semana, sin un segundo refrigerador.",
      problem:
        "Después de un diagnóstico de celiaquía, la mayoría de las familias intentan tener cuidado en todo, todo el tiempo. La vigilancia no escala — los sistemas sí. Este reinicio traslada la seguridad de la memoria de todos a la disposición física de la cocina.",
      audience:
        "Familias que adaptan una cocina compartida a un diagnóstico de celiaquía — especialmente con niños en edad escolar que necesitan alimentarse de forma segura por sí mismos.",
      limitations:
        "Este es un sistema contra la contaminación cruzada por celiaquía, no un protocolo de alergias ni FODMAP. Supone una cocina controlada por la familia y niños en edad escolar. No somos médicos: consulta las dudas médicas con tu equipo de gastroenterología.",
      storySections: [
        {
          heading: "Qué pasó",
          body: "A mi hija le diagnosticaron celiaquía a los siete años. El gastroenterólogo nos entregó un folleto y dijo: 'sin gluten, y cuidado con la contaminación cruzada'. Esa segunda cláusula es toda la guerra. El polvo de harina flota. Los tostadores mienten. Una mantequilla compartida es la escena de un crimen.",
        },
      ],
    },
  },
];

export function getTranslationsForSystem(slug: string): TranslationRecord[] {
  return translationRecords.filter(
    (t) => t.source.type === "system" && t.source.id === slug,
  );
}
