import type { Metadata } from "next";
import { EvidenceExplorer } from "@/ui/studio/evidence-explorer";

export const metadata: Metadata = {
  title: "Evidence Explorer",
  description:
    "Deterministic, source-backed household-knowledge retrieval. Evidence with provenance — not a chatbot, not an answer generator.",
};

export default function IntelligencePage() {
  return <EvidenceExplorer />;
}
