/**
 * PRODUCTION reference registry (Phase 5).
 *
 * PRODUCTION SEED POLICY (assignment §16): this file contains NO fabricated
 * authoritative guidance. It holds exactly one clearly-labeled, platform-
 * INTERNAL documentation source whose authority assessment is deliberately
 * `unassessed` — it can never satisfy a high-stakes authoritative-support
 * requirement. Its purpose is to give the Reference Desk a real, honest,
 * non-authoritative example and to prove the empty-authority default: the
 * developmental query "what chores are appropriate for a four-year-old?"
 * stays `authoritative-support-required` until a legitimate reviewed source is
 * actually entered by an editor.
 *
 * Synthetic authoritative sources live ONLY under tests/fixtures — never here.
 */
import { contentHash } from "@/domain/reference";
import type { ReferenceRegistry } from "@/domain/reference";

const SOURCE_TEXT =
  "yurrmom.com presents lived household experience as experience, and labels it as such. It does not present household systems as medical, legal, nutritional, educational, or developmental authority. Authoritative support only enters an evidence packet through a reviewed, scoped, and approved curated reference.";

const versionId = "src:yurrmom-com:platform-knowledge-policy@v1";

export const productionReferenceRegistry: ReferenceRegistry = {
  origin: "production-seed",
  publishers: [
    {
      id: "pub:yurrmom-com",
      name: "yurrmom.com (platform-internal)",
      organizationType: "platform-internal",
      canonicalWebsite: "https://yurrmom.com",
      locale: "en",
      jurisdiction: "US",
      notes:
        "Platform-internal documentation. Being the platform does NOT grant authority — this publisher's material cannot satisfy high-stakes authoritative coverage.",
    },
  ],
  sources: [
    {
      id: "src:yurrmom-com:platform-knowledge-policy",
      title: "Platform Knowledge & Authority Policy",
      publisherId: "pub:yurrmom-com",
      canonicalUrl: "https://yurrmom.com/about",
      category: "platform-documentation",
      subjectDomains: ["platform policy"],
      intendedAudience: "Editors and reviewers",
      locale: "en",
      jurisdictions: ["US"],
      usageNotes: "Internal platform text; freely usable within the platform.",
      status: "active",
    },
  ],
  versions: [
    {
      id: versionId,
      sourceId: "src:yurrmom-com:platform-knowledge-policy",
      ordinal: 1,
      versionLabel: "2026 edition",
      publicationDate: "2026-01-01",
      effectiveDate: "2026-01-01",
      enteredDate: "2026-07-23T00:00:00.000Z",
      reviewDueDate: "2027-01-01",
      contentHash: contentHash(SOURCE_TEXT),
      status: "active",
      sourceText: SOURCE_TEXT,
    },
  ],
  spans: [
    {
      id: `${versionId}#span:${contentHash(SOURCE_TEXT)}`,
      referenceVersionId: versionId,
      exactText: SOURCE_TEXT,
      textHash: contentHash(SOURCE_TEXT),
      sectionPath: "Authority policy",
      locator: { sectionHeading: "Authority policy", paragraphIndex: 0 },
      locale: "en",
      createdAt: "2026-07-23T00:00:00.000Z",
    },
  ],
  claims: [
    {
      id: "claim:yurrmom-editorial:platform-policy",
      statement:
        "yurrmom.com labels lived household experience as experience and does not present it as medical, legal, nutritional, educational, or developmental authority.",
      claimType: "descriptive",
      interpretationLevel: "direct-statement",
      locale: "en",
      riskCategories: ["ordinary-household"],
      subjectDomains: ["platform policy"],
      intendedAudience: "Editors and reviewers",
      householdCircumstances: [],
      constraints: [],
      jurisdiction: "US",
      applicabilityScope: "scoped",
      applicability: "Describes platform behavior only.",
      exclusions: [
        "Not medical, legal, nutritional, educational, or developmental guidance.",
      ],
      limitations:
        "Platform-internal policy statement. Cannot satisfy authoritative support for any high-stakes question.",
      effectiveDate: "2026-01-01",
      reviewDueDate: "2027-01-01",
      status: "approved",
      version: 1,
      dependsOnVersionId: versionId,
      editorHandle: "editorial-desk",
      createdAt: "2026-07-23T00:00:00.000Z",
      updatedAt: "2026-07-23T00:00:00.000Z",
    },
  ],
  evidenceLinks: [
    {
      id: "lnk:platform-policy",
      claimId: "claim:yurrmom-editorial:platform-policy",
      evidenceSpanId: `${versionId}#span:${contentHash(SOURCE_TEXT)}`,
      relation: "supports",
      reviewerNote: "Statement paraphrases the platform's own policy text.",
      createdAt: "2026-07-23T00:00:00.000Z",
    },
  ],
  claimRelationships: [],
  assessments: [
    {
      id: "assess:platform-policy",
      sourceId: "src:yurrmom-com:platform-knowledge-policy",
      // DELIBERATELY unassessed: platform-internal docs are never authoritative
      // for user-facing high-stakes guidance.
      status: "unassessed",
      recognizedDomains: [],
      recognizedJurisdictions: [],
      supportedRiskCategories: [],
      intendedAudience: "Editors and reviewers",
      effectiveScope:
        "None for authoritative use — platform-internal documentation only.",
      limitations:
        "Publisher is platform-internal; it holds no external authority in any domain.",
      assessorHandle: "editorial-desk",
      assessmentDate: "2026-07-23T00:00:00.000Z",
      notes: "Intentionally never approved-for-scope. Demonstrates that publisher identity alone grants no authority.",
    },
  ],
};
