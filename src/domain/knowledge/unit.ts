/**
 * KnowledgeUnit projection (Phase 4).
 *
 * A KnowledgeUnit is the smallest source-backed segment retrieval can return.
 * Projection is STRICTLY READ-ONLY: it reads canonical systems/lists and
 * derives display + index data. It never mutates a system, list, item,
 * routine, recipe, story, or translation record.
 *
 * Hard boundaries:
 *  - The unit's `displayText` is exact source-backed text. No summarization,
 *    no paraphrase, no invented claim.
 *  - Retailer offers, affiliate status, price, and merchant availability are
 *    NEVER projected into a unit. Commerce cannot influence knowledge rank
 *    because it is not present in the knowledge object at all.
 *  - Units are always ORIGINAL canonical segments. Translations are handled
 *    at representation time (see representation.ts); a derivative is never
 *    minted as a unit and labeled as the creator's own words.
 *  - IDs are deterministic and stable for the same (source object, version).
 *
 * No framework imports belong in this module.
 */
import type {
  Creator,
  Facet,
  HouseholdSystem,
  ItemImportance,
  PortableList,
  ReviewStatus,
  SourceType,
} from "../types";
import type { LocaleMeta } from "../i18n";
import { DEFAULT_LOCALE, effectiveLocale } from "../i18n";
import { facetsOf } from "../facets";
import { normalizeText, tokenize } from "./text";

export type UnitKind =
  | "problem-promise"
  | "audience"
  | "limitations"
  | "observed-outcome"
  | "story-section"
  | "list-item"
  | "routine"
  | "recipe";

/** Which canonical object a unit was projected from. */
export type SourceObjectType =
  | "system"
  | "story-section"
  | "list-item"
  | "routine"
  | "recipe";

/** Whether the canonical content is original or a kind of derivative. */
export type Derivation = "original" | "adapted" | "translated" | "generated";

export function derivationOf(sourceType: SourceType): Derivation {
  switch (sourceType) {
    case "translated-derivative":
      return "translated";
    case "platform-synthesis":
    case "ai-assisted-draft":
      return "generated";
    case "community-adaptation":
      return "adapted";
    default:
      return "original";
  }
}

/**
 * Structured list-item projection — preserves the need/product/substitution
 * distinction rather than collapsing to prose. Deliberately excludes retailer
 * offers (see module boundary).
 */
export interface ListItemProjection {
  listSlug: string;
  listTitle: string;
  need: string;
  /** Product identity (knowledge), not an offer. Never a URL/price. */
  preferredName?: string;
  preferredWhy?: string;
  substitutions: { name: string; note: string }[];
  quantity: string;
  recurrence: string;
  importance: ItemImportance;
  notes?: string;
}

export interface KnowledgeUnit {
  /** Deterministic, stable for the same source object + source version. */
  id: string;
  kind: UnitKind;
  sourceObjectType: SourceObjectType;
  /** Slug or item id of the canonical source object. */
  sourceObjectId: string;
  ownerSystemSlug: string;
  ownerSystemTitle: string;
  sourceVersion: number;
  creatorHandle: string;
  originalAuthorHandle: string;

  /** EXACT source-backed text. Never summarized or invented. */
  displayText: string;
  /** Optional structured payload for list-item units. */
  listItem?: ListItemProjection;

  sourceLocale: LocaleMeta;
  effectiveLocale: LocaleMeta;

  provenanceSourceType: SourceType;
  livedExperience: boolean;
  derivation: Derivation;
  reviewStatus: ReviewStatus;

  facets: Facet[];
  applicability?: string;
  limitations?: string;

  publicHref?: string;
  studioHref: string;

  /** Match-signal tokens (display + context). NOT shown as claims. */
  indexTokens: string[];
  /** Normalized searchable text for exact-phrase detection. */
  indexText: string;
}

function unitId(
  slug: string,
  version: number,
  kind: UnitKind,
  localKey: string,
): string {
  return `ku:${slug}:v${version}:${kind}:${localKey}`;
}

/**
 * Project all knowledge units for one system. Pure read-only over its inputs.
 */
