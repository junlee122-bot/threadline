import type { Metadata } from "next";
import { CrisisLab } from "@/components/lab/crisis-lab";

export const metadata: Metadata = {
  title: "Crisis Lab · FAULTLINE 047",
  description: "Command an eight-minute deterministic production incident with six decisions and three possible outcomes.",
};

export default function CrisisLabPage() {
  return <CrisisLab />;
}
