import type { Metadata } from "next";
import { ContentEditor } from "@/ui/studio/content-editor";

export const metadata: Metadata = {
  title: "Edit content draft",
  description: "Edit a channel draft. The canonical system stays the source of truth; every block traces to it.",
};

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContentEditor assetId={decodeURIComponent(id)} />;
}
