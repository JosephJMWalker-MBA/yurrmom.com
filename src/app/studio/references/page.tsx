import type { Metadata } from "next";
import { ReferenceDesk } from "@/ui/studio/reference-desk";

export const metadata: Metadata = {
  title: "Reference Desk",
  description:
    "Editorial registry for curated reference material — scoped authority, exact evidence, citations, review, and retrieval eligibility. Not a chatbot.",
};

export default function ReferencesPage() {
  return <ReferenceDesk />;
}
