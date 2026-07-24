import type { Metadata } from "next";
import { RoastAdmin } from "@/ui/studio/admin/roast-admin";

export const metadata: Metadata = {
  title: "Roast",
  description: "Manage roast prompts, fiction provenance, and activation/retirement.",
};

export default function RoastAdminPage() {
  return <RoastAdmin />;
}
