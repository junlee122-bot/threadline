import type { Metadata } from "next";
import { ImpactReports } from "@/components/reports/impact-reports";

export const metadata: Metadata = {
  title: "Impact Reports",
  description: "Inspect period-scoped sample reports, engineering effort models, and consistent JSON and CSV exports.",
};

export default function ReportsPage() {
  return <div className="mx-auto max-w-[1540px] p-4 sm:p-6 xl:p-8"><ImpactReports /></div>;
}
