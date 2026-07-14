"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  ChevronDown,
  CircleCheck,
  Clock3,
  Code2,
  ExternalLink,
  FileSearch,
  GitCommitHorizontal,
  GitPullRequest,
  MoreHorizontal,
  Radio,
  ShieldAlert,
  Sparkles,
  TimerReset,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { CausalGraph, type GraphEdge, type GraphNode } from "@/components/graph/causal-graph";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

const commandNodes: GraphNode[] = [
  { id: "pr", label: "PR #1842", detail: "retry tax quote", kind: "pull-request", x: 8, y: 30 },
  { id: "deploy", label: "deploy 2.18.0", detail: "09:12 · prod", kind: "deployment", status: "healthy", x: 27, y: 30 },
  { id: "flag", label: "instant-tax-v2", detail: "100% exposure", kind: "flag", status: "warning", x: 45, y: 21 },
  { id: "service", label: "checkout-api", detail: "p95 +171%", kind: "service", status: "critical", x: 61, y: 45 },
  { id: "trace", label: "tax-adapter", detail: "pool saturated", kind: "runtime", status: "critical", x: 79, y: 23 },
  { id: "impact", label: "conversion", detail: "−7.3%", kind: "customer", status: "critical", x: 91, y: 67 },
];

const commandEdges: GraphEdge[] = [
  { id: "1", source: "pr", target: "deploy", state: "observed" },
  { id: "2", source: "deploy", target: "flag", state: "observed" },
  { id: "3", source: "flag", target: "service", state: "observed" },
  { id: "4", source: "service", target: "trace", state: "observed" },
  { id: "5", source: "service", target: "impact", state: "inferred" },
];

const nodeNotes: Record<string, string> = {
  pr: "Retry count increased from one to three in the tax quote path.",
  deploy: "Version 2.18.0 was healthy at rollout completion, before flag exposure changed.",
  flag: "Exposure doubled six minutes after the deploy and three minutes before degradation.",
  service: "Traffic is steady, but p95 and errors both moved outside baseline.",
  trace: "92% of sampled slow traces wait for a connection to tax-adapter.",
  impact: "The conversion decline begins in the same window; attribution remains inferred.",
};

type ToneKey = "danger" | "warning" | "inference" | "success" | "signal" | "primary";

const attention: Array<{ id: string; icon: LucideIcon; tone: ToneKey; label: string; title: string; meta: string; href: string }> = [
  { id: "inc", icon: ShieldAlert, tone: "danger", label: "SEV-2", title: "Checkout latency elevated", meta: "Commerce Core · 24m", href: "/incidents/inc-2471" },
  { id: "queue", icon: TimerReset, tone: "warning", label: "Backlog", title: "Catalog indexing is 14m behind", meta: "Storefront · 7m ago", href: "/map" },
  { id: "deploy", icon: GitPullRequest, tone: "inference", label: "Approval", title: "High-risk payments deployment", meta: "Payments · waiting", href: "/changes" },
];

const riskyChanges = [
  { id: "#1842", title: "Retry tax quote requests", service: "checkout-api", risk: "High", reason: "Recent incident", status: "Production", author: "M. Chen" },
  { id: "#2091", title: "Parallelize payment capture", service: "payments-worker", risk: "High", reason: "High fan-out", status: "Awaiting approval", author: "S. Park" },
  { id: "#873", title: "Tune search index batches", service: "catalog-indexer", risk: "Medium", reason: "Coverage gap", status: "Canary 10%", author: "R. Diaz" },
  { id: "#144", title: "Cache inventory locations", service: "inventory-service", risk: "Low", reason: "Well covered", status: "Production", author: "A. Khan" },
];

const agentActivity: Array<{ icon: LucideIcon; title: string; detail: string; tone: ToneKey; time: string }> = [
  { icon: Bot, title: "Checkout mitigation", detail: "Awaiting approval", tone: "inference", time: "now" },
  { icon: FileSearch, title: "Correlate slow traces", detail: "Completed · 7 sources", tone: "success", time: "42s" },
  { icon: Code2, title: "Payments risk review", detail: "Analyzing 18 files", tone: "signal", time: "2m" },
  { icon: CircleCheck, title: "Catalog queue check", detail: "Completed safely", tone: "success", time: "8m" },
];

