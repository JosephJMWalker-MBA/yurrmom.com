/**
 * Curated Reference Registry (Phase 5) — barrel.
 *
 * Publisher → Source → immutable Version → EvidenceSpan, editorial
 * CuratedClaims linked to exact evidence, scoped AuthorityAssessments, a
 * manual review workflow, and projection into curated-claim KnowledgeUnits.
 * See docs/10-curated-reference-contract.md.
 */
export * from "./types";
export * from "./hash";
export * from "./registry";
export * from "./review";
export * from "./versioning";
export * from "./projection";
