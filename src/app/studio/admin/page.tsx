import type { Metadata } from "next";
import { AdminOverview } from "@/ui/studio/admin/admin-overview";

export const metadata: Metadata = {
  title: "Overview",
  description: "Local-device moderation and curation overview.",
};

export default function AdminOverviewPage() {
  return <AdminOverview />;
}
