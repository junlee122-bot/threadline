import type { Metadata } from "next";
import { AgentOperations } from "@/components/agents/agent-operations";

export const metadata: Metadata = {
  title: "Agent Operations",
  description: "Supervise inspectable agent missions, runtime state, evidence, and human approval gates.",
};

export default function AgentsPage() {
  return <div className="mx-auto max-w-[1540px] p-4 sm:p-6 xl:p-8"><AgentOperations /></div>;
}
