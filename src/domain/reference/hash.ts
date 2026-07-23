/**
 * Deterministic content hashing (Phase 5) — dependency-free.
 *
 * Used to fingerprint immutable source text and evidence spans so a later
 * edit that changes the bytes is detectable. FNV-1a (32-bit) rendered as
 * 8 hex chars: not cryptographic, but stable, fast, and zero-dependency —
 * enough to prove "this exact text was cited". No external SDK is introduced.
 */
export function contentHash(text: string): string {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    // 32-bit FNV prime multiply via shifts, kept in unsigned range
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
