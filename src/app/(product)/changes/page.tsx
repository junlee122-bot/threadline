import type { Metadata } from "next";
import { ChangeIntelligence } from "@/components/changes/change-intelligence";

export const metadata: Metadata = {
  title: "Change Intelligence",
  description: "Inspect explainable change risk, impact paths, evidence, and review readiness.",
};

export default function ChangesPage() {
  return <div className="mx-auto max-w-[1540px] p-4 sm:p-6 xl:p-8"><ChangeIntelligence /></div>;
}
