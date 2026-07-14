import type { Metadata } from "next";
import { ChangeIntelligence } from "@/components/changes/change-intelligence";

export const metadata: Metadata = {
  title: "Change Intelligence",
  description: "Inspect explainable change risk, impact paths, evidence, and review readiness.",
};

export default function ChangesPage() {
  return <ChangeIntelligence />;
}
