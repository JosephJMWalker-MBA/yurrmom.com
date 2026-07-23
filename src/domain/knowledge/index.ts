/**
 * Knowledge retrieval layer (Phase 4) — barrel.
 *
 * Read-only projection of canonical household systems into source-backed
 * KnowledgeUnits, plus a deterministic retriever that returns an
 * EvidencePacket (evidence, not an answer). See
 * docs/09-knowledge-retrieval-contract.md.
 */
export * from "./text";
export * from "./unit";
export * from "./corpus";
export * from "./representation";
export * from "./query";
export * from "./retrieval";
