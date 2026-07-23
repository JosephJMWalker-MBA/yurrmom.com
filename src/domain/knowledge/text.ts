/**
 * Text normalization for deterministic retrieval (Phase 4).
 *
 * Pure, dependency-free, and stable: the same string always tokenizes the
 * same way, so retrieval ordering is reproducible. This is NOT linguistics —
 * it is a small, transparent normalizer chosen so ranking reasons stay
 * explainable to a human reviewer.
 */

/** Very small stopword set — enough to stop function words dominating overlap. */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "for", "in", "on", "with", "my",
  "is", "are", "i", "you", "it", "that", "this", "what", "how", "do", "does",
  "can", "should", "when", "which", "at", "as", "be", "we", "our", "your",
  "about", "into", "from", "by", "so", "if", "not", "no",
]);

/** Lowercase, strip punctuation to spaces, collapse whitespace. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Crude, deterministic singular fold: drop one trailing "s" on tokens of
 * length ≥ 4 ("checks"→"check", "kids"→"kid", "kitchens"→"kitchen"). Applied
 * to both query and index tokens so they meet in the middle. Intentionally
 * dumb — no real stemmer, no dependency.
 */
export function stem(token: string): string {
  return token.length >= 4 && token.endsWith("s") ? token.slice(0, -1) : token;
}

/** Normalize → split → drop stopwords → stem. */
export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(" ")
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
    .map(stem);
}

export function tokenSet(input: string): Set<string> {
  return new Set(tokenize(input));
}
