"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Check, CheckCheck, ClipboardCheck, Clock3, Download, FileSearch, GitBranch, GitPullRequest, Layers3, LockKeyhole, MessageSquareText, Radar, ShieldCheck, Siren, Sparkles, Target } from "lucide-react";
import { CausalGraph, type GraphEdge, type GraphNode } from "@/components/graph/causal-graph";
import { EvidenceExplorer } from "@/components/evidence/evidence-explorer";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusPill } from "@/components/ui/status-pill";
import { getIncidentSnapshot, type IncidentSnapshot } from "@/lib/incident-replay";
import { cn } from "@/lib/utils";

type SnapshotMode = "investigating" | "verified";
type BriefQuestion = "cause" | "alternative" | "recovery";

const evidenceMap: Record<string, { id: string; source: string; description: string; state: "Observed" | "Inferred" }> = {
  pr: { id: "ev-pr-1842", source: "GitHub · 09:08 UTC", description: "The tax quote retry policy changed from one attempt to three. The code change is observed; its causal role still needs runtime evidence.", state: "Observed" },
  deploy: { id: "ev-deploy-2180", source: "Deployment record · 09:12 UTC", description: "All six checkout instances received version 2.18.0. The rollout initially passed health checks.", state: "Observed" },
  flag: { id: "ev-flag-instant-tax-v2", source: "Flag audit · 09:18 UTC", description: "Exposure increased from 50% to 100%. This source event records the expansion; the recovery snapshot also includes its later mitigation.", state: "Observed" },
  service: { id: "ev-metric-checkout", source: "SLO monitor · 09:22 UTC", description: "Checkout latency and errors rose while incoming traffic stayed within 2% of baseline. Peak p95 was 1.84 seconds.", state: "Observed" },
  trace: { id: "ev-trace-tax-7f91", source: "OpenTelemetry · 09:21:20 UTC", description: "The sample contains 34 spans. Across slow traces, 92% of delay is associated with tax-adapter connection acquisition.", state: "Observed" },
  impact: { id: "ev-commerce-conversion", source: "Commerce · 09:23 UTC", description: "Conversion declines in the latency window. The relationship to the rollout is an inference; revenue loss is a modeled estimate.", state: "Inferred" },
};

const edges: GraphEdge[] = [
  { id: "pr-deploy", source: "pr", target: "deploy", state: "observed" },
  { id: "deploy-flag", source: "deploy", target: "flag", state: "observed" },
  { id: "flag-service", source: "flag", target: "service", state: "inferred" },
  { id: "service-trace", source: "service", target: "trace", state: "observed" },
  { id: "service-impact", source: "service", target: "impact", state: "inferred" },
];

function graphFor(snapshot: IncidentSnapshot): GraphNode[] {
  return [
    { id: "pr", label: "PR #1842", detail: "retry policy ×3", kind: "pull-request", x: 11, y: 32 },
    { id: "deploy", label: "deploy 2.18.0", detail: "6 instances", kind: "deployment", status: "healthy", x: 34, y: 32 },
    { id: "flag", label: "instant-tax-v2", detail: snapshot.resolved ? "mitigated · 0%" : "100% exposure", kind: "flag", status: snapshot.resolved ? "healthy" : "warning", x: 57, y: 21 },
    { id: "service", label: "checkout-api", detail: `p95 ${snapshot.frame.latency.toFixed(2)} s`, kind: "service", status: snapshot.resolved ? "healthy" : "critical", x: 57, y: 63 },
    { id: "trace", label: "tax-adapter", detail: "observed pool wait", kind: "runtime", status: "warning", x: 85, y: 21 },
    { id: "impact", label: "conversion", detail: `${snapshot.frame.conversion.toFixed(1)}% · modeled link`, kind: "customer", status: "inferred", x: 85, y: 63 },
  ];
}

const questions: { id: BriefQuestion; label: string }[] = [
  { id: "cause", label: "Why this change?" },
  { id: "alternative", label: "What could disprove it?" },
  { id: "recovery", label: "What proves recovery?" },
];

const handoffItems = [
  { id: "scope", title: "Confirm customer scope", description: "Checkout and tax quotes; payments remain under observation.", icon: Target },
  { id: "control", title: "Review the change constraint", description: "Checkout rollouts need operator approval while the response is active.", icon: LockKeyhole },
  { id: "comms", title: "Read the next communication", description: "Confirm who will update Support and Commerce leadership.", icon: MessageSquareText },
];

