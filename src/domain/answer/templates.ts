/**
 * Fixed presentation-template registry (Phase 7).
 *
 * A SMALL reviewed set of deterministic templates. The model chooses template
 * IDs; it never writes template text. Every template is a pure function over
 * TRUSTED AnswerPlan fields — no model output ever reaches these strings.
 *
 * Section templates are split into two kinds:
 *   - substantive: the model orders permitted points into them.
 *   - mandatory:   compiler-owned; content comes from trusted plan fields only
 *                  (limitations, conflicts, missing evidence, escalation, sources).
 */

export const STYLE_IDS = ["warm-clear", "plain-direct", "calm-editorial"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export const TITLE_TEMPLATE_IDS = [
  "question-focused",
  "household-exploration",
  "qualified-guidance",
  "insufficient-evidence",
  "professional-escalation",
  "conflicting-evidence",
] as const;
export type TitleTemplateId = (typeof TITLE_TEMPLATE_IDS)[number];

export const INTRO_TEMPLATE_IDS = [
  "direct-opening",
  "experience-framing",
  "scope-first",
  "abstention-first",
  "conflict-first",
] as const;
export type IntroTemplateId = (typeof INTRO_TEMPLATE_IDS)[number];

export const SECTION_TEMPLATE_IDS = [
  "what-the-household-does",
  "what-reviewed-guidance-supports",
  "important-limits",
  "what-is-missing",
  "where-sources-disagree",
  "next-safe-step",
  "sources",
] as const;
export type SectionTemplateId = (typeof SECTION_TEMPLATE_IDS)[number];

export const CONCLUSION_TEMPLATE_IDS = [
  "no-conclusion",
  "experience-not-universal",
  "scope-reminder",
  "professional-follow-up",
  "evidence-insufficient",
] as const;
export type ConclusionTemplateId = (typeof CONCLUSION_TEMPLATE_IDS)[number];

export const CITATION_STYLE_IDS = ["numeric-brackets", "numeric-list-only"] as const;
export type CitationStyleId = (typeof CITATION_STYLE_IDS)[number];

/** Section templates the model may fill with points. */
export const SUBSTANTIVE_SECTIONS: SectionTemplateId[] = [
  "what-the-household-does",
  "what-reviewed-guidance-supports",
];

/** Section templates whose content is inserted by the compiler from trusted fields. */
export const MANDATORY_SECTIONS: SectionTemplateId[] = [
  "important-limits",
  "what-is-missing",
  "where-sources-disagree",
  "next-safe-step",
  "sources",
];

/** Point roles each substantive section may contain. */
export const SECTION_ROLE_COMPATIBILITY: Record<string, string[]> = {
  "what-the-household-does": [
    "household-method",
    "creator-experience",
    "direct-response",
    "definition",
  ],
  "what-reviewed-guidance-supports": ["authoritative-guidance"],
};

/** Optional-point budget by communication depth (documented, deterministic). */
export const DEPTH_OPTIONAL_CAP: Record<string, number> = {
  brief: 2,
  standard: 4,
  detailed: 8,
};

/** Deterministic section headings — trusted text, never model-authored. */
export const SECTION_HEADING: Record<SectionTemplateId, string> = {
  "what-the-household-does": "What one household does",
  "what-reviewed-guidance-supports": "What reviewed guidance supports",
  "important-limits": "Important limits",
  "what-is-missing": "What is missing",
  "where-sources-disagree": "Where sources disagree",
  "next-safe-step": "A safe next step",
  sources: "Sources",
};

export const CONCLUSION_TEXT: Record<ConclusionTemplateId, string> = {
  "no-conclusion": "",
  "experience-not-universal":
    "This reflects one household's experience and is not a universal instruction.",
  "scope-reminder":
    "This information applies only within the stated scope, audience, and dates.",
  "professional-follow-up":
    "For a specific person or situation, follow up with a qualified professional.",
  "evidence-insufficient":
    "The available evidence is insufficient to answer this directly.",
};

export const isStyleId = (v: string): v is StyleId => (STYLE_IDS as readonly string[]).includes(v);
export const isTitleTemplateId = (v: string): v is TitleTemplateId =>
  (TITLE_TEMPLATE_IDS as readonly string[]).includes(v);
export const isIntroTemplateId = (v: string): v is IntroTemplateId =>
  (INTRO_TEMPLATE_IDS as readonly string[]).includes(v);
export const isSectionTemplateId = (v: string): v is SectionTemplateId =>
  (SECTION_TEMPLATE_IDS as readonly string[]).includes(v);
export const isConclusionTemplateId = (v: string): v is ConclusionTemplateId =>
  (CONCLUSION_TEMPLATE_IDS as readonly string[]).includes(v);
export const isCitationStyleId = (v: string): v is CitationStyleId =>
  (CITATION_STYLE_IDS as readonly string[]).includes(v);
