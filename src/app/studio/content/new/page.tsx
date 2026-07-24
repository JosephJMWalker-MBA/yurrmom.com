import type { Metadata } from "next";
import { ContentCreate } from "@/ui/studio/content-create";

export const metadata: Metadata = {
  title: "New content draft",
  description: "Assemble a channel draft from selected canonical material with fixed framing — never invented, never a model.",
};

export default function NewContentPage() {
  return <ContentCreate />;
}
