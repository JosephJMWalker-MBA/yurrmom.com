import type { Metadata } from "next";
import { ContentOverview } from "@/ui/studio/content-overview";

export const metadata: Metadata = {
  title: "Content Studio",
  description:
    "Turn a canonical household system into editable, traceable channel drafts. Nothing publishes — export or copy, then post yourself.",
};

export default function ContentStudioPage() {
  return <ContentOverview />;
}
