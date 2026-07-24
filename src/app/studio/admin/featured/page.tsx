import type { Metadata } from "next";
import { FeaturedAdmin } from "@/ui/studio/admin/featured-admin";

export const metadata: Metadata = {
  title: "Featured",
  description: "Curate featured placements. Featuring never mutates canonical content.",
};

export default function FeaturedAdminPage() {
  return <FeaturedAdmin />;
}
