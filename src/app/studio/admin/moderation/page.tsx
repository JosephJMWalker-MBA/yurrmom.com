import type { Metadata } from "next";
import { ModerationQueue } from "@/ui/studio/admin/moderation-queue";

export const metadata: Metadata = {
  title: "Moderation",
  description: "Deterministic moderation queue with rationale and append-only audit.",
};

export default function ModerationPage() {
  return <ModerationQueue />;
}