export function projectSystem(
  system: HouseholdSystem,
  systemLists: PortableList[],
  creator?: Creator,
): KnowledgeUnit[] {
  const sysLocale = system.locale ?? creator?.locale ?? DEFAULT_LOCALE;
  const provenance = system.provenance;
  const sourceType: SourceType = provenance?.sourceType ?? "personal-experience";
  const livedExperience = provenance?.livedExperience ?? false;
  const reviewStatus: ReviewStatus =
    provenance?.reviewStatus ?? "unreviewed";
  const originalAuthorHandle =
    provenance?.originalAuthorHandle ?? system.creatorHandle;
  const derivation = derivationOf(sourceType);

  // Facets describe the whole system; every unit inherits them for retrieval,
  // plus situationTags become household-circumstance facets. facetsOf() is the
  // Phase 3 seam — reused, not reimplemented.
  const systemFacets: Facet[] = [
    ...facetsOf(system),
    ...system.situationTags.map(
      (t): Facet => ({ key: "household-circumstance", value: t }),
    ),
  ];

  // Context header appended to each unit's index (not its displayText) so a
  // segment inherits its system's findability without altering its claim.
  const contextHeader = [
    system.title,
    system.situationTags.join(" "),
    system.facets?.domain ?? "",
  ].join(" ");

  const commonApplicability =
    system.facets?.applicability ?? system.facets?.audience ?? system.audience;

  const publicHref = `/systems/${system.slug}`;
  const studioHref = `/studio/systems/${system.slug}/edit`;

  const make = (
    kind: UnitKind,
    localKey: string,
    sourceObjectType: SourceObjectType,
    sourceObjectId: string,
    displayText: string,
    extra?: {
      listItem?: ListItemProjection;
      localeOverride?: LocaleMeta;
      indexExtra?: string;
      applicability?: string;
      limitations?: string;
      href?: string;
      facets?: Facet[];
    },
  ): KnowledgeUnit => {
    const effective = effectiveLocale(extra?.localeOverride, sysLocale);
    const indexText = normalizeText(
      [displayText, contextHeader, extra?.indexExtra ?? ""].join(" "),
    );
    return {
      id: unitId(system.slug, system.version, kind, localKey),
      kind,
      sourceObjectType,
      sourceObjectId,
      ownerSystemSlug: system.slug,
      ownerSystemTitle: system.title,
      sourceVersion: system.version,
      creatorHandle: system.creatorHandle,
      originalAuthorHandle,
      displayText,
      listItem: extra?.listItem,
      sourceLocale: sysLocale,
      effectiveLocale: effective,
      provenanceSourceType: sourceType,
      livedExperience,
      derivation,
      reviewStatus,
      facets: extra?.facets ?? systemFacets,
      applicability: extra?.applicability ?? commonApplicability,
      limitations: extra?.limitations ?? system.limitations,
      publicHref: extra?.href ?? publicHref,
      studioHref,
      indexTokens: tokenize(indexText),
      indexText,
    };
  };

  const units: KnowledgeUnit[] = [];

  // 1) Problem + promise (one unit)
  units.push(
    make(
      "problem-promise",
      "core",
      "system",
      system.slug,
      `${system.promise}\n\n${system.problem}`,
    ),
  );

  // 2) Audience (when present)
  if (system.audience) {
    units.push(make("audience", "audience", "system", system.slug, system.audience));
  }

  // 3) Limitations / applicability (when present)
  if (system.limitations || system.facets?.applicability) {
    const text = [system.limitations, system.facets?.applicability]
      .filter(Boolean)
      .join(" ");
    units.push(
      make("limitations", "limitations", "system", system.slug, text, {
        indexExtra: system.facets?.applicability ?? "",
      }),
    );
  }

  // 4) Observed outcomes (when present)
  if (system.observedResults) {
    units.push(
      make(
        "observed-outcome",
        "observed",
        "system",
        system.slug,
        system.observedResults,
      ),
    );
  }

  // 5) One unit per story section
  system.story.forEach((section, i) => {
    units.push(
      make(
        "story-section",
        `story-${i}`,
        "story-section",
        `${system.slug}#story-${i}`,
        section.body,
        { localeOverride: section.locale, indexExtra: section.heading },
      ),
    );
  });

  // 6) One unit per list item (structure preserved, offers excluded)
  for (const list of systemLists) {
    list.items.forEach((item) => {
      const listItem: ListItemProjection = {
        listSlug: list.slug,
        listTitle: list.title,
        need: item.need,
        preferredName: item.preferred?.name,
        preferredWhy: item.preferred?.why,
        substitutions: item.substitutions.map((s) => ({
          name: s.name,
          note: s.note,
        })),
        quantity: item.quantity,
        recurrence: item.recurrence,
        importance: item.importance ?? "required",
        notes: item.notes,
      };
      const indexExtra = [
        item.preferred?.name,
        item.preferred?.why,
        ...item.substitutions.map((s) => `${s.name} ${s.note}`),
        item.notes,
        list.title,
        list.intro,
      ]
        .filter(Boolean)
        .join(" ");
      units.push(
        make(
          "list-item",
          `list-${list.slug}-${item.id}`,
          "list-item",
          `${list.slug}#${item.id}`,
          item.need,
          {
            listItem,
            localeOverride: list.locale,
            indexExtra,
            href: `/lists/${list.slug}`,
          },
        ),
      );
    });
  }

  // 7) One unit per routine (steps preserved as text; Cred metadata as facets)
  system.routines.forEach((routine, i) => {
    const stepsText = routine.steps.map((s) => `${s.when}: ${s.what}`).join(" ");
    const display = `${routine.title} (${routine.frequency})\n${stepsText}`;
    const routineFacets: Facet[] = [...systemFacets];
    if (routine.cred?.skillTaught)
      routineFacets.push({ key: "skill-taught", value: routine.cred.skillTaught });
    if (routine.cred?.supervisionLevel)
      routineFacets.push({
        key: "supervision-level",
        value: routine.cred.supervisionLevel,
      });
    if (routine.frequency)
      routineFacets.push({ key: "frequency", value: routine.frequency });
    const indexExtra = [
      routine.note,
      (routine.prerequisites ?? []).join(" "),
      routine.cred?.skillTaught,
      routine.cred?.ageApplicability,
      routine.culturalNote,
    ]
      .filter(Boolean)
      .join(" ");
    units.push(
      make(
        "routine",
        `routine-${i}`,
        "routine",
        `${system.slug}#routine-${i}`,
        display,
        { localeOverride: routine.locale, indexExtra, facets: routineFacets },
      ),
    );
  });

  // 8) One unit per recipe
  system.recipes.forEach((recipe, i) => {
    const display = [
      `${recipe.title} — ${recipe.servings}, ${recipe.time}`,
      recipe.ingredients.join("; "),
      recipe.steps.join(" "),
    ].join("\n");
    units.push(
      make(
        "recipe",
        `recipe-${i}`,
        "recipe",
        `${system.slug}#recipe-${i}`,
        display,
        { localeOverride: recipe.locale, indexExtra: recipe.note ?? "" },
      ),
    );
  });

  return units;
}