const toneText: Record<ToneKey, string> = { danger: "text-danger", warning: "text-warning", inference: "text-inference", success: "text-success", signal: "text-signal", primary: "text-primary" };
export function CommandCenter() {
  const [selectedNode, setSelectedNode] = useState(commandNodes[3]);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [briefingDismissed, setBriefingDismissed] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  return (
    <div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Tuesday · 14 July"
        title="Good evening, Jun"
        description="One customer-facing regression needs attention. Everything else is within expected operating range."
        actions={
          <>
            <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-panel-soft px-3 font-mono text-[9px] text-muted"><Clock3 aria-hidden="true" className="size-3.5" />Last 6 hours<ChevronDown aria-hidden="true" className="size-3" /></span>
            <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-panel-soft px-3 font-mono text-[9px] text-muted"><Radio aria-hidden="true" className="size-3.5 text-success" />Live</span>
          </>
        }
      />

      {!briefingDismissed && (
        <section aria-labelledby="briefing-title" className="mt-7 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(310px,.7fr)]">
          <article className="panel relative overflow-hidden border-primary/15 p-5 sm:p-7">
            <div aria-hidden="true" className="absolute end-[-100px] top-[-180px] size-[420px] rounded-full bg-primary/[0.045] blur-3xl" />
            <button type="button" onClick={() => setBriefingDismissed(true)} className="absolute end-3 top-3 grid size-8 place-items-center rounded-md text-muted hover:bg-white/[0.04] hover:text-foreground" aria-label="Dismiss briefing"><X aria-hidden="true" className="size-3.5" /></button>
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2"><span className="grid size-8 place-items-center rounded-lg border border-primary/20 bg-primary/[0.07] text-primary"><Sparkles aria-hidden="true" className="size-4" /></span><p className="eyebrow text-primary">Threadline briefing</p><StatusPill tone="success">High confidence</StatusPill><span className="font-mono text-[8px] text-muted">updated 42s ago</span></div>
              <h2 id="briefing-title" className="mt-5 max-w-3xl text-balance text-xl font-medium leading-7 tracking-[-0.028em] sm:text-[1.55rem] sm:leading-9">Checkout is the only customer-facing regression.</h2>
              <p className="mt-3 max-w-3xl text-xs leading-6 text-muted sm:text-sm">Since 09:18, p95 latency is up 171% and conversion is down 7.3%. The strongest shared change is the <code className="rounded bg-white/[0.045] px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">instant-tax-v2</code> rollout on <code className="rounded bg-white/[0.045] px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">checkout-api@2.18.0</code>.</p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link href="/incidents/inc-2471" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-[11px] font-semibold text-primary-foreground">Open incident<ArrowRight aria-hidden="true" className="size-3.5" /></Link>
                <button type="button" onClick={() => setEvidenceOpen((open) => !open)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-[11px] text-muted hover:text-foreground"><FileSearch aria-hidden="true" className="size-3.5" />Inspect evidence</button>
                <button type="button" onClick={() => setQuestionOpen((open) => !open)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-[11px] text-muted hover:text-foreground"><Bot aria-hidden="true" className="size-3.5" />Ask a follow-up</button>
              </div>
              {evidenceOpen && (
                <div className="mt-5 grid gap-2 border-t border-border pt-5 sm:grid-cols-3">
                  {[[GitCommitHorizontal,"GitHub","PR #1842 · retry policy"],[Activity,"OpenTelemetry","34 slow trace samples"],[UsersRound,"Commerce","Conversion cohort · KST"]].map(([Icon,label,detail]) => { const I = Icon as typeof Activity; return <div key={label as string} className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3"><I aria-hidden="true" className="size-4 text-signal" /><span><span className="block text-[10px] font-medium">{label as string}</span><span className="block font-mono text-[8px] text-muted">{detail as string}</span></span></div>; })}
                </div>
              )}
              {questionOpen && (
                <div className="mt-5 border-t border-border pt-5">
                  <form onSubmit={(event) => { event.preventDefault(); if (question.trim()) { setAnswer("The rollout is the strongest shared change because flag exposure, trace saturation, SLO burn, and conversion all moved in the same seven-minute window. Third-party latency is the main alternative."); setQuestion(""); } }} className="flex gap-2">
                    <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this briefing…" aria-label="Ask about this briefing" className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-xs outline-none placeholder:text-muted focus:border-primary/40" />
                    <button type="submit" className="h-10 rounded-md bg-foreground px-4 text-[10px] font-semibold text-background">Ask</button>
                  </form>
                  {answer && <p role="status" className="mt-3 rounded-md border border-inference/15 bg-inference/[0.04] p-3 text-[10px] leading-5 text-muted"><span className="me-2 font-mono text-inference">THREADLINE</span>{answer}</p>}
                </div>
              )}
            </div>
          </article>

          <article className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="eyebrow">Active incident</p><p className="mt-1 text-xs font-medium">INC-2471</p></div><StatusPill tone="danger" dot>SEV-2</StatusPill></div>
            <div className="p-5">
              <p className="text-sm font-medium">Checkout latency elevated</p>
              <p className="mt-2 text-[10px] leading-5 text-muted">Investigating · Commerce Core · 24 minutes</p>
              <div className="mt-5 grid grid-cols-2 gap-2"><MiniStat label="p95 latency" value="1.84 s" tone="danger" /><MiniStat label="SLO burn" value="8.4×" tone="warning" /></div>
              <Sparkline points={[0.68,0.7,0.69,0.74,1.1,1.84,1.78,1.7]} tone="danger" label="Checkout p95 latency rose sharply" className="mt-4 h-14" />
            </div>
            <Link href="/incidents/inc-2471" className="flex min-h-11 items-center justify-between border-t border-border px-5 text-[10px] text-muted hover:bg-white/[0.025] hover:text-foreground">Open Incident Room<ArrowRight aria-hidden="true" className="size-3.5" /></Link>
          </article>
        </section>
      )}

      <section aria-label="Workspace pulse" className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Active incidents" value="1 · SEV-2" change="1 new" direction="up" detail="7-day baseline · 0.6" points={[0,0,1,0,0,0,1]} tone="danger" />
        <MetricCard label="SLOs at risk" value="1 of 6" change="8.4× burn" direction="up" detail="checkout latency" points={[0.4,0.5,0.6,0.7,2.2,8.4]} tone="warning" />
        <MetricCard label="Changes in production" value="9" change="+3 today" direction="up" detail="36 deployments · 7d" points={[4,6,5,8,7,6,9]} tone="signal" />
        <MetricCard label="Est. customer impact" value="−$12.4k/hr" change="live model" direction="down" detail="commerce · 2m delay" points={[0,0,0,1.2,6.8,12.4]} tone="danger" />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(310px,.7fr)]">
        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-4 sm:px-5"><div><p className="text-xs font-medium">Live causal thread</p><p className="mt-0.5 font-mono text-[8px] text-muted">INC-2471 · production · 09:08–now</p></div><StatusPill tone="signal" className="ms-auto">7 connected signals</StatusPill><span className="grid size-8 place-items-center rounded-md text-muted" aria-label="Graph uses observed and inferred relationships" role="img"><MoreHorizontal aria-hidden="true" className="size-4" /></span></div>
          <div className="p-4 sm:p-5"><CausalGraph nodes={commandNodes} edges={commandEdges} selectedId={selectedNode.id} onSelect={setSelectedNode} /></div>
          <div className="grid gap-3 border-t border-border bg-panel-soft px-4 py-4 sm:grid-cols-[1fr_auto] sm:px-5"><div><div className="flex items-center gap-2"><StatusPill tone={selectedNode.status === "critical" ? "danger" : selectedNode.status === "warning" ? "warning" : "signal"}>Observed</StatusPill><span className="font-mono text-[8px] text-muted">{selectedNode.label}</span></div><p className="mt-2 text-xs leading-5 text-muted">{nodeNotes[selectedNode.id]}</p></div><Link href="/incidents/inc-2471" className="inline-flex h-9 items-center justify-center gap-2 self-end rounded-md border border-border px-3 text-[10px] text-muted hover:text-foreground">Inspect in incident<ExternalLink aria-hidden="true" className="size-3" /></Link></div>
        </section>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-medium">Attention queue</p><p className="mt-0.5 font-mono text-[8px] text-muted">Prioritized by customer impact</p></div><StatusPill tone="danger">3 items</StatusPill></div>
          <div className="divide-y divide-border">{attention.map((item) => { const Icon = item.icon; return <Link key={item.id} href={item.href} className="group flex gap-3 p-4 transition-colors hover:bg-white/[0.025]"><span className={cn("grid size-8 shrink-0 place-items-center rounded-md border border-border bg-panel-soft", toneText[item.tone])}><Icon aria-hidden="true" className="size-4" /></span><span className="min-w-0 flex-1"><span className={cn("font-mono text-[8px] uppercase", toneText[item.tone])}>{item.label}</span><span className="mt-1 block truncate text-[11px] font-medium group-hover:text-primary">{item.title}</span><span className="mt-1 block font-mono text-[8px] text-muted">{item.meta}</span></span><ArrowRight aria-hidden="true" className="mt-3 size-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" /></Link>; })}</div>
          <Link href="/changes" className="flex min-h-11 items-center justify-center gap-2 border-t border-border text-[10px] text-muted hover:text-foreground">View all attention items<ArrowRight aria-hidden="true" className="size-3" /></Link>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(310px,.7fr)]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-medium">Change impact</p><p className="mt-0.5 font-mono text-[8px] text-muted">Production and awaiting approval</p></div><Link href="/changes" className="font-mono text-[8px] text-primary hover:underline">View all</Link></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse"><thead><tr className="border-b border-border font-mono text-[8px] uppercase tracking-wider text-muted"><th className="px-5 py-2.5 text-start font-medium">Change</th><th className="px-3 py-2.5 text-start font-medium">Service</th><th className="px-3 py-2.5 text-start font-medium">Risk</th><th className="px-3 py-2.5 text-start font-medium">Why</th><th className="px-3 py-2.5 text-start font-medium">Status</th><th className="px-5 py-2.5 text-end font-medium">Author</th></tr></thead><tbody>{riskyChanges.map((change) => <tr key={change.id} className="border-b border-border/70 text-[10px] last:border-0 hover:bg-white/[0.018]"><td className="px-5 py-3.5"><span className="font-mono text-primary">{change.id}</span><span className="ms-2 text-foreground">{change.title}</span></td><td className="px-3 py-3.5 font-mono text-[9px] text-muted">{change.service}</td><td className="px-3 py-3.5"><StatusPill tone={change.risk === "High" ? "danger" : change.risk === "Medium" ? "warning" : "success"}>{change.risk}</StatusPill></td><td className="px-3 py-3.5 text-muted">{change.reason}</td><td className="px-3 py-3.5 text-muted">{change.status}</td><td className="px-5 py-3.5 text-end text-muted">{change.author}</td></tr>)}</tbody></table></div>
        </section>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-medium">Agent activity</p><p className="mt-0.5 font-mono text-[8px] text-muted">Explainable, human-supervised</p></div><Link href="/agents" className="font-mono text-[8px] text-primary hover:underline">Mission control</Link></div>
          <div className="divide-y divide-border">{agentActivity.map((run) => { const Icon = run.icon; return <div key={run.title} className="flex items-center gap-3 px-5 py-3.5"><span className={cn("grid size-7 place-items-center rounded-md bg-white/[0.035]", toneText[run.tone])}><Icon aria-hidden="true" className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-medium">{run.title}</span><span className="mt-0.5 block truncate font-mono text-[8px] text-muted">{run.detail}</span></span><span className="font-mono text-[8px] text-muted">{run.time}</span></div>; })}</div>
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: ToneKey }) { return <div className="rounded-md border border-border bg-panel-soft p-3"><p className="text-[9px] text-muted">{label}</p><p className={cn("mt-2 font-mono text-lg", toneText[tone])}>{value}</p></div>; }
