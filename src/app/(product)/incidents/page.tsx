import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock3, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "Incidents",
  description: "Active and resolved incidents with evidence-backed causal narratives.",
};

const incidents = [
  {
    id: "INC-2471",
    slug: "inc-2471",
    title: "Checkout latency elevated",
    severity: "SEV-2",
    status: "Investigating",
    owner: "Commerce Core",
    duration: "24m",
    impact: "−7.3% conversion",
    points: [0.68, 0.7, 0.72, 1.1, 1.84, 1.72],
    active: true,
  },
  {
    id: "INC-2458",
    title: "Inventory reads stale in EU-West",
    severity: "SEV-3",
    status: "Resolved",
    owner: "Fulfillment",
    duration: "41m",
    impact: "2.1% stale reads",
    points: [0.3, 0.8, 2.1, 1.2, 0.5, 0.2],
    active: false,
  },
  {
    id: "INC-2439",
    title: "Payment webhook delivery delayed",
    severity: "SEV-3",
    status: "Resolved",
    owner: "Commerce Core",
    duration: "28m",
    impact: "1,284 delayed events",
    points: [0.1, 0.4, 1.6, 1.1, 0.4, 0.1],
    active: false,
  },
];

export default function IncidentsPage() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Operations"
        title="Incidents"
        description="Evidence, decisions, and recovery verification preserved as one inspectable timeline."
        actions={<span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-panel-soft px-3 font-mono text-[9px] text-muted"><Clock3 aria-hidden="true" className="size-3.5" />Last 30 days</span>}
      />
      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="panel p-5"><p className="text-[10px] text-muted">Active now</p><p className="mt-3 font-mono text-2xl">1</p><p className="mt-1 text-[9px] text-danger">SEV-2 · customer-facing</p></div>
        <div className="panel p-5"><p className="text-[10px] text-muted">Median time to recover</p><p className="mt-3 font-mono text-2xl">34m</p><p className="mt-1 text-[9px] text-success">↓ 18% from prior period</p></div>
        <div className="panel p-5"><p className="text-[10px] text-muted">Recovery verified</p><p className="mt-3 font-mono text-2xl">96%</p><p className="mt-1 text-[9px] text-muted">24 of 25 incidents</p></div>
      </section>
      <section className="panel mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-medium">Incident history</p><p className="mt-0.5 font-mono text-[8px] text-muted">Production · all teams</p></div><StatusPill>3 incidents</StatusPill></div>
        <div className="divide-y divide-border">
          {incidents.map((incident) => {
            const row = <IncidentRow incident={incident} />;
            return incident.active ? (
              <Link key={incident.id} href={`/incidents/${incident.slug}`} className="group grid gap-4 p-5 transition-colors hover:bg-white/[0.02] lg:grid-cols-[1.5fr_.7fr_.7fr_180px_auto] lg:items-center">
                {row}
              </Link>
            ) : (
              <article key={incident.id} className="group grid gap-4 p-5 transition-colors hover:bg-white/[0.02] lg:grid-cols-[1.5fr_.7fr_.7fr_180px_auto] lg:items-center">
                {row}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function IncidentRow({ incident }: { incident: (typeof incidents)[number] }) {
  return (
    <>
      <div className="flex min-w-0 gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg border ${incident.active ? "border-danger/20 bg-danger/[0.07] text-danger" : "border-success/20 bg-success/[0.05] text-success"}`}>
          {incident.active ? <ShieldAlert aria-hidden="true" className="size-4" /> : <Check aria-hidden="true" className="size-4" />}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="font-mono text-[9px] text-muted">{incident.id}</span><StatusPill tone={incident.active ? "danger" : "success"}>{incident.severity}</StatusPill></div>
          <h2 className="mt-1.5 truncate text-sm font-medium group-hover:text-primary">{incident.title}</h2>
        </div>
      </div>
      <div><p className="eyebrow">Status</p><p className={`mt-1.5 text-[10px] ${incident.active ? "text-warning" : "text-success"}`}>{incident.status}</p></div>
      <div><p className="eyebrow">Owner / duration</p><p className="mt-1.5 text-[10px] text-muted">{incident.owner} · {incident.duration}</p></div>
      <div><Sparkline points={incident.points} label={`${incident.title} impact trend`} tone={incident.active ? "danger" : "success"} className="h-10" /><p className="text-end font-mono text-[8px] text-muted">{incident.impact}</p></div>
      {incident.active ? <ArrowRight aria-hidden="true" className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /> : <span className="font-mono text-[8px] text-muted">Postmortem</span>}
    </>
  );
}
