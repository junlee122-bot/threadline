import type { Metadata } from "next";
import { CommandCenter } from "@/components/command/command-center";

export const metadata: Metadata = {
  title: "Command Center",
  description: "A time-aware, evidence-backed sample briefing across code, runtime, and modeled customer impact.",
};

export default function CommandPage() {
  return <CommandCenter />;
}
