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
    references: "References",
    content: "Content",
    admin: "Admin",
    editingAs: "Editing as {name} · seeded identity",
    identityTitle: "Seeded demo identity — real accounts arrive in a later phase",
  },

  content: {
    title: "Content Studio",
    tagline:
      "Turn a household system you already documented into channel-specific drafts — social posts, video scripts, pins, newsletter sections, blog drafts. The system stays canonical; every draft is a traceable derivative you edit and export yourself.",
    persistenceNote:
      "Drafts are saved to this device only and are never presented as published. Nothing here posts to any platform — export or copy, then publish yourself.",
    notPublishedBanner: "Content preview — not published",
    newAsset: "+ New content draft",
    empty: "No content drafts yet. Turn a system into a channel draft to begin.",
    reset: "Reset content drafts on this device",
    // create
    createTitle: "New content draft",
    createTagline:
      "Pick a system, a channel format, and exactly what to include. The draft is assembled from your canonical material with fixed framing — never invented, never a model.",
    sourceSystemLabel: "Source system",
    formatLabel: "Channel format",
    templateLabel: "Template",
    includeLabel: "What to include",
    internalNameLabel: "Internal name (optional)",
    createButton: "Create draft",
    localeNote:
      "Drafts are created in the system's original language. A machine-draft translation can be inspected elsewhere but can never be a publication source.",
    includePromise: "Promise",
    includeProblem: "Problem",
    includeContext: "Household context",
    includeStory: "Story: {heading}",
    includeRoutine: "Routine: {title}",
    includeRecipe: "Recipe: {title}",
    includeListItem: "List item: {need}",
    includeObserved: "Observed outcomes",
    includeLimitations: "Limitations",
    // editor
    backToOverview: "← All content drafts",
    blocksHeading: "Draft blocks",
    previewHeading: "Channel preview",
    validationHeading: "Validation",
    disclosuresHeading: "Required disclosures",
    provenanceHeading: "Provenance",
    exportHeading: "Export & destinations",
    valid: "Valid — ready to mark ready",
    invalid: "{count} issue(s) to resolve",
    markReady: "Mark ready",
    exportMarkdown: "Export Markdown",
    exportText: "Export text",
    exportJson: "Export JSON",
    copyText: "Copy to clipboard",
    copied: "Copied",
    sourceBacked: "Exact from system",
    edited: "Edited from source",
    templateText: "Template framing",
    required: "Required",
    remove: "Remove",
    staleHeading: "Source has changed",
    staleBody:
      "The canonical system moved past the version this draft was built from. Review it against the current system before exporting.",
    reviewStale: "I've reviewed against the current system",
    exportBlockedStale: "Exporting is blocked until you review the changed source.",
    destinationsNote:
      "There is no direct posting. These are the only working paths; social and email destinations are planned, not connected.",
  },

  references: {
    title: "Reference Desk",
    tagline:
      "Where legitimate reference material enters the corpus — scoped, cited, reviewed, and honestly labeled. Being published by a big name grants no authority; a reviewed, in-scope assessment does.",
    persistenceNote:
      "Editorial data is saved to this device only and is never presented as globally published. A backend replaces this seam later.",
    sourcesHeading: "Sources",
    publisherHeading: "Publisher",
    versionsHeading: "Versions (immutable)",
    spansHeading: "Evidence spans",
    claimsHeading: "Curated claims",
    assessmentHeading: "Authority assessment",
    reviewHeading: "Review checklist",
    eligibilityHeading: "Retrieval eligibility",
    addSource: "Add source",
    addVersion: "Add new version",
    addSpan: "Add evidence span",
    addClaim: "Draft a claim",
    linkEvidence: "Link evidence",
    runReview: "Run review checklist",
    approve: "Approve for platform use (within scope)",
    returnRevision: "Return for revision",
    supersede: "Supersede",
    withdraw: "Withdraw",
    checkEligibility: "Check authoritative eligibility",
    openExplorer: "Open in Evidence Explorer →",
    reset: "Reset editorial data on this device",
    approvedScopeNote:
      "“Approved” means approved for platform use within the recorded scope — not universal truth.",
    interpretationDirect: "Direct statement",
    interpretationParaphrase: "Faithful paraphrase",
    interpretationInference: "Editorial inference (labeled; cannot alone satisfy high-stakes)",
    ingestionNote:
      "Manual entry / local import only. No web fetching, scraping, or PDF parsing in this phase.",
    emptyAuthorityNote:
      "This registry contains no authoritative source. High-stakes queries stay “authoritative support required” until a reviewed, in-scope source is entered.",
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

  plan: {
    heading: "Answer Plan Inspector",
    intro:
      "A deterministic answer contract derived from the packet above — what a future renderer or model may say, how it must be qualified, and when it must abstain. Not a conversational answer.",
    build: "Build answer plan",
    depthLabel: "Communication depth",
    dispositionHeading: "Disposition",
    authoritativeHeading: "Authoritative guidance (reviewed, in scope)",
    experienceHeading: "Household experience (labeled — not instruction)",
    qualificationsHeading: "Mandatory qualifications",
    missingHeading: "Missing evidence",
    conflictsHeading: "Unresolved conflicts",
    escalationHeading: "Escalation directive",
    prohibitedHeading: "Prohibited assertions",
    citationsHeading: "Citation map",
    ledgerHeading: "Support ledger",
    validationHeading: "Plan validation",
    previewHeading: "Deterministic preview (no model)",
    validPass: "Plan is valid — every point is traceable and supported.",
    validFail: "Plan is INVALID — see errors.",
    note: "This plan is what a future model would receive as a hard constraint. It never receives a raw evidence packet.",
    fingerprintLabel: "Fingerprints",
  },

  renderer: {
    heading: "Live constrained renderer",
    localOnly: "Local development only. Disabled in production. One click sends at most one model request; no retry.",
    intro:
      "The model may only select and order approved answer elements and pick reviewed templates. It never retrieves, judges authority, writes facts, or generates citations. The trusted answer is compiled deterministically; the model receives a RenderContract, never a raw packet.",
    statusEnabled: "Live renderer: enabled",
    statusDisabled: "Live renderer: disabled — using the deterministic preview",
    providerLabel: "Provider",
    modelLabel: "Configured model",
    planValidLabel: "Plan valid",
    render: "Compose with model (1 request)",
    rendering: "Composing…",
    pipeline: "Valid plan → provider → candidate validation → deterministic compilation → final validation",
    resultRendered: "Model-composed answer (deterministically compiled & validated)",
    resultFallback: "Deterministic fallback",
    candidateValidation: "Candidate validation",
    finalValidation: "Final-render validation",
    rejectionReasons: "Rejection reasons",
    fingerprints: "Fingerprints",
    providerMeta: "Provider metadata",
    note: "No chat, no assistant persona. The model reorganizes approved elements; it does not reason over sources or answer independently.",
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
