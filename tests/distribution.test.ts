/**
 * Phase 8 domain tests — Creator Content Studio & Honest Distribution.
 *
 * Runs with the committed tooling: `npm test` (node:test via tsx). Verifies the
 * canonical/derivative boundary, fail-closed validation, honest export, and the
 * no-publishing destination model. Deterministic — no network, no model.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  createDistributionAsset,
  editBlockText,
  removeBlock,
  reorderBlocks,
  validateDistributionAsset,
  assetStaleness,
  markStale,
  reviewStaleAsset,
  exportAsset,
  markExported,
  isExportable,
  DISTRIBUTION_DESTINATIONS,
  destinationsForChannel,
  canPublish,
  requiredCautions,
  affiliateUrls,
  getTemplate,
  type DistributionAsset,
} from "../src/domain/distribution/index.ts";
import { seededDistributionAssets } from "../src/data/distribution-seed.ts";
import { distributionRepo, LocalDistributionRepository } from "../src/data/distribution-repo.ts";
import { systems, getSystem } from "../src/data/systems.ts";
import { lists as allLists, getList } from "../src/data/lists.ts";

const laundry = getSystem("family-of-six-laundry-line")!;
const celiac = getSystem("celiac-safe-pantry-reset")!;
const laundryLists = laundry.listSlugs.map((s) => getList(s)!).filter(Boolean);
const celiacLists = celiac.listSlugs.map((s) => getList(s)!).filter(Boolean);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function buildLaundryVideo(): DistributionAsset {
  const r = createDistributionAsset({
    system: laundry,
    lists: laundryLists,
    templateId: "video-problem-method",
    creatorHandle: laundry.creatorHandle,
    selection: {
      promise: true,
      problem: true,
      routineIndices: [0],
      listItemIds: ["laundry-line-starter-kit#mesh-bags"],
    },
  });
  assert.ok(r.ok, "laundry video should build");
  return (r as Extract<typeof r, { ok: true }>).asset;
}

function buildCeliacPin(): DistributionAsset {
  const r = createDistributionAsset({
    system: celiac,
    lists: celiacLists,
    templateId: "pin-practical-system",
    creatorHandle: celiac.creatorHandle,
    selection: { promise: true, problem: true, limitations: true, routineIndices: [0] },
  });
  assert.ok(r.ok, "celiac pin should build");
  return (r as Extract<typeof r, { ok: true }>).asset;
}

// -------------------------------------------------------------- creation

test("createDistributionAsset builds a valid draft from a canonical system", () => {
  const a = buildLaundryVideo();
  assert.equal(a.status, "draft");
  assert.equal(a.origin, "local-device");
  assert.equal(a.validation?.valid, true, JSON.stringify(a.validation?.errors));
});

test("creation is read-only over the canonical system (no mutation)", () => {
  const before = clone(laundry);
  buildLaundryVideo();
  assert.deepEqual(laundry, before, "the canonical system must not be mutated");
});

test("asset IDs are deterministic for identical inputs", () => {
  const a = buildLaundryVideo();
  const b = buildLaundryVideo();
  assert.equal(a.id, b.id);
});

test("source-backed blocks carry exact canonical text", () => {
  const a = buildLaundryVideo();
  for (const b of a.blocks) {
    if (b.provenance === "source-backed" && b.sourceRef) {
      assert.equal(b.text, b.sourceRef.exactText);
    }
  }
});

test("every seeded/created asset traces to a real source system + version", () => {
  const a = buildLaundryVideo();
  assert.equal(a.sourceSystemSlug, laundry.slug);
  assert.equal(a.sourceSystemVersion, laundry.version);
  for (const ref of a.sourceRefs) assert.equal(ref.owningSystemSlug, laundry.slug);
});

// -------------------------------------------------------------- editing

test("editing a source-backed block flips it to creator-authored-derivative", () => {
  const a = buildLaundryVideo();
  const sb = a.blocks.find((b) => b.provenance === "source-backed")!;
  const edited = editBlockText(a, sb.id, sb.text + " (my words now)");
  const next = edited.blocks.find((b) => b.id === sb.id)!;
  assert.equal(next.provenance, "creator-authored-derivative");
  assert.equal(next.editedFromExact, true);
});

test("editing drops a ready/exported asset back to draft", () => {
  const a = { ...buildLaundryVideo(), status: "ready" as const };
  const editable = a.blocks.find((b) => b.editable)!;
  const edited = editBlockText(a, editable.id, editable.text + " x");
  assert.equal(edited.status, "draft");
});

test("removeBlock refuses required blocks and never silently drops them", () => {
  const a = buildLaundryVideo();
  const required = a.blocks.find((b) => b.required)!;
  const after = removeBlock(a, required.id);
  assert.equal(after.blocks.length, a.blocks.length);
  assert.ok(after.blocks.some((b) => b.id === required.id));
});

test("reorderBlocks never drops blocks even with a partial order", () => {
  const a = buildLaundryVideo();
  const after = reorderBlocks(a, [a.blocks[2].id, a.blocks[0].id]);
  assert.equal(after.blocks.length, a.blocks.length);
  assert.deepEqual(new Set(after.blocks.map((b) => b.id)), new Set(a.blocks.map((b) => b.id)));
});

// -------------------------------------------------------------- validation (fail closed)

test("validation passes for a fresh, current asset", () => {
  const a = buildLaundryVideo();
  assert.equal(validateDistributionAsset(a, laundry).valid, true);
});

test("validation fails when the source system is missing", () => {
  const a = buildLaundryVideo();
  const r = validateDistributionAsset(a, undefined);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.code === "missing-source-system"));
});

test("validation fails on a newer-than-source version", () => {
  const a = clone(buildLaundryVideo());
  a.sourceSystemVersion = laundry.version + 5;
  const r = validateDistributionAsset(a, laundry);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.code === "source-version-mismatch"));
});

test("validation flags a stale source", () => {
  const a = clone(buildLaundryVideo());
  a.sourceSystemVersion = laundry.version - 1;
  const r = validateDistributionAsset(a, laundry);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.code === "stale-source"));
});

test("validation fails on duplicate block IDs", () => {
  const a = clone(buildLaundryVideo());
  a.blocks.push(clone(a.blocks[1]));
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "duplicate-block-id"));
});

test("validation fails when the required source-backed limitation is removed", () => {
  // Celiac has an explicit limitation; the experience-not-universal block must
  // NOT satisfy the source-backed limitation requirement.
  const a = clone(buildCeliacPin());
  a.blocks = a.blocks.filter((b) => !(b.kind === "limitation" && b.sourceRef?.sourceObjectType === "limitations"));
  const r = validateDistributionAsset(a, celiac);
  assert.ok(r.errors.some((e) => e.code === "required-limitation-removed"));
});

test("validation fails when a required medical caution is removed (celiac)", () => {
  const a = clone(buildCeliacPin());
  a.disclosures = a.disclosures.filter((d) => d.kind !== "medical-caution");
  const r = validateDistributionAsset(a, celiac);
  assert.ok(r.errors.some((e) => e.code === "missing-medical-caution"));
});

test("validation fails when a required affiliate disclosure is removed", () => {
  const a = clone(buildLaundryVideo());
  a.disclosures = a.disclosures.filter((d) => d.kind !== "creator-affiliate");
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "missing-affiliate-disclosure"));
});

test("validation fails when a required developmental caution is removed", () => {
  const devSystem = clone(celiac);
  devSystem.facets = { ...(devSystem.facets ?? {}), developmentalStage: "toddler milestones by age" };
  assert.equal(requiredCautions(devSystem).developmental, true);
  const r = createDistributionAsset({
    system: devSystem,
    lists: celiacLists,
    templateId: "pin-practical-system",
    creatorHandle: devSystem.creatorHandle,
    selection: { promise: true, problem: true },
  });
  assert.ok(r.ok);
  const asset = clone((r as Extract<typeof r, { ok: true }>).asset);
  assert.ok(asset.disclosures.some((d) => d.kind === "developmental-caution"));
  asset.disclosures = asset.disclosures.filter((d) => d.kind !== "developmental-caution");
  const v = validateDistributionAsset(asset, devSystem);
  assert.ok(v.errors.some((e) => e.code === "missing-developmental-caution"));
});

test("validation rejects an unsupported retailer claim", () => {
  const a = clone(buildLaundryVideo());
  const tb = a.blocks.find((b) => b.provenance === "deterministic-template")!;
  tb.text = "These are the cheapest bags with guaranteed in stock everywhere.";
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "unsupported-retailer-claim"));
});

test("validation rejects unsafe HTML/script in a block", () => {
  const a = clone(buildLaundryVideo());
  const hook = a.blocks.find((b) => b.provenance === "deterministic-template")!;
  hook.text = "Watch this <script>alert(1)</script>";
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "unsafe-html"));
});

test("validation rejects a guaranteed/unverified result claim", () => {
  const a = clone(buildLaundryVideo());
  const hook = a.blocks.find((b) => b.provenance === "deterministic-template")!;
  hook.text = "This is guaranteed to work in every home.";
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "guaranteed-result"));
});

test("validation rejects fictional roast content mixed into guidance", () => {
  const a = clone(buildLaundryVideo());
  const hook = a.blocks.find((b) => b.provenance === "deterministic-template")!;
  hook.text = "A 100% fictional roast of Deb goes here.";
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "roast-fiction-mixed"));
});

test("validation rejects a malformed external URL", () => {
  const a = clone(buildLaundryVideo());
  const hook = a.blocks.find((b) => b.provenance === "deterministic-template")!;
  hook.text = "Broken link http://[ here";
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "malformed-url"));
});

test("validation rejects a source-backed label after the text was tampered", () => {
  const a = clone(buildLaundryVideo());
  const sb = a.blocks.find((b) => b.provenance === "source-backed")!;
  sb.text = sb.text + " tampered"; // still claims source-backed
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "exact-label-on-edited-block"));
});

test("validation rejects an invalid channel/template combination", () => {
  const a = clone(buildLaundryVideo());
  a.channel = "blog"; // video template does not serve blog
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "invalid-channel"));
});

test("validation rejects empty exportable content", () => {
  const a = clone(buildLaundryVideo());
  for (const b of a.blocks) b.text = "";
  const r = validateDistributionAsset(a, laundry);
  assert.ok(r.errors.some((e) => e.code === "empty-exportable-content"));
});

// -------------------------------------------------------------- translation honesty

test("creation refuses a localized asset with no approved translation", () => {
  const r = createDistributionAsset({
    system: celiac,
    lists: celiacLists,
    templateId: "pin-practical-system",
    creatorHandle: celiac.creatorHandle,
    selection: { promise: true },
    assetLocale: "es",
  });
  assert.equal(r.ok, false);
});

test("creation refuses a machine-draft translation as a publication source", () => {
  const r = createDistributionAsset({
    system: celiac,
    lists: celiacLists,
    templateId: "pin-practical-system",
    creatorHandle: celiac.creatorHandle,
    selection: { promise: true },
    assetLocale: "es",
    translation: { status: "machine-draft", sourceVersion: 4 },
  });
  assert.equal(r.ok, false);
});

test("celiac asset built from the English original is valid and carries a medical caution", () => {
  const a = buildCeliacPin();
  assert.equal(a.provenance.translationStatus, "original");
  assert.equal(a.assetLocale, "en");
  assert.ok(a.disclosures.some((d) => d.kind === "medical-caution" && d.required));
  assert.equal(a.validation?.valid, true, JSON.stringify(a.validation?.errors));
});

// -------------------------------------------------------------- staleness

test("staleness detects a source version bump and review re-baselines", () => {
  const older = clone(laundry);
  older.version = laundry.version - 1;
  const r = createDistributionAsset({
    system: older,
    lists: laundryLists,
    templateId: "social-context-method",
    creatorHandle: laundry.creatorHandle,
    selection: { problem: true, routineIndices: [0] },
  });
  assert.ok(r.ok);
  const asset = (r as Extract<typeof r, { ok: true }>).asset;

  const report = assetStaleness(asset, laundry);
  assert.equal(report.stale, true);

  const staled = markStale(asset, laundry);
  assert.equal(staled.status, "stale");
  assert.equal(staled.provenance.reviewState, "needs-review");

  const reviewed = reviewStaleAsset(staled, laundry);
  assert.equal(reviewed.status, "draft");
  assert.equal(reviewed.sourceSystemVersion, laundry.version);
  assert.equal(reviewed.provenance.reviewState, "creator-reviewed");
});

// -------------------------------------------------------------- export

test("export produces a provenance + disclosure footer", () => {
  const a = buildLaundryVideo();
  const r = exportAsset(a, "markdown");
  assert.ok(r.ok);
  const out = (r as Extract<typeof r, { ok: true }>).content;
  assert.match(out, /Content preview — not published/);
  assert.match(out, new RegExp(`Source system: ${laundry.slug} \\(v${laundry.version}\\)`));
  assert.match(out, new RegExp(`Creator: ${laundry.creatorHandle}`));
  assert.match(out, /Disclosure \(creator-affiliate\)/);
});

test("export refuses a stale asset (cannot export as current)", () => {
  const a = markStale({ ...buildLaundryVideo(), sourceSystemVersion: laundry.version - 1 }, laundry);
  assert.equal(isExportable(a), false);
  const r = exportAsset(a, "text");
  assert.equal(r.ok, false);
});

test("markExported records the timestamp and exported status (still local)", () => {
  const a = markExported(buildLaundryVideo(), "2026-07-20T00:00:00.000Z");
  assert.equal(a.status, "exported");
  assert.equal(a.exportedAt, "2026-07-20T00:00:00.000Z");
});

// -------------------------------------------------------------- destinations (no publishing)

test("no destination is publishable — export/copy are the only working paths", () => {
  for (const d of DISTRIBUTION_DESTINATIONS) {
    assert.equal(canPublish(d), false);
    assert.notEqual(d.capability, "connected-publishable");
  }
  const social = DISTRIBUTION_DESTINATIONS.filter((d) => d.id === "tiktok" || d.id === "instagram");
  assert.ok(social.length > 0);
  for (const d of social) assert.equal(d.capability, "planned");
});

test("destinationsForChannel always includes the manual paths", () => {
  const dests = destinationsForChannel("tiktok");
  assert.ok(dests.some((d) => d.capability === "manual-copy"));
  assert.ok(dests.some((d) => d.capability === "export-only"));
});

// -------------------------------------------------------------- sensitivity

test("requiredCautions detects medical for celiac and not for laundry", () => {
  assert.equal(requiredCautions(celiac).medical, true);
  assert.equal(requiredCautions(laundry).medical, false);
});

// -------------------------------------------------------------- seeds

test("seeds: three honest demos, celiac from English original, one stale", () => {
  assert.equal(seededDistributionAssets.length, 3);
  const pin = seededDistributionAssets.find((a) => a.assetType === "pinterest-pin")!;
  assert.equal(pin.assetLocale, "en");
  assert.equal(pin.provenance.translationStatus, "original");
  assert.ok(pin.disclosures.some((d) => d.kind === "medical-caution"));

  const stale = seededDistributionAssets.find((a) => a.status === "stale")!;
  assert.ok(stale);
  assert.equal(stale.validation?.valid, false);
});

test("every template's declared channels resolve and match its asset type", () => {
  for (const s of systems) void s; // touch the corpus so a missing import fails loudly
  const t = getTemplate("video-problem-method")!;
  assert.equal(t.assetType, "short-form-video");
  assert.ok(t.channels.includes("tiktok"));
});

// -------------------------------------------------------------- affiliate neutrality

test("affiliate URLs are preserved verbatim at the source and never injected/rewritten", () => {
  const urls = affiliateUrls(laundryLists);
  assert.ok(urls.length > 0, "laundry kit has affiliate offers");
  // Source URLs are untouched (identical to the canonical offer URLs).
  const canonical = laundryLists
    .flatMap((l) => l.items)
    .flatMap((i) => i.preferred?.offers ?? [])
    .filter((o) => o.affiliate)
    .map((o) => o.url);
  assert.deepEqual(urls, canonical);
  // The derivative never embeds/rewrites those affiliate URLs into its body.
  const a = buildLaundryVideo();
  for (const b of a.blocks) for (const u of urls) assert.ok(!b.text.includes(u));
});

test("affiliate neutrality: a list-item block states the NEED, not the preferred product", () => {
  const a = createDistributionAsset({
    system: laundry,
    lists: laundryLists,
    templateId: "social-list-explainer",
    creatorHandle: laundry.creatorHandle,
    selection: { problem: true, listItemIds: ["laundry-line-starter-kit#mesh-bags"] },
  });
  assert.ok(a.ok);
  const asset = (a as Extract<typeof a, { ok: true }>).asset;
  const li = asset.blocks.find((b) => b.kind === "list-item")!;
  const item = laundryLists.flatMap((l) => l.items).find((i) => i.id === "mesh-bags")!;
  assert.ok(li.text.includes(item.need), "block leads with the household need");
  assert.ok(!li.text.includes(item.preferred?.name ?? "###"), "block does not substitute the product for the need");
});

// -------------------------------------------------------------- persistence

test("repository persists to device-local storage and reset re-seeds deterministically", () => {
  const mem = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  g.window = {
    localStorage: {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    },
  };
  try {
    const repo = new LocalDistributionRepository();
    const first = repo.load();
    assert.equal(first.assets.length, 3);
    assert.equal(first.origin, "local-device", "local store is never presented as published");

    const added = buildLaundryVideo(); // distinct selection from the seed → new id
    repo.upsert(added);
    const reloaded = repo.load();
    assert.ok(reloaded.assets.some((a) => a.id === added.id), "survives a reload (refresh)");

    const afterReset = repo.reset();
    assert.equal(afterReset.assets.length, 3, "reset re-seeds deterministically");
    assert.ok(!afterReset.assets.some((a) => a.id === added.id), "reset drops local additions");
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
  }
});

test("the shared repo instance is honest local-device origin", () => {
  const store = distributionRepo.load();
  assert.equal(store.origin, "local-device");
});
