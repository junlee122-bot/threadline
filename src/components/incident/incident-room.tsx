"use client";

import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  Database,
  Eye,
  FileCode2,
  Flag,
  GitCommitHorizontal,
  LockKeyhole,
  MessageSquareText,
  Pause,
  Play,
  RotateCcw,
  RadioTower,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserRoundCheck,
  X,
} from "lucide-react";
import { CausalGraph, type GraphEdge, type GraphNode } from "@/components/graph/causal-graph";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import { createIncidentCommsDraft, createIncidentReplayState, getIncidentSnapshot, INCIDENT_REPLAY_FRAMES, incidentReplayReducer, parseIncidentStep, type IncidentSnapshot } from "@/lib/incident-replay";

const graphNodes: GraphNode[] = [
  { id: "pr", label: "PR #1842", detail: "retry tax quote", kind: "pull-request", status: "neutral", x: 8, y: 28, step: 0 },
  { id: "deploy", label: "deploy 2.18.0", detail: "09:12 · prod", kind: "deployment", status: "healthy", x: 27, y: 28, step: 1 },
  { id: "flag", label: "instant-tax-v2", detail: "50% → 100%", kind: "flag", status: "warning", x: 45, y: 18, step: 2 },
  { id: "service", label: "checkout-api", detail: "latency elevated", kind: "service", status: "critical", x: 58, y: 43, step: 3 },
  { id: "trace", label: "tax span", detail: "pool waits · 09:22", kind: "runtime", status: "critical", x: 74, y: 18, step: 4 },
  { id: "slo", label: "latency SLO", detail: "burn 8.4× at 09:22", kind: "metric", status: "warning", x: 75, y: 66, step: 4 },
  { id: "impact", label: "conversion", detail: "impact estimate", kind: "customer", status: "critical", x: 91, y: 66, step: 5 },
  { id: "agent", label: "rollback plan", detail: "human approval", kind: "agent", status: "inferred", x: 91, y: 22, step: 7 },
];

const graphEdges: GraphEdge[] = [
  { id: "e1", source: "pr", target: "deploy", state: "observed", step: 1 },
  { id: "e2", source: "deploy", target: "flag", state: "observed", step: 2 },
  { id: "e3", source: "flag", target: "service", state: "inferred", step: 3 },
  { id: "e4", source: "service", target: "trace", state: "observed", step: 4 },
  { id: "e5", source: "service", target: "slo", state: "observed", step: 4 },
  { id: "e6", source: "slo", target: "impact", state: "inferred", step: 5 },
  { id: "e7", source: "trace", target: "agent", state: "inferred", step: 7 },
  { id: "e8", source: "agent", target: "impact", state: "approved", step: 9 },
];

const eventIcons = { change: FileCode2, deploy: GitCommitHorizontal, flag: Flag, alert: Activity, impact: Eye, incident: ShieldCheck, agent: Sparkles, action: UserRoundCheck, success: Check };
const timeline = INCIDENT_REPLAY_FRAMES.map((frame) => ({ ...frame, type: frame.kind, icon: eventIcons[frame.kind] }));

const nodeEvidence: Record<string, { title: string; claim: string; source: string; capturedAt: string; record: string; query: string; limitation: string; state: "Observed" | "Inferred" | "Proposed" }> = {
  pr: { title: "Retry policy changed", claim: "PR #1842 raises outbound tax quote retries from 1 to 3.", source: "GitHub · diff", capturedAt: "09:08", record: "gh_pr_1842", query: "tax-adapter/retry.ts · maxAttempts: 1 → 3", limitation: "A code change establishes sequence, not runtime causation.", state: "Observed" },
  deploy: { title: "Version reached production", claim: "All checkout-api instances reported 2.18.0 by 09:12.", source: "Deploy event", capturedAt: "09:12", record: "deploy_checkout_2180", query: "service=checkout-api · environment=production · replicas=6/6", limitation: "Deployment health checks do not measure customer checkout success.", state: "Observed" },
  flag: { title: "Exposure doubled", claim: "instant-tax-v2 moved from 50% to 100% six minutes after deploy.", source: "Flag audit", capturedAt: "09:18", record: "flag_tax_v2_0918", query: "flag=instant-tax-v2 · rollout: 50% → 100%", limitation: "Exposure is a historical audit value; the current rollout is shown in action details.", state: "Observed" },
  service: { title: "Latency regression detected", claim: "p95 reached 1.10 s at 09:21 while traffic stayed within 2% of baseline.", source: "OpenTelemetry", capturedAt: "09:21", record: "otel_checkout_p95_0921", query: "http.server.duration · service=checkout-api · quantile=0.95", limitation: "Aggregated latency identifies regression but does not isolate its cause.", state: "Observed" },
  trace: { title: "Pool saturation", claim: "At 09:22, 92% of sampled slow traces wait on tax-adapter connection acquisition.", source: "Trace sample", capturedAt: "09:22", record: "trace_tax_pool_0922", query: "span=tax.quote · duration>800ms · sample=240 slow traces", limitation: "Tail-sampled slow traces are not representative of all requests. Third-party latency also rose 12%.", state: "Observed" },
  slo: { title: "Budget at risk", claim: "At 09:22, latency SLO burn reached 8.4×; at that rate the remaining budget would last 3.6 hours.", source: "SLO monitor", capturedAt: "09:22", record: "slo_checkout_0922", query: "checkout-latency · target=99.9% · window=30d", limitation: "Budget exhaustion is a projection assuming the observed burn remains constant.", state: "Observed" },
  impact: { title: "Likely business impact", claim: "Checkout conversion decline overlaps the latency window; revenue loss is modeled, not booked loss.", source: "Commerce analytics", capturedAt: "09:23", record: "commerce_impact_0923", query: "checkout.completed / checkout.started · ingest delay=2m", limitation: "The estimate depends on baseline conversion and average order value; it is not causal proof.", state: "Inferred" },
  agent: { title: "Safe mitigation proposed", claim: "Set instant-tax-v2 to 0% and verify both latency and errors for five continuous minutes.", source: "Threadline playbook", capturedAt: "09:25", record: "proposal_flag_2471", query: "flag.set(instant-tax-v2, 0) · service=checkout-api", limitation: "Prewritten demo recommendation. No model provider or production flag service is connected.", state: "Proposed" },
};

