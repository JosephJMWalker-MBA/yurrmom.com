import type { Metadata } from "next";
import { TaxonomyAdmin } from "@/ui/studio/admin/taxonomy-admin";

export const metadata: Metadata = {
  title: "Taxonomy",
  description: "Manage platform taxonomy. Edits never rewrite canonical systems.",
};

export default function TaxonomyAdminPage() {
  return <TaxonomyAdmin />;
}
