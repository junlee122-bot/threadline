import type { Metadata } from "next";
import { AgentOperations } from "@/components/agents/agent-operations";

export const metadata: Metadata = {
  title: "Agent Operations",
  description: "Supervise inspectable agent missions, runtime state, evidence, and human approval gates.",
};

export default function AgentsPage() {
  return <AgentOperations />;
}
