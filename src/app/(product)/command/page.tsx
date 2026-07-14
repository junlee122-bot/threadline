import type { Metadata } from "next";
import { CommandCenter } from "@/components/command/command-center";

export const metadata: Metadata = {
  title: "Command Center",
  description: "A live, evidence-backed briefing across code, runtime, and customer impact.",
};

export default function CommandPage() {
  return <CommandCenter />;
}
