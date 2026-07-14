import type { Metadata } from "next";
import { ImpactReports } from "@/components/reports/impact-reports";

export const metadata: Metadata = {
  title: "Impact Reports",
  description: "Review DORA, SLO, reliability, customer-impact, and engineering-efficiency outcomes.",
};

export default function ReportsPage() {
  return <ImpactReports />;
}
