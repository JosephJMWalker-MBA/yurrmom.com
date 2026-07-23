"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addVersion,
  assessmentForSource,
  buildClaimPayload,
  canTransition,
  citationIsComplete,
  claimCitations,
  claimId as makeClaimId,
  evaluateApprovalGuard,
  makeEvidenceLink,
  makeSpan,
  REVIEW_CHECKLIST,
  spansForVersion,
  versionsForSource,
} from "@/domain/reference";
import type {
  CuratedClaim,
  ClaimStatus,
  ClaimType,
  InterpretationLevel,
  ReferenceRegistry,
} from "@/domain/reference";
import { evaluateAuthoritativeEligibility, type GuidanceRisk } from "@/domain/knowledge";
import { referenceIngestionAdapter } from "@/adapters/reference-ingestion";
import { copy } from "@/i18n";
import {
  Field,
  GhostButton,
  PrimaryButton,
  SectionCard,
  Select,
  TextArea,
  TextInput,
} from "@/ui/studio/fields";
import { useReferences } from "@/ui/studio/use-references";

const R = copy.references;
const NOW_ISO = () => new Date().toISOString();

const interpretationOptions: { value: InterpretationLevel; label: string }[] = [
  { value: "direct-statement", label: R.interpretationDirect },
  { value: "faithful-paraphrase", label: R.interpretationParaphrase },
  { value: "editorial-inference", label: R.interpretationInference },
];

const claimTypeOptions: ClaimType[] = [
  "descriptive", "procedural", "developmental", "safety",
  "contraindication", "recommendation", "definition", "limitation",
];

const riskOptions: GuidanceRisk[] = [
  "ordinary-household", "medical", "developmental", "mental-health", "legal", "safety-critical",
];

const statusTone: Record<ClaimStatus, string> = {
  draft: "border-ink/30 bg-cream text-ink-soft",
  "evidence-linked": "border-mustard bg-mustard-soft text-ink",
  "in-review": "border-mustard bg-mustard-soft text-ink",
  approved: "border-sage bg-sage-soft text-sage-deep",
  "needs-revision": "border-tomato/60 bg-cream text-tomato-deep",
  superseded: "border-ink/30 bg-cream text-ink-soft",
  withdrawn: "border-ink/30 bg-cream text-ink-soft",
};