type ViewMode = "graph" | "timeline" | "evidence";

export function IncidentRoom() {
  return <Suspense fallback={<div className="mx-auto max-w-[1540px] p-6 text-sm text-muted">Loading incident replay…</div>}><IncidentRoomRoute /></Suspense>;
}

function IncidentRoomRoute() {
  const searchParams = useSearchParams();
  const initialStep = parseIncidentStep(searchParams.get("at"));
  return <IncidentReplay key={initialStep} initialStep={initialStep} />;
}

function IncidentReplay({ initialStep }: { initialStep: number }) {
  const [replay, dispatch] = useReducer(incidentReplayReducer, initialStep, createIncidentReplayState);
  const currentStep = replay.step;
  const actionState = replay.action;
  const snapshot = getIncidentSnapshot(currentStep);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<ViewMode>("graph");
  const [selectedId, setSelectedId] = useState("trace");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [draftStep, setDraftStep] = useState(initialStep);
  const approvalDialog = useRef<HTMLDialogElement>(null);
  const commsDialog = useRef<HTMLDialogElement>(null);
  const provenanceDialog = useRef<HTMLDialogElement>(null);
  const draftField = useRef<HTMLTextAreaElement>(null);

  const goToStep = useCallback((nextStep: number) => {
    approvalDialog.current?.close();
    dispatch({ type: "seek", step: nextStep });
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (currentStep >= timeline.length - 1) {
        setPlaying(false);
        return;
      }
      goToStep(currentStep + 1);
    }, 1200 / speed);
    return () => window.clearTimeout(timer);
  }, [currentStep, goToStep, playing, speed]);

  useEffect(() => {
    if (actionState !== "executing" && actionState !== "verifying") return;
    const timer = window.setTimeout(() => dispatch({ type: "advance-action", runId: replay.runId, expected: actionState }), actionState === "executing" ? 1200 : 2200);
    return () => window.clearTimeout(timer);
  }, [actionState, replay.runId]);

  const stepTime = snapshot.frame.time;
  const visibleNodes = graphNodes.filter((node) => (node.step ?? 0) <= currentStep);
  const observedRecords = visibleNodes.filter((node) => nodeEvidence[node.id].state === "Observed").length;
  const inferredRecords = visibleNodes.filter((node) => nodeEvidence[node.id].state === "Inferred").length;
  const selected = visibleNodes.find((node) => node.id === selectedId) ?? visibleNodes.at(-1) ?? graphNodes[0];
  const evidence = nodeEvidence[selected.id];
  const visibleTimeline = timeline.slice(0, currentStep + 1).reverse();
  const actionLabel = snapshot.resolved ? "Recovery verified" : actionState === "executing" ? "Disabling flag…" : actionState === "verifying" ? "Watching recovery…" : currentStep >= 8 ? "Recorded rollback applied" : snapshot.actionReady ? "Review mitigation" : "Awaiting diagnosis";
  const actionProgress = snapshot.resolved ? 100 : currentStep >= 8 ? 76 : actionState === "executing" ? 40 : 0;
  const actionAvailable = snapshot.actionReady && actionState === "idle";
  const draftSnapshot = getIncidentSnapshot(draftStep);
  const draft = createIncidentCommsDraft(draftStep);

  const stateTone = evidence?.state === "Observed" ? "signal" : evidence?.state === "Inferred" ? "inference" : "primary";

  const approve = () => {
    if (!actionAvailable) return;
    approvalDialog.current?.close();
    setPlaying(false);
    dispatch({ type: "approve" });
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
      draftField.current?.focus();
      draftField.current?.select();
    }
  };

  return (
    <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 sm:py-7">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] text-muted">
        <Link href="/command" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft aria-hidden="true" className="size-3" />Command</Link>
        <ChevronRight aria-hidden="true" className="size-3" />
        <span>Incidents</span><ChevronRight aria-hidden="true" className="size-3" />
        <span className="text-foreground">INC-2471</span>
      </div>

      <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={snapshot.declared ? "danger" : "neutral"} dot>{snapshot.declared ? "SEV-2" : "Pre-incident"}</StatusPill>
            <StatusPill tone={snapshot.resolved ? "success" : currentStep < 3 ? "neutral" : "warning"} dot>{snapshot.status}</StatusPill>
            <span className="font-mono text-[9px] text-muted">INC-2471</span>
          </div>
          <h1 className="mt-3 text-2xl font-medium tracking-[-0.035em] sm:text-[1.8rem]">Checkout latency elevated</h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted">{snapshot.resolved ? "Recovery verified after the feature rollback. The incident review retains the evidence, decisions, and remaining uncertainty." : currentStep >= 3 ? "Follow Commerce Core from the first checkout regression through diagnosis, a reviewed mitigation, and verified recovery." : "Explore the changes before detection. Only evidence available at the selected time is shown."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-panel-soft px-3 font-mono text-[9px] text-muted"><Clock3 aria-hidden="true" className="size-3.5" /><span className="text-foreground">{snapshot.declared ? `${snapshot.elapsedMinutes}m` : "—"}</span> since declaration</div>
          <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-panel-soft px-3 text-[10px]"><span className="grid size-5 place-items-center rounded-full bg-primary/10 font-mono text-[8px] text-primary">MC</span>Maya Chen · {snapshot.declared ? "Commander" : "On call"}</div>
        </div>
      </header>

      <IncidentCommandStrip snapshot={snapshot} onDraft={() => { setPlaying(false); setCopyState("idle"); setDraftStep(currentStep); commsDialog.current?.showModal(); }} />

      <section aria-label="Customer impact summary" className="mt-5 grid gap-3 sm:grid-cols-3">
        <ImpactMetric label="Checkout conversion" value={`${snapshot.frame.conversion.toFixed(1)}%`} change={`${signed(snapshot.conversionDelta)}% vs 68.4% baseline`} points={snapshot.history.map((frame) => frame.conversion)} tone={snapshot.resolved || currentStep < 3 ? "success" : "danger"} />
        <ImpactMetric label="p95 latency" value={`${snapshot.frame.latency.toFixed(2)} s`} change={`${signed(snapshot.latencyDelta)}% vs 680 ms baseline`} points={snapshot.history.map((frame) => frame.latency)} tone={snapshot.resolved || currentStep < 3 ? "success" : "warning"} />
        <ImpactMetric label="Estimated revenue impact" value={snapshot.revenueAvailable ? snapshot.frame.revenue === 0 ? "$0/hr" : `−$${snapshot.frame.revenue.toFixed(1)}k/hr` : "Pending"} change={snapshot.revenueAvailable ? "Modeled run rate · 2m ingest delay" : "Analytics estimate not yet available"} points={snapshot.history.map((frame) => frame.revenue)} tone={snapshot.resolved ? "success" : "danger"} />
      </section>

      <section aria-label="Incident replay controls" className="panel mt-4 p-3 sm:p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { if (!playing) goToStep(currentStep === 9 ? 0 : currentStep); setPlaying((value) => !value); }} className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground" aria-label={playing ? "Pause replay" : "Play replay"}>{playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="ms-0.5 size-4" />}</button>
            <button type="button" onClick={() => { goToStep(0); setPlaying(false); }} className="grid size-9 place-items-center rounded-md border border-border text-muted hover:text-foreground" aria-label="Reset replay"><RotateCcw aria-hidden="true" className="size-3.5" /></button>
            <button type="button" onClick={() => setSpeed((value) => value === 1 ? 2 : 1)} className="h-9 min-w-10 rounded-md border border-border px-2 font-mono text-[9px] text-muted hover:text-foreground" aria-label={`Replay speed ${speed} times`}>{speed}×</button>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="w-10 font-mono text-[9px] text-primary">{stepTime}</span>
            <input type="range" min="0" max={timeline.length - 1} value={currentStep} onChange={(event) => { setPlaying(false); goToStep(Number(event.target.value)); }} className="h-1 min-w-0 flex-1 accent-[var(--primary)]" aria-label="Incident replay time" aria-valuetext={`${stepTime} UTC · ${snapshot.frame.title}`} />
            <span className="font-mono text-[8px] text-muted">09:40</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setPlaying(false); goToStep(3); }} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-[10px] text-muted hover:text-foreground"><TimerReset aria-hidden="true" className="size-3.5" />Detection</button>
            <button type="button" onClick={() => { setPlaying(false); goToStep(7); }} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-[10px] text-muted hover:text-foreground"><ShieldCheck aria-hidden="true" className="size-3.5" />Decision</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 font-mono text-[8px] text-muted"><span><span className="text-primary">{String(currentStep + 1).padStart(2, "0")} / 10</span> · {snapshot.frame.title}</span><span>Recorded demo · UTC · event-spaced playback</span></div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <section className="panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium">Synchronized signals</p>
                <p className="mt-0.5 font-mono text-[8px] text-muted">Recorded event samples · each series uses its own scale</p>
              </div>
              <div className="flex items-center gap-4 font-mono text-[8px] text-muted"><Legend color="bg-warning" label="p95 latency" /><Legend color="bg-danger" label="error rate" /><Legend color="bg-signal" label="conversion" /></div>
            </div>
            <div className="grid gap-0 divide-y divide-border p-4 sm:p-5">
              <MetricTrack label="p95 latency" value={`${snapshot.frame.latency.toFixed(2)} s`} points={snapshot.history.map((frame) => frame.latency)} visibleIndex={currentStep} tone={snapshot.resolved ? "success" : "warning"} baseline="680 ms baseline" />
              <MetricTrack label="error rate" value={`${snapshot.frame.errors.toFixed(1)}%`} points={snapshot.history.map((frame) => frame.errors)} visibleIndex={currentStep} tone={snapshot.resolved ? "success" : "danger"} baseline="0.7% baseline" />
              <MetricTrack label="conversion" value={`${snapshot.frame.conversion.toFixed(1)}%`} points={snapshot.history.map((frame) => frame.conversion)} visibleIndex={currentStep} tone="signal" baseline="68.4% baseline" />
            </div>
            {currentStep >= 8 && <div className="border-t border-border bg-success/[0.025] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="inline-flex items-center gap-2 text-[11px] font-medium"><ShieldCheck aria-hidden="true" className={cn("size-4", snapshot.resolved ? "text-success" : "text-warning")} />Recovery acceptance window</p><StatusPill tone={snapshot.resolved ? "success" : "warning"}>{snapshot.resolved ? "5 continuous minutes verified" : "Awaiting sustained recovery"}</StatusPill></div><p className="mt-2 text-[10px] leading-5 text-muted">Both thresholds must hold: p95 &lt; 800 ms and errors &lt; 1.0%. A single healthy sample does not close the incident.</p>{snapshot.resolved ? <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{snapshot.recoveryWindow.map((sample) => <div key={sample.time} className="rounded-md border border-success/20 bg-success/[0.04] p-2.5"><p className="flex items-center justify-between gap-1 font-mono text-[8px] text-muted">{sample.time}<Check aria-hidden="true" className="size-2.5 text-success" /></p><p className="mt-2 font-mono text-xs text-success">{Math.round(sample.latency * 1000)}<span className="ms-1 text-[8px] text-muted">ms</span></p><p className="mt-1 font-mono text-[8px] text-muted">{sample.errors.toFixed(1)}% errors</p></div>)}</div> : <p className="mt-3 font-mono text-[9px] text-warning">09:31 UTC · p95 900 ms / errors 1.2% · criteria not yet met</p>}</div>}
          </section>

          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-medium">Causal thread</p>
                <p className="mt-0.5 font-mono text-[8px] text-muted">Select an object to inspect its evidence</p>
              </div>
              <div className="ms-auto flex rounded-md border border-border bg-background p-0.5" role="group" aria-label="Incident view">
                {(["graph", "timeline", "evidence"] as const).map((mode) => (
                  <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)} className={cn("min-h-8 rounded px-2.5 font-mono text-[8px] capitalize text-muted", view === mode && "bg-panel-elevated text-foreground")}>{mode}</button>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {view === "graph" && <CausalGraph nodes={graphNodes.map((node) => node.id === "service" ? { ...node, detail: `p95 ${snapshot.frame.latency.toFixed(2)} s`, status: snapshot.resolved ? "healthy" : "critical" } : node.id === "flag" ? { ...node, detail: `exposure ${snapshot.flagExposure}%`, status: currentStep >= 8 ? "healthy" : "warning" } : node.id === "impact" ? { ...node, detail: `${signed(snapshot.conversionDelta)}% relative`, status: snapshot.resolved ? "healthy" : "critical" } : node.id === "agent" && currentStep >= 8 ? { ...node, detail: snapshot.resolved ? "recovery verified" : "verification running", status: snapshot.resolved ? "healthy" : "warning" } : node)} edges={graphEdges} currentStep={currentStep} selectedId={selected.id} onSelect={(node) => setSelectedId(node.id)} />}
              {view === "timeline" && <Timeline events={visibleTimeline} />}
              {view === "evidence" && <EvidenceTable currentStep={currentStep} onSelect={(node) => { setSelectedId(node.id); setView("graph"); }} />}
            </div>
            {view === "graph" && evidence && (
              <div className="grid gap-4 border-t border-border bg-panel-soft px-4 py-4 sm:grid-cols-[1fr_auto] sm:px-5">
                <div>
                  <div className="flex items-center gap-2"><StatusPill tone={stateTone}>{evidence.state}</StatusPill><span className="font-mono text-[8px] text-muted">Captured {evidence.capturedAt} UTC</span></div>
                  <h3 className="mt-2 text-sm font-medium">{evidence.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">{evidence.claim}</p>
                </div>
                <button type="button" onClick={() => { setPlaying(false); provenanceDialog.current?.showModal(); }} className="inline-flex h-9 items-center justify-center gap-2 self-end rounded-md border border-border px-3 text-[10px] text-muted hover:text-foreground">Inspect source <Database aria-hidden="true" className="size-3" /></button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="panel p-5">
            <div className="flex items-center justify-between gap-2"><p className="eyebrow">Leading hypothesis</p><StatusPill tone={currentStep >= 7 ? "success" : "neutral"}>{currentStep >= 7 ? "Strong support" : currentStep >= 3 ? "Developing" : "Not formed"}</StatusPill></div>
            <h2 className="mt-4 text-base font-medium leading-6">{snapshot.resolved ? "Recovery supports the flag hypothesis." : currentStep >= 7 ? "The flag rollout is the leading explanation." : currentStep >= 4 ? "Tax-adapter contention needs investigation." : currentStep >= 3 ? "A latency regression needs context." : "No incident hypothesis at this time."}</h2>
            <p className="mt-3 text-xs leading-5 text-muted">{snapshot.resolved ? "Metrics recovered after exposure reached 0%. Third-party latency remains a possible contributing factor; correlation is not a complete root-cause proof." : currentStep >= 7 ? "The change sequence, runtime symptoms, and customer impact support mitigation. Third-party latency remains a possible contributing factor." : currentStep >= 4 ? "Slow traces now point to connection waits. The recommendation remains gated until the incident review at 09:25." : "Advance the replay to reveal each source as it becomes available. Future evidence does not contribute to this assessment."}</p>
            <div className="mt-4 rounded-lg border border-border bg-background/45 p-3">
              <div className="flex items-center justify-between font-mono text-[8px]"><span className="text-muted">Source records available</span><span className="text-signal">{observedRecords + inferredRecords} / 7</span></div>
              <div className="mt-2 flex gap-1" role="meter" aria-label="Available source records" aria-valuemin={0} aria-valuemax={7} aria-valuenow={observedRecords + inferredRecords}>{graphNodes.filter((node) => node.id !== "agent").map((node) => <span key={node.id} aria-hidden="true" className={cn("h-1 flex-1 rounded-full", (node.step ?? 0) > currentStep ? "bg-white/[0.06]" : nodeEvidence[node.id].state === "Inferred" ? "bg-inference" : "bg-signal")} />)}</div>
              <p className="mt-2 font-mono text-[7px] leading-4 text-muted">Record availability, not a probability or independent signal count.</p>
              <p className="mt-3 font-mono text-[7px] leading-4 text-muted"><span className="text-inference">{currentStep >= 7 ? "DISCONFIRMING TEST" : "NEXT QUESTION"}</span> · {currentStep >= 7 ? "does latency persist after flag exposure reaches 0%?" : currentStep >= 4 ? "do changed retries explain tax-adapter pool pressure?" : "which changed dependency aligns with the regression?"}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border bg-panel-soft p-3"><p className="font-mono text-lg text-signal">{observedRecords}</p><p className="mt-1 text-[9px] text-muted">observed records</p></div>
              <div className="rounded-md border border-border bg-panel-soft p-3"><p className="font-mono text-lg text-inference">{inferredRecords}</p><p className="mt-1 text-[9px] text-muted">inferred impact record</p></div>
            </div>
            <button type="button" onClick={() => setView("evidence")} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border text-[10px] text-muted hover:bg-white/[0.03] hover:text-foreground"><Eye aria-hidden="true" className="size-3.5" />Why this hypothesis?</button>
          </section>

          <section className={cn("panel overflow-hidden", snapshot.resolved && "border-success/30")}>
            <div className="border-b border-border p-5">
              <div className="flex items-center justify-between"><p className="eyebrow">Mitigation</p><StatusPill tone={snapshot.resolved ? "success" : "inference"}>{snapshot.resolved ? "Verified" : currentStep >= 8 ? "Monitoring" : "Demo only"}</StatusPill></div>
              <h2 className="mt-4 text-base font-medium">{currentStep >= 7 ? "Disable instant-tax-v2" : "Recommendation pending"}</h2>
              <p className="mt-2 text-xs leading-5 text-muted">{currentStep >= 8 ? "Flag exposure is 0%. Both latency and error rate must satisfy the recovery window." : currentStep >= 7 ? "Review a targeted rollback from 100% to 0%, then verify checkout recovery." : "The action becomes available after the 09:25 diagnosis. Advance to the decision point to review it."}</p>
              <dl className="mt-4 space-y-2 border-t border-border pt-4 font-mono text-[9px]">
                <ActionDetail label="Target" value="checkout-api · production" />
                <ActionDetail label="Blast radius" value="checkout traffic only" />
                <ActionDetail label="Current exposure" value={`${snapshot.flagExposure}%`} />
                <ActionDetail label="Fallback" value="50% · separate approval" />
                <ActionDetail label="Approval" value="Production Operator" />
              </dl>
            </div>
            <div className="p-4">
              {actionProgress > 0 && (
                <div className="mb-3">
                  <div className="mb-2 flex items-center justify-between font-mono text-[8px]"><span className={snapshot.resolved ? "text-success" : "text-inference"}>{actionLabel}</span><span className="text-muted">{actionProgress}%</span></div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className={cn("h-full rounded-full transition-all duration-700", snapshot.resolved ? "bg-success" : "bg-inference")} style={{ width: `${actionProgress}%` }} /></div>
                </div>
              )}
              <button type="button" disabled={!actionAvailable} onClick={() => { setPlaying(false); approvalDialog.current?.showModal(); }} className={cn("inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-inference text-[11px] font-semibold text-[#0b0915] transition-opacity disabled:cursor-default", !actionAvailable && (snapshot.resolved ? "bg-success/15 text-success" : "bg-panel-elevated text-muted"))}>
                {snapshot.resolved ? <Check aria-hidden="true" className="size-4" /> : <ShieldCheck aria-hidden="true" className="size-4" />}{actionLabel}
              </button>
              <p aria-live="polite" className="mt-3 font-mono text-[8px] leading-4 text-muted">{actionState === "executing" || actionState === "verifying" ? "Accelerated demo · seeking or resetting cancels this run." : snapshot.resolved ? "Recorded recovery window: 09:35–09:40 UTC. No production systems were changed." : currentStep >= 8 ? "The recorded action has completed; the recovery window is still open." : actionAvailable ? "Human approval required · no external systems connected." : "Select Decision in the replay controls to review the proposal."}</p>
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex items-center justify-between"><p className="eyebrow">Recent events</p><button type="button" onClick={() => setView("timeline")} className="font-mono text-[8px] text-primary hover:underline">View all</button></div>
            <div className="mt-4"><Timeline events={visibleTimeline.slice(0, 4)} compact /></div>
          </section>
        </aside>
      </div>

      <dialog ref={approvalDialog} className="m-auto w-[min(560px,calc(100%-2rem))] overflow-hidden rounded-xl border border-border-strong bg-panel p-0 text-foreground shadow-[0_32px_120px_rgba(0,0,0,.7)] backdrop:bg-black/75 backdrop:backdrop-blur-sm" aria-labelledby="approval-title">
        <div className="flex items-start gap-4 border-b border-border p-5 sm:p-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-inference/20 bg-inference/[0.07] text-inference"><ShieldCheck aria-hidden="true" className="size-5" /></span>
          <div className="min-w-0"><StatusPill tone="inference">Demo action</StatusPill><h2 id="approval-title" className="mt-3 text-lg font-medium">Simulate the production flag rollback?</h2><p className="mt-2 text-xs leading-5 text-muted">The recorded scenario advances from approval to verification in accelerated time. No production system will be changed.</p></div>
          <button type="button" onClick={() => approvalDialog.current?.close()} className="ms-auto grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-white/[0.04] hover:text-foreground" aria-label="Close approval dialog"><X aria-hidden="true" className="size-4" /></button>
        </div>
        <div className="space-y-3 p-5 sm:p-6">
          <PreviewRow label="Environment" before="production" after="production" />
          <PreviewRow label="Flag rollout" before="100%" after="0%" changed />
          <PreviewRow label="Affected service" before="checkout-api" after="checkout-api" />
          <div className="rounded-lg border border-border bg-background p-4"><p className="eyebrow">Success criteria</p><p className="mt-2 text-xs leading-5 text-muted">p95 latency stays below 800 ms and error rate below 1.0% for five continuous minutes.</p></div>
          <div className="grid gap-2 rounded-lg border border-inference/15 bg-inference/[0.035] p-4 font-mono text-[8px] text-muted sm:grid-cols-2">
            <span><span className="block text-[7px] uppercase tracking-wider text-inference">Recorded authorization</span><span className="mt-1 block text-foreground">J. Lee · 09:31–09:41 UTC</span></span>
            <span><span className="block text-[7px] uppercase tracking-wider text-inference">Audit record</span><span className="mt-1 block text-foreground">act_2471_flag_0931</span></span>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border bg-panel-soft p-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => approvalDialog.current?.close()} className="h-10 rounded-md border border-border px-4 text-[11px] text-muted hover:text-foreground">Cancel</button>
          <button type="button" onClick={approve} disabled={!actionAvailable} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-inference px-4 text-[11px] font-semibold text-[#0b0915] disabled:opacity-50"><UserRoundCheck aria-hidden="true" className="size-4" />Approve demo rollback</button>
        </div>
      </dialog>

      <dialog ref={provenanceDialog} className="m-auto max-h-[85dvh] w-[min(620px,calc(100%-2rem))] overflow-y-auto rounded-xl border border-border-strong bg-panel p-0 text-foreground shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm" aria-labelledby="provenance-title">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5"><div><p className="eyebrow">Evidence provenance</p><h2 id="provenance-title" className="mt-3 text-lg font-medium">{evidence.title}</h2></div><button type="button" onClick={() => provenanceDialog.current?.close()} aria-label="Close source details" className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-muted"><X aria-hidden="true" className="size-4" /></button></div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2"><StatusPill tone={stateTone}>{evidence.state}</StatusPill><StatusPill tone="neutral">Sample record</StatusPill><span className="font-mono text-[9px] text-muted">Captured {evidence.capturedAt} UTC</span></div>
          <p className="text-sm leading-6">{evidence.claim}</p>
          <dl className="space-y-3 rounded-lg border border-border bg-background p-4 font-mono text-[10px]"><ActionDetail label="Source" value={evidence.source} /><ActionDetail label="Record" value={evidence.record} /><ActionDetail label="Environment" value="production · sample dataset" /></dl>
          <div><p className="eyebrow">Source selector</p><code className="mt-2 block break-words rounded-lg border border-border bg-background p-4 font-mono text-[10px] leading-6 text-signal">{evidence.query}</code></div>
          <div className="rounded-lg border border-warning/20 bg-warning/[0.04] p-4"><p className="flex items-center gap-2 text-[10px] font-medium text-warning"><CircleAlert aria-hidden="true" className="size-3.5" />Interpretation limits</p><p className="mt-2 text-xs leading-5 text-muted">{evidence.limitation}</p></div>
          <p className="text-[10px] leading-5 text-muted">This is an inspectable sample record bundled with the demo. Connectors and external source access are not configured.</p>
        </div>
      </dialog>

      <dialog ref={commsDialog} className="m-auto max-h-[85dvh] w-[min(680px,calc(100%-2rem))] overflow-y-auto rounded-xl border border-border-strong bg-panel p-0 text-foreground shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm" aria-labelledby="comms-title">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5"><div><p className="eyebrow">Stakeholder communication</p><h2 id="comms-title" className="mt-3 text-lg font-medium">{draftSnapshot.status} update · {draftSnapshot.frame.time} UTC</h2><p className="mt-2 text-xs leading-5 text-muted">A reviewable draft built from this replay snapshot.</p></div><button type="button" onClick={() => commsDialog.current?.close()} aria-label="Close communication draft" className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-muted"><X aria-hidden="true" className="size-4" /></button></div>
        <div className="p-5"><label htmlFor="incident-comms-draft" className="eyebrow">Prepared for Support and Commerce leadership</label><textarea ref={draftField} id="incident-comms-draft" readOnly value={draft} rows={14} className="mt-3 w-full resize-y rounded-lg border border-border bg-background p-4 font-mono text-[11px] leading-6 text-foreground" /><p role="status" className="mt-3 min-h-5 text-[10px] text-muted">{copyState === "copied" ? "Draft copied. Review it before sharing." : copyState === "failed" ? "Clipboard access is unavailable. The draft is selected; copy it manually." : "Local draft only. Nothing is sent or published."}</p></div>
        <div className="flex justify-end border-t border-border bg-panel-soft p-4"><button type="button" onClick={copyDraft} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-[11px] font-semibold text-primary-foreground">{copyState === "copied" ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}{copyState === "copied" ? "Copied" : "Copy draft"}</button></div>
      </dialog>
    </div>
  );
}

function signed(value: number) { return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(1)}`; }

function ImpactMetric({ label, value, change, points, tone }: { label: string; value: string; change: string; points: number[]; tone: "danger" | "warning" | "success" }) {
  const changeClass = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-warning";
  return <article className="panel grid min-h-[112px] grid-cols-[1fr_110px] gap-3 p-4"><div><p className="text-[10px] text-muted">{label}</p><p className="mt-3 font-mono text-xl font-medium tabular">{value}</p><p className={`mt-1 font-mono text-[8px] ${changeClass}`}>{change}</p></div><Sparkline points={points} label={`${label} trend`} tone={tone} className="self-end" /></article>;
}

function IncidentCommandStrip({ snapshot, onDraft }: { snapshot: IncidentSnapshot; onDraft: () => void }) {
  const { resolved, declared, step } = snapshot;
  return (
    <section aria-label="Incident command protocol" className="panel panel-luminous mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-panel-soft px-4 py-2.5 font-mono text-[8px] text-muted">
        <span className="inline-flex items-center gap-1.5 text-foreground"><RadioTower aria-hidden="true" className={cn("size-3.5", resolved ? "text-success" : "text-danger")} />Incident command protocol</span>
        <span>{declared ? "IC-4 · declared 09:24 UTC" : "IC-4 · not yet declared"}</span>
        <span className="ms-auto inline-flex items-center gap-1.5"><span className={cn("size-1.5 rounded-full", resolved ? "bg-success" : declared ? "bg-danger" : "bg-muted")} />{resolved ? "recorded recovery verified" : declared ? "recorded response in progress" : "baseline observation"}</span>
      </div>
      <div className="grid divide-y divide-border sm:grid-cols-2 sm:[&>*:nth-child(odd)]:border-e xl:grid-cols-4 xl:divide-y-0 xl:[&>*]:border-e xl:[&>*:last-child]:border-e-0">
        <ProtocolItem icon={UserRoundCheck} label="Command structure" value={`Maya Chen · ${declared ? "Incident Commander" : "on call"}`} detail={declared ? "J. Lee operations · S. Park comms" : "Commerce Core escalation policy"} tone="text-primary" />
        <button type="button" onClick={onDraft} aria-label={resolved ? "Review recovery communication draft" : "Open stakeholder communication draft"} className="text-start transition-colors hover:bg-signal/[0.04]"><ProtocolItem icon={MessageSquareText} label="Stakeholder update" value={resolved ? "Review recovery draft →" : declared ? `Next update · ${step >= 8 ? "09:41" : "09:34"} UTC →` : "Preview observation draft →"} detail="Open locally · review and copy" tone="text-signal" /></button>
        <ProtocolItem icon={LockKeyhole} label="Change control" value={resolved ? "Freeze pending IC release" : declared ? "Commerce deploy freeze active" : "Standard deployment policy"} detail={declared ? "Exceptions require IC + Production Operator" : "Incident freeze starts on declaration"} tone="text-warning" />
        <ProtocolItem icon={ShieldCheck} label="Incident objectives" value={resolved ? "3 / 3 objectives complete" : step >= 8 ? "2 / 3 objectives complete" : declared ? "1 / 3 objectives complete" : "Objectives not yet activated"} detail={resolved ? "impact scoped · contained · recovered" : step >= 8 ? "scoped · contained · verifying recovery" : declared ? "impact scoped · containment pending" : "scope impact · contain · verify recovery"} tone={resolved ? "text-success" : "text-inference"} />
      </div>
    </section>
  );
}

function ProtocolItem({ icon: Icon, label, value, detail, tone }: { icon: typeof Activity; label: string; value: string; detail: string; tone: string }) {
  return <article className="flex min-w-0 gap-3 p-4"><span className={cn("grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background", tone)}><Icon aria-hidden="true" className="size-3.5" /></span><div className="min-w-0"><p className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">{label}</p><p className="mt-1.5 text-[10px] font-medium leading-5">{value}</p><p className="mt-1 font-mono text-[8px] leading-4 text-muted">{detail}</p></div></article>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${color}`} />{label}</span>; }

function MetricTrack({ label, value, points, visibleIndex, tone, baseline }: { label: string; value: string; points: number[]; visibleIndex: number; tone: "warning" | "danger" | "signal" | "success"; baseline: string }) {
  return <div className="grid min-h-[90px] grid-cols-[90px_minmax(0,1fr)] items-center gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[130px_minmax(0,1fr)_90px]"><div><p className="text-[10px] text-muted">{label}</p><p className="mt-1 font-mono text-sm tabular">{value}</p></div><div className="relative"><Sparkline points={points.slice(0, visibleIndex + 1)} label={`${label} through ${timeline[visibleIndex].time}`} tone={tone} className="h-14" /><div aria-hidden="true" className="absolute inset-y-0 end-0 w-px bg-foreground/20" /></div><p className="hidden text-end font-mono text-[8px] text-muted sm:block">{baseline}</p></div>;
}

function Timeline({ events, compact = false }: { events: typeof timeline; compact?: boolean }) {
  return <ol className={cn("relative border-s border-border ps-5", compact && "ps-4")}>{events.map((event) => { const Icon = event.icon; return <li key={`${event.time}-${event.title}`} className={cn("relative pb-5 last:pb-0", compact && "pb-4")}><span className={cn("absolute -start-[1.72rem] top-0 grid size-5 place-items-center rounded-full border border-border bg-panel-elevated text-muted", compact && "-start-[1.4rem] size-4")}><Icon aria-hidden="true" className="size-2.5" /></span><div className="flex items-center gap-2"><time className="font-mono text-[8px] text-primary">{event.time}</time><span className="font-mono text-[7px] uppercase text-muted">{event.type}</span></div><p className={cn("mt-1 text-[11px] font-medium", compact && "text-[10px]")}>{event.title}</p>{!compact && <p className="mt-1 text-[10px] leading-5 text-muted">{event.detail}</p>}</li>; })}</ol>;
}

function EvidenceTable({ currentStep, onSelect }: { currentStep: number; onSelect: (node: GraphNode) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-start"><thead><tr className="border-b border-border text-start font-mono text-[8px] uppercase tracking-wider text-muted"><th className="px-3 py-2 font-medium">State</th><th className="px-3 py-2 font-medium">Claim</th><th className="px-3 py-2 font-medium">Source</th><th className="px-3 py-2 font-medium">Captured · UTC</th><th className="px-3 py-2"><span className="sr-only">Action</span></th></tr></thead><tbody>{graphNodes.filter((node) => (node.step ?? 0) <= currentStep).map((node) => { const item = nodeEvidence[node.id]; return <tr key={node.id} className="border-b border-border/70 last:border-0"><td className="px-3 py-3"><StatusPill tone={item.state === "Observed" ? "signal" : item.state === "Inferred" ? "inference" : "primary"}>{item.state}</StatusPill></td><td className="px-3 py-3 text-[10px] text-foreground">{item.claim}</td><td className="px-3 py-3 font-mono text-[9px] text-muted">{item.source}</td><td className="px-3 py-3 font-mono text-[9px] text-muted">{item.capturedAt}</td><td className="px-3 py-3 text-end"><button type="button" onClick={() => onSelect(node)} className="text-[9px] text-primary hover:underline">Inspect</button></td></tr>; })}</tbody></table></div>;
}

function ActionDetail({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3"><dt className="text-muted">{label}</dt><dd className="text-end text-foreground">{value}</dd></div>; }

function PreviewRow({ label, before, after, changed = false }: { label: string; before: string; after: string; changed?: boolean }) { return <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-border bg-background p-3 font-mono text-[9px]"><span className="text-muted">{label}</span><span className={changed ? "text-danger line-through" : "text-foreground"}>{before}</span><span className={changed ? "text-success" : "text-muted"}>→ {after}</span></div>; }
