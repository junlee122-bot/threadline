import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IncidentRoom } from "@/components/incident/incident-room";

export const metadata: Metadata = {
  title: "INC-2471 · Checkout latency elevated",
  description: "Replay an evidence-backed production incident from change to verified recovery.",
};

export function generateStaticParams() {
  return [{ id: "inc-2471" }];
}

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "inc-2471") notFound();
  return <IncidentRoom />;
}