export function ReferenceDesk() {
  const { registry, update, reset, saveStatus, ready } = useReferences();
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const sourceId = selectedSourceId ?? registry?.sources[0]?.id ?? null;

  if (!ready || !registry) {
    return <p className="text-sm text-ink-soft">Opening the Reference Desk…</p>;
  }

  const source = registry.sources.find((s) => s.id === sourceId);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sage">
          {copy.studio.name} · {R.title}
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">{R.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">{R.tagline}</p>
        <p className="mt-2 text-xs text-ink-soft">
          {R.persistenceNote} · {saveStatus === "saving" ? "Saving…" : "Saved on this device"}
        </p>
      </header>

      {/* Ingestion boundary — honest states */}
      <p className="rounded-xl border border-ink/15 bg-cream p-3 text-xs text-ink-soft">
        <span className="font-bold text-ink">Ingestion:</span> {referenceIngestionAdapter.publicNote}
      </p>

      {/* Source selector + new source */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-ink-soft">{R.sourcesHeading}:</span>
        {registry.sources.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedSourceId(s.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              s.id === sourceId
                ? "border-ink bg-paper shadow-[2px_2px_0_0_#221a14]"
                : "border-ink/25 text-ink-soft hover:border-sage hover:text-sage-deep"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <NewSourceForm update={update} onCreated={setSelectedSourceId} />

      {source && (
        <SourceDetail
          key={source.id}
          registry={registry}
          sourceId={source.id}
          update={update}
        />
      )}

      <section className="rounded-2xl border border-ink/15 bg-sage-soft/40 p-4 text-sm text-ink-soft">
        <p className="font-bold text-ink">Honest notes</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>{R.approvedScopeNote}</li>
          <li>{R.emptyAuthorityNote}</li>
          <li>{R.ingestionNote}</li>
        </ul>
        <div className="mt-3">
          <GhostButton danger onClick={reset}>{R.reset}</GhostButton>
        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------------------- source detail

function SourceDetail({
  registry,
  sourceId,
  update,
}: {
  registry: ReferenceRegistry;
  sourceId: string;
  update: (fn: (r: ReferenceRegistry) => ReferenceRegistry) => void;
}) {
  const source = registry.sources.find((s) => s.id === sourceId)!;
  const publisher = registry.publishers.find((p) => p.id === source.publisherId);
  const versions = versionsForSource(registry, sourceId);
  const assessment = assessmentForSource(registry, sourceId);
  const claims = registry.claims.filter((c) => versions.some((v) => v.id === c.dependsOnVersionId));

  return (
    <div className="space-y-5">
      {/* Publisher — clearly NOT an authority grant */}
      <SectionCard title={`${R.publisherHeading} · source text`} intro="Publisher identity is metadata. It grants no authority on its own.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-ink-soft">Publisher</p>
            <p className="text-sm font-semibold">{publisher?.name}</p>
            <p className="text-xs text-ink-soft">{publisher?.organizationType}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-ink-soft">Source</p>
            <p className="text-sm font-semibold">{source.title}</p>
            <p className="text-xs text-ink-soft">
              {source.category} · status {source.status} · {source.jurisdictions.join(", ")} · domains {source.subjectDomains.join(", ")}
            </p>
          </div>
        </div>
        {source.usageNotes && (
          <p className="text-xs text-ink-soft"><span className="font-bold">Licensing/usage:</span> {source.usageNotes}</p>
        )}
      </SectionCard>

      {/* Versions — immutable */}
      <SectionCard title={R.versionsHeading} intro="Each version is an immutable snapshot with a content hash. A new version never overwrites an old one.">
        <ul className="space-y-3">
          {versions.map((v) => (
            <li key={v.id} className="rounded-xl border border-ink/15 bg-cream/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-extrabold">{v.versionLabel}</span>
                <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                  status: {v.status}
                </span>
                <span className="text-[11px] text-ink-soft">hash {v.contentHash}</span>
                {v.supersededByVersionId && (
                  <span className="text-[11px] text-tomato-deep">superseded by a newer version</span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line border-l-4 border-ink/20 pl-3 text-xs text-ink-soft">
                {v.sourceText}
              </p>
              <SpansForVersion registry={registry} versionId={v.id} update={update} editable={v.status === "active"} />
            </li>
          ))}
        </ul>
        <AddVersionForm sourceId={sourceId} update={update} />
      </SectionCard>

      {/* Authority assessment — scoped */}
      <SectionCard title={R.assessmentHeading} intro="Authority is scoped by domain, jurisdiction, audience, date, and risk. This is what actually enables authoritative retrieval — not the publisher's name.">
        {assessment ? (
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-bold">Status:</span>{" "}
              <span className={assessment.status === "approved-for-scope" ? "text-sage-deep font-bold" : "text-tomato-deep font-bold"}>
                {assessment.status}
              </span>
            </p>
            <p className="text-xs text-ink-soft">Domains: {assessment.recognizedDomains.join(", ") || "—"}</p>
            <p className="text-xs text-ink-soft">Jurisdictions: {assessment.recognizedJurisdictions.join(", ") || "—"}</p>
            <p className="text-xs text-ink-soft">Risk categories: {assessment.supportedRiskCategories.join(", ") || "—"}</p>
            <p className="text-xs text-ink-soft">Review due: {assessment.reviewDueDate ?? "—"}</p>
            <p className="text-xs text-ink-soft">{assessment.limitations}</p>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">No assessment — this source is unassessed and cannot satisfy high-stakes support.</p>
        )}
        <AssessmentEditor registry={registry} sourceId={sourceId} update={update} />
      </SectionCard>

      {/* Claims + review + eligibility */}
      <SectionCard title={R.claimsHeading} intro="A claim is an editorially reviewable proposition connected to exact evidence — never the same object as the source text.">
        <ul className="space-y-4">
          {claims.map((c) => (
            <ClaimCard key={c.id} registry={registry} claim={c} update={update} />
          ))}
          {claims.length === 0 && <li className="text-sm text-ink-soft">No claims yet.</li>}
        </ul>
        <DraftClaimForm registry={registry} sourceId={sourceId} update={update} />
      </SectionCard>
    </div>
  );
}

// ------------------------------------------------------------- spans

function SpansForVersion({
  registry,
  versionId,
  update,
  editable,
}: {
  registry: ReferenceRegistry;
  versionId: string;
  update: (fn: (r: ReferenceRegistry) => ReferenceRegistry) => void;
  editable: boolean;
}) {
  const spans = spansForVersion(registry, versionId);
  const [text, setText] = useState("");
  const [section, setSection] = useState("");
  const [page, setPage] = useState("");

  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">{copy.references.spansHeading}</p>
      <ul className="mt-1 space-y-1.5">
        {spans.map((s) => (
          <li key={s.id} className="rounded-lg border border-ink/15 bg-paper p-2 text-xs">
            <p className="italic">&ldquo;{s.exactText}&rdquo;</p>
            <p className="mt-1 text-ink-soft">
              {s.sectionPath ? `${s.sectionPath} · ` : ""}
              {s.locator.page ? `p.${s.locator.page} · ` : ""}
              {s.locator.sectionHeading ? `${s.locator.sectionHeading} · ` : ""}
              hash {s.textHash} {citationIsComplete(s) ? "· citation complete" : "· incomplete citation"}
            </p>
          </li>
        ))}
        {spans.length === 0 && <li className="text-xs text-ink-soft">No evidence spans on this version.</li>}
      </ul>
      {editable && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <TextArea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the EXACT source text (no summarizing)…" aria-label="Exact evidence text" />
          <div className="grid gap-2">
            <TextInput value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section heading" aria-label="Section heading" />
            <TextInput value={page} onChange={(e) => setPage(e.target.value)} placeholder="Page (e.g. 14)" aria-label="Page" />
            <GhostButton
              onClick={() => {
                if (!text.trim() || (!section.trim() && !page.trim())) return;
                update((r) => {
                  const span = makeSpan({
                    referenceVersionId: versionId,
                    exactText: text.trim(),
                    locator: { sectionHeading: section.trim() || undefined, page: page.trim() || undefined },
                    locale: "en",
                    sectionPath: section.trim() || undefined,
                    createdAt: NOW_ISO(),
                  });
                  return { ...r, spans: [...r.spans, span] };
                });
                setText(""); setSection(""); setPage("");
              }}
            >
              {copy.references.addSpan}
            </GhostButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- claim card

function ClaimCard({
  registry,
  claim,
  update,
}: {
  registry: ReferenceRegistry;
  claim: CuratedClaim;
  update: (fn: (r: ReferenceRegistry) => ReferenceRegistry) => void;
}) {
  const citations = claimCitations(registry, claim);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [elig, setElig] = useState<ReturnType<typeof evaluateAuthoritativeEligibility> | null>(null);
  const [ctxRisk, setCtxRisk] = useState<GuidanceRisk>("developmental");
  const [ctxDomain, setCtxDomain] = useState("child development");
  const [ctxJur, setCtxJur] = useState("US");

  const guard = evaluateApprovalGuard(claim, registry.evidenceLinks.filter((l) => l.claimId === claim.id), registry.spans, checklist);

  const setStatus = (to: ClaimStatus) =>
    update((r) => ({
      ...r,
      claims: r.claims.map((c) => (c.id === claim.id ? { ...c, status: to, updatedAt: NOW_ISO() } : c)),
    }));

  function runEligibility() {
    const payload = buildClaimPayload(registry, claim);
    if (!payload) return;
    setElig(
      evaluateAuthoritativeEligibility(payload, {
        risk: ctxRisk,
        domain: ctxDomain || undefined,
        jurisdiction: ctxJur || undefined,
        now: new Date(),
      }),
    );
  }

  return (
    <li className="rounded-xl border border-ink/15 bg-cream/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusTone[claim.status]}`}>
          {claim.status}
        </span>
        <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">{claim.claimType}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${claim.interpretationLevel === "editorial-inference" ? "border-tomato/50 text-tomato-deep" : "border-ink/20 text-ink-soft"}`}>
          {claim.interpretationLevel}
        </span>
        <span className="ml-auto text-[11px] text-ink-soft">v{claim.version} · {claim.editorHandle}</span>
      </div>

      <p className="mt-2 font-semibold">{claim.statement}</p>
      <p className="mt-1 text-xs text-ink-soft">
        Domains: {claim.subjectDomains.join(", ")} · Jurisdiction: {claim.jurisdiction ?? "—"} · Risks: {claim.riskCategories.join(", ")} · {claim.applicabilityScope}
      </p>
      <p className="mt-1 text-xs text-ink-soft"><span className="font-bold">Limitations:</span> {claim.limitations}</p>

      {/* Evidence citations — travel with the claim */}
      <div className="mt-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">Cited evidence</p>
        <ul className="mt-1 space-y-1">
          {citations.map(({ link, span }) => (
            <li key={link.id} className="rounded-lg border border-ink/15 bg-paper p-2 text-xs">
              <span className="rounded bg-sage-soft px-1.5 py-0.5 font-bold text-sage-deep">{link.relation}</span>{" "}
              <span className="italic">&ldquo;{span.exactText}&rdquo;</span>
              <span className="text-ink-soft"> — {span.locator.sectionHeading ?? span.sectionPath ?? ""} {span.locator.page ? `p.${span.locator.page}` : ""} {citationIsComplete(span) ? "" : "(incomplete)"}</span>
            </li>
          ))}
          {citations.length === 0 && <li className="text-xs text-ink-soft">No evidence linked — link a `supports` span before review.</li>}
        </ul>
        <LinkEvidenceForm registry={registry} claim={claim} update={update} />
      </div>

      {/* Review checklist */}
      <details className="mt-3 rounded-lg border border-ink/15 bg-paper p-3">
        <summary className="cursor-pointer text-sm font-bold text-sage-deep">{copy.references.reviewHeading}</summary>
        <div className="mt-2 space-y-1">
          {REVIEW_CHECKLIST.map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!checklist[item.key]}
                onChange={(e) => setChecklist((c) => ({ ...c, [item.key]: e.target.checked }))}
                className="size-4 accent-sage"
              />
              {item.label}
            </label>
          ))}
        </div>
        {!guard.canApprove && (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[11px] text-tomato-deep">
            {guard.blockers.slice(0, 4).map((b) => <li key={b}>{b}</li>)}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <PrimaryButton
            disabled={!guard.canApprove || !canTransition(claim.status, "approved")}
            onClick={() =>
              update((r) => ({
                ...r,
                claims: r.claims.map((c) =>
                  c.id === claim.id
                    ? { ...c, status: "approved", reviewChecklist: checklist, updatedAt: NOW_ISO() }
                    : c,
                ),
              }))
            }
          >
            {copy.references.approve}
          </PrimaryButton>
          {canTransition(claim.status, "needs-revision") && (
            <GhostButton onClick={() => setStatus("needs-revision")}>{copy.references.returnRevision}</GhostButton>
          )}
          {canTransition(claim.status, "superseded") && (
            <GhostButton onClick={() => setStatus("superseded")}>{copy.references.supersede}</GhostButton>
          )}
          {canTransition(claim.status, "withdrawn") && (
            <GhostButton danger onClick={() => setStatus("withdrawn")}>{copy.references.withdraw}</GhostButton>
          )}
        </div>
        <p className="mt-2 text-[11px] text-ink-soft">{copy.references.approvedScopeNote}</p>
      </details>

      {/* Eligibility inspector */}
      <details className="mt-2 rounded-lg border border-ink/15 bg-paper p-3">
        <summary className="cursor-pointer text-sm font-bold text-sage-deep">{copy.references.eligibilityHeading}</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Field label="Risk" htmlFor={`er-${claim.id}`}>
            <Select id={`er-${claim.id}`} value={ctxRisk} onChange={(v) => setCtxRisk(v as GuidanceRisk)} options={riskOptions.map((r) => ({ value: r, label: r }))} />
          </Field>
          <Field label="Domain" htmlFor={`ed-${claim.id}`}>
            <TextInput id={`ed-${claim.id}`} value={ctxDomain} onChange={(e) => setCtxDomain(e.target.value)} />
          </Field>
          <Field label="Jurisdiction" htmlFor={`ej-${claim.id}`}>
            <TextInput id={`ej-${claim.id}`} value={ctxJur} onChange={(e) => setCtxJur(e.target.value)} />
          </Field>
        </div>
        <div className="mt-2">
          <GhostButton onClick={runEligibility}>{copy.references.checkEligibility}</GhostButton>
        </div>
        {elig && (
          <div className="mt-2">
            <p className={`text-sm font-bold ${elig.eligible ? "text-sage-deep" : "text-tomato-deep"}`}>
              {elig.eligible ? "Eligible — may satisfy authoritative support in this scope." : "Not eligible for authoritative support."}
            </p>
            <ul className="mt-1 space-y-0.5 text-[11px]">
              {elig.checks.map((c) => (
                <li key={c.key} className={c.pass ? "text-ink-soft" : "text-tomato-deep"}>
                  {c.pass ? "✓" : "✗"} {c.label} — {c.detail}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link href="/studio/intelligence" className="mt-3 inline-block text-xs font-bold text-sage-deep underline decoration-sage decoration-2 underline-offset-2">
          {copy.references.openExplorer}
        </Link>
      </details>
    </li>
  );
}

// ------------------------------------------------------------- small forms

function LinkEvidenceForm({
  registry,
  claim,
  update,
}: {
  registry: ReferenceRegistry;
  claim: CuratedClaim;
  update: (fn: (r: ReferenceRegistry) => ReferenceRegistry) => void;
}) {
  const spans = registry.spans.filter((s) => s.referenceVersionId === claim.dependsOnVersionId);
  const [spanId, setSpanId] = useState(spans[0]?.id ?? "");
  const [relation, setRelation] = useState<"supports" | "qualifies" | "limits" | "defines">("supports");
  if (spans.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2">
      <Field label="Evidence span" htmlFor={`ls-${claim.id}`}>
        <Select id={`ls-${claim.id}`} value={spanId} onChange={setSpanId} options={spans.map((s) => ({ value: s.id, label: s.exactText.slice(0, 40) + "…" }))} />
      </Field>
      <Field label="Relation" htmlFor={`lr-${claim.id}`}>
        <Select id={`lr-${claim.id}`} value={relation} onChange={(v) => setRelation(v as typeof relation)} options={[
          { value: "supports", label: "supports" }, { value: "defines", label: "defines" },
          { value: "qualifies", label: "qualifies" }, { value: "limits", label: "limits" },
        ]} />
      </Field>
      <GhostButton
        onClick={() =>
          update((r) => {
            const link = makeEvidenceLink({ claimId: claim.id, evidenceSpanId: spanId, relation, createdAt: NOW_ISO() });
            if (r.evidenceLinks.some((l) => l.id === link.id)) return r;
            const claims = r.claims.map((c) =>
              c.id === claim.id && c.status === "draft" ? { ...c, status: "evidence-linked" as const } : c,
            );
            return { ...r, evidenceLinks: [...r.evidenceLinks, link], claims };
          })
        }
      >
        {copy.references.linkEvidence}
      </GhostButton>
    </div>
  );
}

function AddVersionForm({
  sourceId,
  update,
}: {
  sourceId: string;
  update: (fn: (r: ReferenceRegistry) => ReferenceRegistry) => void;
}) {
  const [label, setLabel] = useState("");
  const [text, setText] = useState("");
  const [staled, setStaled] = useState<string[] | null>(null);
  return (
    <div className="mt-3 rounded-lg border border-dashed border-ink/30 bg-cream p-3">
      <p className="text-xs font-bold">{copy.references.addVersion}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Version label (e.g. 2027 edition)" aria-label="Version label" />
        <TextArea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="New source text…" aria-label="New source text" />
      </div>
      <div className="mt-2">
        <GhostButton
          onClick={() => {
            if (!label.trim() || !text.trim()) return;
            update((r) => {
              const res = addVersion(r, { sourceId, versionLabel: label.trim(), sourceText: text.trim(), enteredDate: NOW_ISO() });
              setStaled(res.staledClaimIds);
              return res.registry;
            });
            setLabel(""); setText("");
          }}
        >
          Add immutable version
        </GhostButton>
      </div>
      {staled && (
        <p className="mt-2 text-[11px] text-tomato-deep">
          {staled.length > 0
            ? `New version added. ${staled.length} dependent claim(s) marked needs-revision — approval is NOT transferred.`
            : "New version added. No dependent claims to re-review."}
        </p>
      )}
    </div>
  );
}

function AssessmentEditor({
  registry,
  sourceId,
  update,
}: {
  registry: ReferenceRegistry;
  sourceId: string;
  update: (fn: (r: ReferenceRegistry) => ReferenceRegistry) => void;
}) {
  const existing = assessmentForSource(registry, sourceId);
  const [domains, setDomains] = useState((existing?.recognizedDomains ?? []).join(", "));
  const [jur, setJur] = useState((existing?.recognizedJurisdictions ?? []).join(", "));
  const [risks, setRisks] = useState((existing?.supportedRiskCategories ?? []).join(", "));
  const [due, setDue] = useState(existing?.reviewDueDate ?? "");
  const [status, setStatus] = useState<string>(existing?.status ?? "unassessed");

  return (
    <details className="mt-3 rounded-lg border border-ink/15 bg-paper p-3">
      <summary className="cursor-pointer text-sm font-bold text-sage-deep">Edit scoped assessment</summary>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Field label="Status" htmlFor={`as-${sourceId}`}>
          <Select id={`as-${sourceId}`} value={status} onChange={setStatus} options={[
            { value: "unassessed", label: "unassessed" },
            { value: "approved-for-scope", label: "approved-for-scope" },
            { value: "needs-review", label: "needs-review" },
            { value: "rejected-for-authoritative-use", label: "rejected-for-authoritative-use" },
            { value: "expired", label: "expired" },
          ]} />
        </Field>
        <Field label="Review due (YYYY-MM-DD)" htmlFor={`ad-${sourceId}`}>
          <TextInput id={`ad-${sourceId}`} value={due} onChange={(e) => setDue(e.target.value)} placeholder="2027-01-01" />
        </Field>
        <Field label="Recognized domains (comma-sep)" htmlFor={`adm-${sourceId}`}>
          <TextInput id={`adm-${sourceId}`} value={domains} onChange={(e) => setDomains(e.target.value)} />
        </Field>
        <Field label="Recognized jurisdictions (comma-sep, or 'global')" htmlFor={`aj-${sourceId}`}>
          <TextInput id={`aj-${sourceId}`} value={jur} onChange={(e) => setJur(e.target.value)} />
        </Field>
        <Field label="Supported risk categories (comma-sep)" htmlFor={`ar-${sourceId}`}>
          <TextInput id={`ar-${sourceId}`} value={risks} onChange={(e) => setRisks(e.target.value)} />
        </Field>
      </div>
      <div className="mt-2">
        <GhostButton
          onClick={() =>
            update((r) => {
              const parse = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
              const next = {
                id: existing?.id ?? `assess:${sourceId}`,
                sourceId,
                status: status as never,
                recognizedDomains: parse(domains),
                recognizedJurisdictions: parse(jur),
                supportedRiskCategories: parse(risks) as never,
                intendedAudience: existing?.intendedAudience ?? "Parents and caregivers",
                effectiveScope: existing?.effectiveScope ?? "Scoped editorial assessment.",
                limitations: existing?.limitations ?? "Authoritative only within the recorded scope.",
                assessorHandle: "editorial-desk",
                assessmentDate: NOW_ISO(),
                reviewDueDate: due || undefined,
              };
              return {
                ...r,
                assessments: existing
                  ? r.assessments.map((a) => (a.id === existing.id ? next : a))
                  : [...r.assessments, next],
              };
            })
          }
        >
          Save assessment (within scope)
        </GhostButton>
      </div>
    </details>
  );
}

function DraftClaimForm({
  registry,
  sourceId,
  update,
}: {
  registry: ReferenceRegistry;
  sourceId: string;
  update: (fn: (r: ReferenceRegistry) => ReferenceRegistry) => void;
}) {
  const version = versionsForSource(registry, sourceId).find((v) => v.status === "active");
  const [statement, setStatement] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("developmental");
  const [interp, setInterp] = useState<InterpretationLevel>("faithful-paraphrase");
  const [risk, setRisk] = useState<GuidanceRisk>("developmental");
  const [domains, setDomains] = useState("");
  const [jur, setJur] = useState("US");
  const [applic, setApplic] = useState("");
  const [limits, setLimits] = useState("");

  if (!version) {
    return <p className="mt-3 text-xs text-ink-soft">Add an active version before drafting claims.</p>;
  }

  return (
    <details className="mt-3 rounded-lg border border-dashed border-ink/30 bg-cream p-3">
      <summary className="cursor-pointer text-sm font-bold text-sage-deep">{copy.references.addClaim}</summary>
      <div className="mt-2 space-y-2">
        <TextArea rows={2} value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="Claim statement (an editorial proposition — not the source text)…" aria-label="Claim statement" />
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="Type" htmlFor="dc-type">
            <Select id="dc-type" value={claimType} onChange={(v) => setClaimType(v as ClaimType)} options={claimTypeOptions.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Interpretation" htmlFor="dc-interp">
            <Select id="dc-interp" value={interp} onChange={(v) => setInterp(v as InterpretationLevel)} options={interpretationOptions} />
          </Field>
          <Field label="Risk" htmlFor="dc-risk">
            <Select id="dc-risk" value={risk} onChange={(v) => setRisk(v as GuidanceRisk)} options={riskOptions.map((r) => ({ value: r, label: r }))} />
          </Field>
          <Field label="Subject domains (comma-sep)" htmlFor="dc-dom">
            <TextInput id="dc-dom" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="child development" />
          </Field>
          <Field label="Jurisdiction" htmlFor="dc-jur">
            <TextInput id="dc-jur" value={jur} onChange={(e) => setJur(e.target.value)} />
          </Field>
          <Field label="Applicability" htmlFor="dc-app">
            <TextInput id="dc-app" value={applic} onChange={(e) => setApplic(e.target.value)} placeholder="US families with preschoolers" />
          </Field>
        </div>
        <TextInput value={limits} onChange={(e) => setLimits(e.target.value)} placeholder="Stated limitations" aria-label="Limitations" />
        <GhostButton
          onClick={() => {
            if (!statement.trim()) return;
            update((r) => {
              const id = makeClaimId("editorial-desk", statement.trim());
              if (r.claims.some((c) => c.id === id)) return r;
              const claim: CuratedClaim = {
                id,
                statement: statement.trim(),
                claimType,
                interpretationLevel: interp,
                locale: "en",
                riskCategories: [risk],
                subjectDomains: domains.split(",").map((s) => s.trim()).filter(Boolean),
                intendedAudience: "Parents and caregivers",
                householdCircumstances: [],
                constraints: [],
                jurisdiction: jur.trim() || undefined,
                applicabilityScope: "scoped",
                applicability: applic.trim(),
                exclusions: [],
                limitations: limits.trim(),
                status: "draft",
                version: 1,
                dependsOnVersionId: version.id,
                editorHandle: "editorial-desk",
                createdAt: NOW_ISO(),
                updatedAt: NOW_ISO(),
              };
              return { ...r, claims: [...r.claims, claim] };
            });
            setStatement(""); setApplic(""); setLimits(""); setDomains("");
          }}
        >
          Create draft claim
        </GhostButton>
        <p className="text-[11px] text-ink-soft">Claims start as drafts. Link evidence, run the checklist, then approve — nothing is auto-approved.</p>
      </div>
    </details>
  );
}

function NewSourceForm({
  update,
  onCreated,
}: {
  update: (fn: (r: ReferenceRegistry) => ReferenceRegistry) => void;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [publisher, setPublisher] = useState("");
  const [title, setTitle] = useState("");
  const [domains, setDomains] = useState("");
  const [jur, setJur] = useState("US");

  if (!open) {
    return <GhostButton onClick={() => setOpen(true)}>+ {copy.references.addSource}</GhostButton>;
  }
  return (
    <div className="rounded-xl border border-dashed border-ink/30 bg-cream p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Publisher name" htmlFor="ns-pub"><TextInput id="ns-pub" value={publisher} onChange={(e) => setPublisher(e.target.value)} /></Field>
        <Field label="Source title" htmlFor="ns-title"><TextInput id="ns-title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Subject domains (comma-sep)" htmlFor="ns-dom"><TextInput id="ns-dom" value={domains} onChange={(e) => setDomains(e.target.value)} /></Field>
        <Field label="Jurisdiction" htmlFor="ns-jur"><TextInput id="ns-jur" value={jur} onChange={(e) => setJur(e.target.value)} /></Field>
      </div>
      <div className="mt-2 flex gap-2">
        <PrimaryButton
          disabled={!publisher.trim() || !title.trim()}
          onClick={() => {
            const pubId = `pub:${slug(publisher)}`;
            const srcId = `src:${slug(publisher)}:${slug(title)}`;
            update((r) => {
              if (r.sources.some((s) => s.id === srcId)) return r;
              return {
                ...r,
                publishers: r.publishers.some((p) => p.id === pubId)
                  ? r.publishers
                  : [...r.publishers, { id: pubId, name: publisher.trim(), organizationType: "community-source", locale: "en", jurisdiction: jur.trim() || undefined }],
                sources: [...r.sources, {
                  id: srcId, title: title.trim(), publisherId: pubId, category: "guideline",
                  subjectDomains: domains.split(",").map((s) => s.trim()).filter(Boolean),
                  intendedAudience: "General", locale: "en",
                  jurisdictions: jur.trim() ? [jur.trim()] : [], status: "active",
                }],
              };
            });
            onCreated(srcId);
            setOpen(false); setPublisher(""); setTitle(""); setDomains("");
          }}
        >
          Create source
        </PrimaryButton>
        <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
      </div>
      <p className="mt-1 text-[11px] text-ink-soft">A new source has no authority until you enter a version, evidence, a claim, a scoped assessment, and pass review.</p>
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}
