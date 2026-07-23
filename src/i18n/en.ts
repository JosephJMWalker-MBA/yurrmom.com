/**
 * English interface copy (Phase 3) — the first locale dictionary.
 *
 * Scope: the REPEATED application chrome (navigation, footer, disclosures,
 * Studio nav, common buttons, statuses, form helpers). Page-specific
 * editorial copy stays in its page for now — externalizing everything at
 * once would be churn without benefit. Adding a language = adding a sibling
 * dictionary that satisfies `UICopy` (src/i18n/index.ts); nothing else moves.
 *
 * Interpolation uses {name} placeholders resolved by `fmt()` — no library.
 */
export const en = {
  meta: {
    locale: "en-US",
    siteName: "yurrmom.com",
  },

  nav: {
    findHelp: "Find Help",
    creators: "Creators",
    roast: "Roast",
    shop: "Shop",
    studio: "Studio",
    skipToContent: "Skip to content",
    mainNavLabel: "Main",
  },

  footer: {
    mission:
      "We preserve and distribute practical household knowledge, so families can start from proven experience instead of from zero. Humor gets you in the door. The systems are why you stay.",
    siteHeading: "The site",
    aboutMission: "About & mission",
    theRoast: "The Roast",
    promisesHeading: "The promises",
    promiseEarnings: "Creators keep 100% of their affiliate earnings.",
    promisePortable: "Lists stay portable — no retailer owns them.",
    promiseFictional: "Roast subjects are fictional. Always.",
    promiseMerch: "yurrmom.com earns from its own merch, not from creators.",
    honestyHeading: "Honesty notes",
    honestyPreview: "This is a seeded preview build.",
    honestyLinks: "Retailer links open at the retailer — no cart sync yet.",
    honestyCheckout: "Shop checkout opens when fulfillment is truly connected.",
    honestyNoPretending: "Nothing here pretends to be integrated when it isn't.",
    affiliateDisclosure:
      "Affiliate disclosure: creator pages may contain the creator's own affiliate links, marked where they appear. Purchases through them may earn that creator a commission. yurrmom.com takes 0% of creator affiliate earnings.",
  },

  studio: {
    name: "Studio",
    navLabel: "Studio",
    overview: "Overview",
    systems: "Systems",
    capture: "Capture",
    intelligence: "Evidence",
    editingAs: "Editing as {name} · seeded identity",
    identityTitle: "Seeded demo identity — real accounts arrive in a later phase",
  },

  intelligence: {
    title: "Evidence Explorer",
    tagline:
      "Deterministic retrieval over source-backed household knowledge. This returns evidence with provenance — not an answer, and not a chatbot.",
    queryLabel: "What are you looking for?",
    queryHint: "Plain words. Retrieval matches source-backed segments; it never writes new claims.",
    localeLabel: "Requested language",
    modeLabel: "Retrieval mode",
    modePublicSafe: "Public-safe",
    modeEditorial: "Editorial inspection",
    modePublicSafeHint:
      "Serves originals and current creator-approved translations only. Drafts and stale translations are withheld.",
    modeEditorialHint:
      "May surface machine/human drafts and stale translations — always with full status and caution.",
    riskLabel: "Guidance-risk category",
    riskHint:
      "You set this — it is never inferred. High-stakes categories require authoritative support before evidence is called sufficient.",
    domainLabel: "Household domain (optional)",
    constraintLabel: "Constraint (optional)",
    skillLabel: "Task or skill (optional)",
    circumstanceLabel: "Household circumstance (optional)",
    devStageLabel: "Developmental stage (optional)",
    run: "Run retrieval",
    presetsLabel: "Seeded evaluation cases",
    noHits: "No source-backed material matched this query.",
    coverageHeading: "Coverage",
    warningsHeading: "Warnings",
    limitationsHeading: "Stated limitations (from matched sources)",
    localeHeading: "Language & translation",
    sourceMixHeading: "Source mix",
    reasonsHeading: "Why it matched",
    packetNote:
      "This is an evidence packet. It contains ranked source excerpts and provenance — no synthesized advice.",
    viewPublic: "View public source ↗",
    viewStudio: "Open in Studio ↗",
  },

  buttons: {
    edit: "Edit",
    preview: "Preview",
    publish: "Publish",
    publishUpdate: "Publish update",
    published: "Published",
    confirmPublish: "Confirm publish v{version}?",
    print: "Print",
    copy: "Copy",
    copied: "Copied ✓",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    remove: "Remove",
    add: "Add",
    save: "Save",
    backToEditor: "← Back to editor",
  },

  status: {
    draft: "Draft",
    publishedV: "Published v{version}",
    publishedUnpublishedEdits: "Published · unpublished edits",
    saving: "Saving…",
    savedOnDevice: "Saved on this device · {time}",
    autosaveIdle: "Changes save to this device automatically",
    pending: "pending",
  },

  forms: {
    optionalSuffix: "(optional)",
    requiredNeedMissing: "Give this item a need before saving the list.",
    charCount: "{count}/{max}",
  },

  language: {
    sourceLanguageLabel: "Source language",
    sourceLanguageHint:
      "The language you write this system in. Readers and future translations always know which words are originally yours.",
    regionLabel: "Region (optional)",
    measurementLabel: "Measurements used",
    measurementUs: "US customary (cups, °F)",
    measurementMetric: "Metric (grams, °C)",
    measurementMixed: "Mixed",
    culturalContextLabel: "Anything culture- or region-specific here?",
    culturalContextHint:
      "Things a reader elsewhere should know — labeling laws, store types, climate assumptions. Future translators start from this note.",
    originalBadge: "This is the original — written by you in {language}.",
    translationsHeading: "Translations",
    translationsNotConnected:
      "Translations not yet connected — no provider is wired up, and no button here pretends otherwise. Existing translation records are shown with full provenance.",
    writtenIn: "Written in {language}",
    machineDraftPublicNote:
      "A {language} machine-draft translation exists — not reviewed or approved by the creator. The original above is the authoritative version.",
    staleNote:
      "Made from v{sourceVersion}; the original is now v{currentVersion}. This translation needs re-review.",
    currentNote: "Made from v{sourceVersion} — current.",
  },
} as const;