export function CommandCenter() {
  const [mode, setMode] = useState<SnapshotMode>("investigating");
  const [selectedId, setSelectedId] = useState("service");
  const [question, setQuestion] = useState<BriefQuestion>("cause");
  const [checked, setChecked] = useState<Record<SnapshotMode, string[]>>({ investigating: [], verified: [] });
  const [acknowledged, setAcknowledged] = useState<Record<SnapshotMode, boolean>>({ investigating: false, verified: false });
  const [notice, setNotice] = useState("");
  const snapshot = getIncidentSnapshot(mode === "verified" ? 9 : 7);
  const { frame, resolved } = snapshot;
  const nodes = graphFor(snapshot);
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[3];
  const selectedEvidence = evidenceMap[selected.id];
  const ready = handoffItems.every((item) => checked[mode].includes(item.id));
  const incidentHref = `/incidents/inc-2471?at=${snapshot.step}`;

  function exportBrief() {
    const content = [
      "# THREADLINE · Operations handoff",
      `Sample workspace: Meridian Market · 14 July 2026, ${frame.time} UTC`,
      `Incident: INC-2471 · ${snapshot.status}`,
      `Commander: Maya Chen · Operator: J. Lee · Communications: S. Park`,
      `p95: ${frame.latency.toFixed(2)} s · Errors: ${frame.errors.toFixed(1)}% · Conversion: ${frame.conversion.toFixed(1)}%`,
      resolved ? "Recovery verified from 09:35 to 09:40 UTC. Maintain the observation window." : "Leading explanation: retry amplification after instant-tax-v2 exposure expanded.",
      "Recovery criteria: p95 below 800 ms and errors below 1% for five continuous minutes.",
      "## Handoff review",
      ...handoffItems.map((item) => `- [${checked[mode].includes(item.id) ? "x" : " "}] ${item.title}: ${item.description}`),
      `Acknowledged locally: ${acknowledged[mode] ? "yes" : "no"}`,
      "## Sources",
      ...Object.values(evidenceMap).map((item) => `- ${item.id} · ${item.source} · ${item.state}`),
      "This report contains deterministic sample data. Revenue impact is modeled; no production action was executed.",
    ].join("\n\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `threadline-handoff-${mode}.md`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Prepared the ${frame.time} UTC handoff brief. Check your browser downloads to confirm it was saved.`);
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-6">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div><p className="eyebrow flex items-center gap-2 text-primary"><Radar aria-hidden="true" className="size-3.5" />Command center / Commerce Core</p><h1 className="mt-3 text-[28px] font-medium leading-tight tracking-[-0.055em] sm:text-[36px]">Your system, in perspective.</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-muted sm:text-sm">Follow the evidence from a risky release to a verified recovery.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-border bg-panel p-1" role="group" aria-label="Command snapshot">
            {(["investigating", "verified"] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => { setMode(value); setNotice(""); }} className={cn("min-h-10 rounded-lg px-3 text-start transition-colors sm:px-4", mode === value ? "bg-panel-elevated shadow-sm" : "text-muted hover:text-foreground")}><span className="block text-[11px] font-medium">{value === "verified" ? "Recovery" : "Investigation"}</span><span className={cn("mt-0.5 block font-mono text-[8px]", mode === value ? "text-primary" : "text-muted")}>{value === "verified" ? "09:40" : "09:25"} UTC</span></button>)}
          </div>
          <button type="button" onClick={exportBrief} className="grid size-11 place-items-center rounded-xl border border-border bg-panel text-muted transition-colors hover:border-primary/30 hover:text-primary" aria-label="Export operations brief"><Download aria-hidden="true" className="size-4" /></button>
        </div>
      </header>

      <section className="command-hero panel-luminous overflow-hidden rounded-2xl border border-border-strong" aria-labelledby="operating-picture-title">
        <div className="relative grid xl:grid-cols-[minmax(0,1.4fr)_minmax(310px,.85fr)]">
          <article className="relative min-w-0 p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center gap-2.5"><span className={cn("grid size-8 place-items-center rounded-lg border", resolved ? "border-success/25 bg-success/10 text-success" : "border-danger/25 bg-danger/10 text-danger")}>{resolved ? <ShieldCheck aria-hidden="true" className="size-4" /> : <Siren aria-hidden="true" className="size-4" />}</span><span className="font-mono text-[10px] tracking-wide text-muted">INC-2471</span><StatusPill tone={resolved ? "success" : "warning"} dot>{snapshot.status}</StatusPill><span className="ms-auto font-mono text-[9px] text-muted">FROZEN SNAPSHOT</span></div>
            <h2 id="operating-picture-title" className="mt-6 max-w-xl text-balance text-[25px] font-medium leading-[1.22] tracking-[-0.04em] sm:text-[32px]">{resolved ? <>Recovery is verified.<br /><span className="text-success">Keep the learning loop open.</span></> : <>One regression.<br /><span className="text-primary">A clear next decision.</span></>}</h2>
            <p className="mt-4 max-w-xl text-xs leading-6 text-muted sm:text-sm">{resolved ? "Disabling instant-tax-v2 restored checkout latency. The five-minute verification window has passed; evidence reconciliation and follow-up ownership come next." : "Checkout latency and conversion moved after the tax-quote rollout. Trace evidence points to retry amplification. Review the reversible mitigation, then verify the customer outcome."}</p>
            <div className="mt-6 flex flex-wrap gap-2"><Link href={incidentHref} className="inline-flex min-h-11 items-center justify-center gap-3 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-[0_6px_24px_rgba(184,246,106,.1)] transition hover:bg-[#cafa91]">{resolved ? "Review the recovery" : "Enter incident room"}<ArrowUpRight aria-hidden="true" className="size-4" /></Link><EvidenceExplorer /></div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-4"><span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full border border-primary/20 bg-primary/10 font-mono text-[8px] text-primary">MC</span><span className="text-[11px]">Maya Chen<span className="ms-1.5 text-muted">commander</span></span></span><span className="flex items-center gap-1.5 font-mono text-[9px] text-muted"><Clock3 aria-hidden="true" className="size-3" />{snapshot.elapsedMinutes}m since declaration</span></div>
          </article>
          <aside className="relative flex min-w-0 flex-col justify-between border-t border-border bg-black/[0.12] p-5 sm:p-7 xl:border-s xl:border-t-0">
            <div className="flex items-center justify-between"><p className="eyebrow">Checkout pulse</p><span className="font-mono text-[9px] text-muted">{frame.time} UTC</span></div>
            <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-[11px] text-muted">p95 latency</p><p className={cn("mt-1 font-mono text-5xl tracking-[-0.065em] tabular", resolved ? "text-success" : "text-foreground")}>{frame.latency.toFixed(2)}<span className="ms-1 text-xl text-muted">s</span></p></div><span className={cn("mb-1 rounded-md px-2 py-1 font-mono text-[9px]", resolved ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>{resolved ? "within recovery gate" : `+${snapshot.latencyDelta.toFixed(1)}% vs baseline`}</span></div>
            <div className="my-6"><Sparkline points={snapshot.history.map((item) => item.latency)} tone={resolved ? "success" : "warning"} label={`p95 latency through ${frame.time} UTC`} className="h-[104px]" /><div className="mt-2 flex justify-between font-mono text-[8px] text-muted"><span>09:08</span><span>680 ms baseline · {frame.time} UTC</span></div></div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4"><div><p className="text-[10px] text-muted">Error rate</p><p className={cn("mt-1 font-mono text-xl tabular", resolved ? "text-success" : "text-danger")}>{frame.errors.toFixed(1)}%</p></div><div><p className="text-[10px] text-muted">Checkout conversion</p><p className="mt-1 font-mono text-xl tabular">{frame.conversion.toFixed(1)}%</p></div></div>
          </aside>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-border bg-border lg:grid-cols-4">
          <OperatingMetric icon={Target} label="Customer impact" value={resolved ? "$0/hr" : `−$${frame.revenue.toFixed(1)}k/hr`} detail="Modeled estimate · not booked loss" tone={resolved ? "success" : "danger"} />
          <OperatingMetric icon={FileSearch} label="Evidence coverage" value="7 records" detail="Code, rollout, traces & commerce" tone="signal" />
          <OperatingMetric icon={ShieldCheck} label="Recovery contract" value="5 minutes" detail="p95 < 800 ms · errors < 1%" tone="primary" />
          <OperatingMetric icon={LockKeyhole} label="Change control" value={resolved ? "Observation" : "Approval required"} detail={resolved ? "Validate before resuming rollouts" : "Operator signs off on mitigation"} tone="inference" />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(310px,.75fr)]">
        <section className="panel overflow-hidden" aria-labelledby="thread-title">
          <PanelHeading icon={GitBranch} title="Follow the causal thread" subtitle="Recorded events and inferred relationships, kept distinct" id="thread-title" aside={<StatusPill tone="signal">6 connected objects</StatusPill>} />
          <div className="p-4 sm:p-5"><CausalGraph nodes={nodes} edges={edges} selectedId={selected.id} onSelect={(node) => setSelectedId(node.id)} /></div>
          <div className="border-t border-border bg-panel-soft p-5">
            <div className="flex flex-wrap items-center gap-2"><StatusPill tone={selectedEvidence.state === "Inferred" ? "inference" : "signal"}>{selectedEvidence.state}</StatusPill><span className="font-mono text-[9px] text-muted">{selectedEvidence.source}</span></div>
            <p className="mt-3 text-xs leading-6 text-muted">{selectedEvidence.description}</p>
            <div className="mt-3"><EvidenceExplorer label="Inspect this record" initialId={selectedEvidence.id} compact /></div>
          </div>
        </section>

        <section className="panel flex flex-col overflow-hidden" aria-labelledby="reasoning-title">
          <PanelHeading icon={Sparkles} title="Decision context" subtitle="Questions to challenge the working explanation" id="reasoning-title" />
          <div className="flex flex-wrap gap-1.5 border-b border-border p-4" role="group" aria-label="Guided investigation questions">{questions.map((item) => <button key={item.id} type="button" aria-pressed={question === item.id} onClick={() => setQuestion(item.id)} className={cn("min-h-9 rounded-lg border px-2.5 text-[10px] transition-colors", question === item.id ? "border-primary/25 bg-primary/[0.06] text-primary" : "border-border text-muted hover:text-foreground")}>{item.label}</button>)}</div>
          <div className="flex-1 p-5" aria-live="polite">
            <p className="eyebrow text-inference">{question === "cause" ? "Working explanation" : question === "alternative" ? "Keep an alternative open" : "The exit condition"}</p>
            <h3 className="mt-3 text-lg font-medium leading-7 tracking-tight">{question === "cause" ? "The retry policy meets a constrained connection pool." : question === "alternative" ? "Time correlation does not settle causation." : "Green once is not a recovery."}</h3>
            <p className="mt-3 text-xs leading-6 text-muted">{question === "cause" ? "The diff raised outbound attempts from one to three. Exposure then doubled, and traces found connection acquisition on the slow path. Those observations support the flag mitigation." : question === "alternative" ? "Third-party tax latency may also contribute. Compare adapter latency before and after exposure reaches zero. Persistent latency would weaken the rollout hypothesis." : resolved ? "The recorded 09:35–09:40 window stayed under both thresholds. Keep customer conversion under observation and capture corrective actions before closing the review." : "After disabling the flag, require p95 below 800 ms and errors below 1% for five continuous minutes. Conversion should recover too; it arrives with a reporting delay."}</p>
            <div className="mt-5 space-y-2">{(question === "cause" ? ["PR #1842 · attempts 1 → 3", "Trace 7f91 · connection wait"] : question === "alternative" ? ["Potential confounder · third-party latency", "Falsifier · no change after mitigation"] : ["Latency threshold · 800 ms", "Error threshold · 1.0%"]).map((text) => <div key={text} className="flex gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-[10px] text-muted"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-inference" />{text}</div>)}</div>
          </div>
          <div className="flex items-center gap-2 border-t border-border px-5 py-3 font-mono text-[8px] text-muted"><Layers3 aria-hidden="true" className="size-3" />Prepared from the sample evidence library</div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(310px,.75fr)]">
        <section className="panel overflow-hidden" aria-labelledby="handoff-title">
          <PanelHeading icon={ClipboardCheck} title="A handoff the next person can use." subtitle="Review the three commitments, then acknowledge this snapshot" id="handoff-title" aside={<StatusPill tone={acknowledged[mode] ? "success" : "neutral"}>{acknowledged[mode] ? "Acknowledged" : `${checked[mode].length} / 3 reviewed`}</StatusPill>} />
          <div className="divide-y divide-border">
            {handoffItems.map(({ icon: Icon, ...item }) => <label key={item.id} className={cn("flex cursor-pointer items-start gap-3 p-4 transition-colors sm:px-5", checked[mode].includes(item.id) ? "bg-primary/[0.025]" : "hover:bg-white/[0.02]")}>
              <input type="checkbox" checked={checked[mode].includes(item.id)} disabled={acknowledged[mode]} onChange={(event) => setChecked((current) => ({ ...current, [mode]: event.target.checked ? [...current[mode], item.id] : current[mode].filter((id) => id !== item.id) }))} className="mt-1 size-4 shrink-0 accent-[var(--primary)]" />
              <span className="flex-1"><span className="block text-xs font-medium">{item.title}</span><span className="mt-1 block text-[11px] leading-5 text-muted">{item.description}</span></span><Icon aria-hidden="true" className="mt-1 size-4 text-muted" />
            </label>)}
          </div>
          <div className="flex flex-col gap-4 border-t border-border bg-panel-soft p-5 sm:flex-row sm:items-center">
            <p className="flex-1 text-[11px] leading-5 text-muted">{acknowledged[mode] ? `Jun Lee acknowledged the ${frame.time} UTC handoff in this session.` : resolved ? "Next: reconcile the evidence and assign follow-up owners." : "Next update: 09:34 UTC · S. Park, communications."}</p>
            <button type="button" disabled={!ready || acknowledged[mode]} onClick={() => { setAcknowledged((current) => ({ ...current, [mode]: true })); setNotice(`Handoff acknowledged for ${frame.time} UTC. Saved in this page session.`); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[11px] font-semibold text-primary-foreground transition-opacity disabled:bg-white/5 disabled:text-muted">{acknowledged[mode] ? <CheckCheck aria-hidden="true" className="size-4" /> : <Check aria-hidden="true" className="size-4" />}{acknowledged[mode] ? "Acknowledged" : "Acknowledge handoff"}</button>
          </div>
        </section>
        <section className="panel overflow-hidden" aria-labelledby="next-title">
          <PanelHeading icon={Radar} title="Keep the loop moving" subtitle="Three connected workflows" id="next-title" />
          <div className="divide-y divide-border">
            <WorkflowLink href="/changes" icon={GitPullRequest} title="Inspect the change queue" description="Risk factors, coverage gaps, and rollout context." label="01 · PREVENT" />
            <WorkflowLink href="/lab" icon={Target} title="Practice the response" description="Command a cache-stampede scenario at six decision gates." label="02 · REHEARSE" />
            <WorkflowLink href="/reports" icon={ArrowDownRight} title="Review the impact" description="Compare delivery, reliability, and modeled customer impact." label="03 · IMPROVE" />
          </div>
        </section>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2 font-mono text-[9px] text-muted"><span>THREADLINE / OPERATIONS INTELLIGENCE</span><span>Sample data · local interactions · human decisions</span></footer>
      <p role="status" className={cn("text-xs text-success", !notice && "sr-only")}>{notice}</p>
    </div>
  );
}

function PanelHeading({ icon: Icon, title, subtitle, id, aside }: { icon: typeof Activity; title: string; subtitle: string; id: string; aside?: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4"><span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-panel-soft text-primary"><Icon aria-hidden="true" className="size-4" /></span><div className="min-w-0 flex-1"><h2 id={id} className="text-[13px] font-medium">{title}</h2><p className="mt-1 text-[10px] leading-4 text-muted">{subtitle}</p></div>{aside}</div>;
}

function OperatingMetric({ icon: Icon, label, value, detail, tone }: { icon: typeof Activity; label: string; value: string; detail: string; tone: "success" | "danger" | "signal" | "primary" | "inference" }) {
  const color = { success: "text-success", danger: "text-danger", signal: "text-signal", primary: "text-primary", inference: "text-inference" }[tone];
  return <div className="min-w-0 bg-[#10171a] p-4 sm:p-5"><p className="flex items-center gap-2 text-[10px] text-muted"><Icon aria-hidden="true" className={cn("size-3.5 shrink-0", color)} />{label}</p><p className={cn("mt-3 font-mono text-lg tracking-tight tabular sm:text-xl", color)}>{value}</p><p className="mt-1.5 text-[9px] leading-4 text-muted">{detail}</p></div>;
}

function WorkflowLink({ href, icon: Icon, title, description, label }: { href: string; icon: typeof Activity; title: string; description: string; label: string }) {
  return <Link href={href} className="group flex items-start gap-3 p-5 transition-colors hover:bg-primary/[0.025]"><Icon aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="font-mono text-[8px] tracking-wider text-muted">{label}</span><span className="mt-1.5 block text-xs font-medium">{title}</span><span className="mt-1 block text-[11px] leading-5 text-muted">{description}</span></span><ArrowRight aria-hidden="true" className="mt-1 size-3.5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" /></Link>;
}
