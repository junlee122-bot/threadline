"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  Download,
  Gauge,
  GitBranch,
  Network,
  Pause,
  Play,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Siren,
  Target,
  Terminal,
  TimerReset,
  TrendingDown,
  UsersRound,
  Waves,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import {
  applyLabChoice,
  buildLabResult,
  computeLabSnapshot,
  createLabReport,
  formatLabTime,
  LAB_DECISIONS,
  LAB_INITIAL_MODIFIERS,
  LAB_TOTAL_SECONDS,
} from "@/lib/crisis-lab";
import { cn } from "@/lib/utils";
import type {
  LabDecisionChoice,
  LabDecisionRecord,
  LabIncidentDecision,
  LabIncidentResult,
  LabMetricKey,
  LabServiceId,
  LabServiceNode,
  LabSimulationModifiers,
  LabSystemStatus,
  LabTelemetryPoint,
} from "@/types/crisis-lab";

type LabScreen = "briefing" | "incident" | "postmortem";
type LabSpeed = 12 | 24 | 48;

const METRIC_TABS: Array<{ id: LabMetricKey; label: string; unit: string }> = [
  { id: "latency", label: "p95 latency", unit: "ms" },
  { id: "errorRate", label: "error rate", unit: "%" },
  { id: "throughput", label: "throughput", unit: "rps" },
  { id: "dbConnections", label: "DB pool", unit: "conn" },
  { id: "cacheHitRate", label: "cache hit", unit: "%" },
];

const STATUS_TONE: Record<LabSystemStatus, "success" | "warning" | "danger" | "signal"> = {
  nominal: "success",
  degraded: "warning",
  critical: "danger",
  recovering: "signal",
};

const STATUS_TEXT: Record<LabSystemStatus, string> = {
  nominal: "text-success",
  degraded: "text-warning",
  critical: "text-danger",
  recovering: "text-signal",
};

const STATUS_BORDER: Record<LabSystemStatus, string> = {
  nominal: "border-success/25 bg-success/[0.055]",
  degraded: "border-warning/30 bg-warning/[0.06]",
  critical: "border-danger/35 bg-danger/[0.065]",
  recovering: "border-signal/30 bg-signal/[0.06]",
};

const TOPOLOGY_POSITIONS: Record<LabServiceId, { x: number; y: number }> = {
  edge: { x: 8, y: 50 },
  gateway: { x: 26, y: 50 },
  checkout: { x: 47, y: 50 },
  payments: { x: 69, y: 25 },
  cache: { x: 69, y: 75 },
  database: { x: 91, y: 50 },
};

const EVIDENCE = [
  { at: 0, source: "Deploy", detail: "release-24.7.13 completed", tone: "text-muted" },
  { at: 32, source: "Cache", detail: "38 hot-key TTLs expired together", tone: "text-warning" },
  { at: 92, source: "Trace", detail: "origin reads +1,840%", tone: "text-signal" },
  { at: 148, source: "Database", detail: "pool crossed 80% saturation", tone: "text-danger" },
  { at: 222, source: "Commerce", detail: "checkout conversion −8.2%", tone: "text-danger" },
  { at: 312, source: "Control", detail: "recovery window detected", tone: "text-success" },
  { at: 400, source: "SLO", detail: "traffic gate ready for validation", tone: "text-primary" },
];

const SYSTEM_LOGS = [
  { at: 0, level: "INFO", message: "scenario-047 loaded / production twin isolated" },
  { at: 26, level: "WARN", message: "catalog-cache miss ratio outside baseline" },
  { at: 74, level: "WARN", message: "origin request fan-out accelerating" },
  { at: 126, level: "ERROR", message: "checkout p95 breached 800ms objective" },
  { at: 165, level: "ERROR", message: "pg-primary pool utilization above 90%" },
  { at: 238, level: "CRIT", message: "revenue-critical path entering cascade" },
  { at: 318, level: "INFO", message: "connection slope has turned negative" },
  { at: 398, level: "INFO", message: "recovery gates awaiting commander action" },
];

export function CrisisLab() {
  const [screen, setScreen] = useState<LabScreen>("briefing");
  const [elapsed, setElapsed] = useState(0);
  const [modifiers, setModifiers] = useState<LabSimulationModifiers>(LAB_INITIAL_MODIFIERS);
  const [records, setRecords] = useState<LabDecisionRecord[]>([]);
  const [history, setHistory] = useState<LabTelemetryPoint[]>([
    computeLabSnapshot(0, LAB_INITIAL_MODIFIERS).metrics,
  ]);
  const [totalRevenueLost, setTotalRevenueLost] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState<LabServiceId>("checkout");
  const [activeMetric, setActiveMetric] = useState<LabMetricKey>("latency");
  const [speed, setSpeed] = useState<LabSpeed>(24);
  const [isPaused, setIsPaused] = useState(false);
  const [result, setResult] = useState<LabIncidentResult | null>(null);

  const elapsedRef = useRef(0);
  const modifiersRef = useRef<LabSimulationModifiers>(LAB_INITIAL_MODIFIERS);
  const lossRef = useRef(0);
  const historyTickRef = useRef(-1);

  const computedSnapshot = useMemo(() => computeLabSnapshot(elapsed, modifiers), [elapsed, modifiers]);
  const snapshot = useMemo(
    () => ({ ...computedSnapshot, totalRevenueLost: Math.round(totalRevenueLost) }),
    [computedSnapshot, totalRevenueLost],
  );
  const activeDecision = useMemo(
    () =>
      LAB_DECISIONS.find(
        (decision) => elapsed >= decision.triggerAt && !records.some((record) => record.decisionId === decision.id),
      ) ?? null,
    [elapsed, records],
  );
  const selectedService = snapshot.services.find((service) => service.id === selectedServiceId) ?? snapshot.services[0];

  const resetSimulation = useCallback(() => {
    elapsedRef.current = 0;
    modifiersRef.current = LAB_INITIAL_MODIFIERS;
    lossRef.current = 0;
    historyTickRef.current = -1;
    setElapsed(0);
    setModifiers(LAB_INITIAL_MODIFIERS);
    setRecords([]);
    setHistory([computeLabSnapshot(0, LAB_INITIAL_MODIFIERS).metrics]);
    setTotalRevenueLost(0);
    setSelectedServiceId("checkout");
    setActiveMetric("latency");
    setSpeed(24);
    setIsPaused(false);
    setResult(null);
  }, []);

  const beginIncident = useCallback(() => {
    resetSimulation();
    setScreen("incident");
  }, [resetSimulation]);

  const chooseDecision = useCallback(
    (choice: LabDecisionChoice) => {
      if (!activeDecision) return;
      const nextModifiers = applyLabChoice(modifiersRef.current, choice);
      modifiersRef.current = nextModifiers;
      setModifiers(nextModifiers);
      setRecords((current) => [
        ...current,
        {
          decisionId: activeDecision.id,
          choiceId: choice.id,
          title: activeDecision.title,
          choiceLabel: choice.label,
          command: choice.command,
          verdict: choice.verdict,
          scoreDelta: choice.scoreDelta,
          rationale: choice.rationale,
          chosenAt: Math.round(elapsedRef.current),
        },
      ]);
    },
    [activeDecision],
  );

  useEffect(() => {
    if (screen !== "incident" || isPaused || activeDecision || elapsedRef.current >= LAB_TOTAL_SECONDS) return;
    let lastFrame = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const realDelta = Math.min(0.5, (now - lastFrame) / 1_000);
      lastFrame = now;
      const current = elapsedRef.current;
      const next = Math.min(LAB_TOTAL_SECONDS, current + realDelta * speed);
      const midpoint = current + (next - current) / 2;
      lossRef.current += computeLabSnapshot(midpoint, modifiersRef.current).revenueLossRate * (next - current);
      elapsedRef.current = next;
      setTotalRevenueLost(lossRef.current);
      setElapsed(next);
    }, 100);
    return () => window.clearInterval(interval);
  }, [activeDecision, isPaused, screen, speed]);

  useEffect(() => {
    const tick = snapshot.metrics.tick;
    if (screen !== "incident" || tick === historyTickRef.current) return;
    historyTickRef.current = tick;
    setHistory((current) => [...current, snapshot.metrics].slice(-120));
  }, [screen, snapshot.metrics]);

  useEffect(() => {
    if (screen !== "incident" || elapsed < LAB_TOTAL_SECONDS) return;
    const transition = window.setTimeout(() => {
      setResult(buildLabResult(snapshot, records));
      setScreen("postmortem");
    }, 0);
    return () => window.clearTimeout(transition);
  }, [elapsed, records, screen, snapshot]);

  useEffect(() => {
    if (screen !== "incident") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping = target instanceof Element && target.matches("input, textarea, select, [contenteditable='true']");
      if (isTyping) return;
      if (activeDecision && ["1", "2", "3"].includes(event.key)) {
        event.preventDefault();
        const choice = activeDecision.choices[Number(event.key) - 1];
        if (choice) chooseDecision(choice);
        return;
      }
      if (event.code === "Space" && !activeDecision) {
        event.preventDefault();
        setIsPaused((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeDecision, chooseDecision, screen]);

  const restartToBriefing = () => {
    resetSimulation();
    setScreen("briefing");
  };

  const downloadReport = () => {
    if (!result) return;
    const blob = new Blob([createLabReport(result, records)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `threadline-crisis-lab-${result.ending}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (screen === "briefing") return <LabBriefing onBegin={beginIncident} />;
  if (screen === "postmortem" && result) {
    return <LabPostmortem result={result} records={records} onRestart={restartToBriefing} onDownload={downloadReport} />;
  }

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-5 sm:px-6 sm:py-7">
      <section className="panel overflow-hidden border-danger/15">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-panel-soft/70 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="live-dot size-2 rounded-full bg-danger" />
            <span className="font-mono text-[10px] font-semibold text-danger">SIMULATION LIVE</span>
          </div>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="font-mono text-[9px] text-muted">FAULTLINE 047 · CACHE STAMPEDE</span>
          <StatusPill tone={STATUS_TONE[snapshot.status]} dot className="sm:ms-1">
            {snapshot.status}
          </StatusPill>

          <div className="ms-auto flex flex-wrap items-center gap-2">
            <div className="flex h-8 items-center rounded-md border border-border bg-background p-0.5" role="group" aria-label="Simulation speed">
              {([12, 24, 48] as LabSpeed[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSpeed(value)}
                  aria-pressed={speed === value}
                  className={cn(
                    "h-7 rounded px-2 font-mono text-[9px] text-muted transition-colors",
                    speed === value && "bg-white/[0.07] text-foreground",
                  )}
                >
                  {value}×
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsPaused((current) => !current)}
              disabled={Boolean(activeDecision)}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 font-mono text-[9px] text-muted hover:text-foreground disabled:opacity-40"
            >
              {isPaused ? <Play aria-hidden="true" className="size-3" /> : <Pause aria-hidden="true" className="size-3" />}
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={restartToBriefing}
              className="grid size-8 place-items-center rounded-md border border-border text-muted hover:text-foreground"
              aria-label="Exit simulation"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border px-4 py-4 sm:grid-cols-[auto_1fr] sm:px-5">
          <div className="flex min-w-[160px] items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg border border-danger/20 bg-danger/[0.055] text-danger">
              <TimerReset aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="eyebrow">Time remaining</span>
              <span className="mt-1 block font-mono text-2xl tabular tracking-[-0.04em]">
                −{formatLabTime(snapshot.remaining)}
              </span>
            </span>
          </div>
          <IncidentProgress elapsed={elapsed} records={records} activeDecision={activeDecision} />
        </div>

        {isPaused && !activeDecision && (
          <div role="status" className="flex items-center justify-center gap-2 border-b border-warning/20 bg-warning/[0.055] px-4 py-2 font-mono text-[9px] text-warning">
            <Pause aria-hidden="true" className="size-3" /> SIMULATION PAUSED · PRESS SPACE TO RESUME
          </div>
        )}

        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 xl:grid-cols-6">
          <LabMetric label="System health" value={`${snapshot.health}%`} detail={snapshot.status} tone={snapshot.health < 40 ? "danger" : snapshot.health < 70 ? "warning" : "success"} />
          <LabMetric label="p95 latency" value={`${snapshot.metrics.latency.toLocaleString("en-US")} ms`} detail="objective < 800" tone={snapshot.metrics.latency > 1_600 ? "danger" : snapshot.metrics.latency > 800 ? "warning" : "success"} />
          <LabMetric label="Error rate" value={`${snapshot.metrics.errorRate.toFixed(1)}%`} detail="checkout requests" tone={snapshot.metrics.errorRate > 12 ? "danger" : snapshot.metrics.errorRate > 3 ? "warning" : "success"} />
          <LabMetric label="DB pool" value={`${snapshot.metrics.dbConnections.toLocaleString("en-US")}`} detail="of 1,800 connections" tone={snapshot.metrics.dbConnections > 1_620 ? "danger" : snapshot.metrics.dbConnections > 1_200 ? "warning" : "success"} />
          <LabMetric label="Affected users" value={snapshot.affectedUsers.toLocaleString("en-US")} detail="modeled live" tone={snapshot.affectedUsers > 60_000 ? "danger" : snapshot.affectedUsers > 15_000 ? "warning" : "signal"} />
          <LabMetric label="Revenue loss" value={`$${snapshot.totalRevenueLost.toLocaleString("en-US")}`} detail={`$${snapshot.revenueLossRate.toLocaleString("en-US")} / sec`} tone="danger" />
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.72fr)]">
        <div className="grid gap-4">
          <section className="panel overflow-hidden" aria-labelledby="topology-heading">
            <PanelHeading icon={Network} title="Live service topology" detail="Select a node to inspect pressure" id="topology-heading" />
            <ServiceTopology services={snapshot.services} selectedId={selectedServiceId} onSelect={setSelectedServiceId} />
          </section>

          <section className="panel overflow-hidden" aria-labelledby="telemetry-heading">
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-2">
                <Waves aria-hidden="true" className="size-3.5 text-signal" />
                <h2 id="telemetry-heading" className="text-[11px] font-medium">Rolling telemetry</h2>
              </div>
              <div className="ms-auto flex max-w-full gap-1 overflow-x-auto" aria-label="Telemetry metric">
                {METRIC_TABS.map((metric) => (
                  <button
                    type="button"
                    key={metric.id}
                    onClick={() => setActiveMetric(metric.id)}
                    aria-pressed={activeMetric === metric.id}
                    className={cn(
                      "shrink-0 rounded-md px-2.5 py-1.5 font-mono text-[8px] text-muted hover:text-foreground",
                      activeMetric === metric.id && "bg-white/[0.06] text-primary",
                    )}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
            <TelemetryChart history={history} metric={activeMetric} />
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <ServiceInspector service={selectedService} />
          <EvidenceStream elapsed={elapsed} records={records} />
          <LogStream elapsed={elapsed} records={records} />
        </aside>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border px-1 pt-4 font-mono text-[8px] text-muted">
        <span className="flex items-center gap-1.5"><ScanSearch aria-hidden="true" className="size-3" />Deterministic synthetic scenario</span>
        <span className="flex items-center gap-1.5"><Terminal aria-hidden="true" className="size-3" />Space pause · 1–3 execute</span>
        <span className="ms-auto text-primary">THREADLINE CRISIS LAB / v1.0</span>
      </div>

      {activeDecision && <DecisionDialog decision={activeDecision} onChoose={chooseDecision} />}
    </div>
  );
}

function LabBriefing({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Crisis Lab · Scenario 047"
        title="The release is a decoy. The system is already failing."
        description="Step into an eight-minute incident, read the evidence under pressure, and make six production decisions. Every choice changes the same deterministic system model."
        actions={<StatusPill tone="danger" dot>Advanced drill</StatusPill>}
      />

      <section className="mt-7 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.72fr)]">
        <article className="panel relative overflow-hidden border-danger/20 p-6 sm:p-8 lg:p-10">
          <div aria-hidden="true" className="absolute -end-32 -top-40 size-[520px] rounded-full bg-danger/[0.055] blur-3xl" />
          <div aria-hidden="true" className="technical-grid absolute inset-0 opacity-35" />
          <div className="relative max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-danger/25 bg-danger/[0.07] px-2.5 py-1 font-mono text-[9px] text-danger">FAULTLINE / INCIDENT 047</span>
              <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[9px] text-muted">8 simulated minutes</span>
              <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[9px] text-muted">3 possible endings</span>
            </div>
            <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.18em] text-danger">Global checkout degradation</p>
            <h2 className="mt-3 max-w-3xl text-balance text-3xl font-medium leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Cache stampede.<br /><span className="text-muted">Database redline.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-muted">
              Release 24.7.13 completed four minutes before the first alert. It looks guilty. The deploy touched no cache code, and 38 hot keys expired in the same cohort. Correlation is not causation—and every second now costs revenue.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onBegin} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-danger px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
                Assume command <ArrowRight aria-hidden="true" className="size-4" />
              </button>
              <Link href="/incidents/inc-2471" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border-strong px-5 text-sm text-muted hover:text-foreground">
                Review a resolved incident <GitBranch aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <p className="mt-4 font-mono text-[8px] text-muted">Keyboard enabled · simulation runs at 24× by default · no external services</p>
          </div>
        </article>

        <aside className="grid gap-4">
          <article className="panel overflow-hidden">
            <PanelHeading icon={Target} title="Mission constraints" detail="What good command looks like" />
            <div className="divide-y divide-border">
              {[
                [ShieldCheck, "Protect the transaction path", "Keep checkout and payments alive."],
                [BrainCircuit, "Act on causal evidence", "A recent deploy can still be innocent."],
                [TrendingDown, "Recover without a second wave", "Green metrics under gates are not recovery."],
              ].map(([Icon, title, detail]) => {
                const ItemIcon = Icon as typeof ShieldCheck;
                return (
                  <div key={title as string} className="flex gap-3 p-4 sm:p-5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-primary/15 bg-primary/[0.055] text-primary"><ItemIcon aria-hidden="true" className="size-4" /></span>
                    <span><span className="block text-[11px] font-medium">{title as string}</span><span className="mt-1 block text-[9px] leading-4 text-muted">{detail as string}</span></span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="panel p-5">
            <p className="eyebrow">Hidden causal chain</p>
            <div className="mt-5 space-y-2">
              {["Synchronized TTL expiry", "Origin request stampede", "DB pool exhaustion", "Checkout cascade"].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className={cn("grid size-6 place-items-center rounded-full border font-mono text-[8px]", index === 3 ? "border-danger/30 bg-danger/[0.06] text-danger" : "border-border bg-panel-soft text-muted")}>{index + 1}</span>
                  <span className="text-[10px]">{item}</span>
                  {index < 3 && <ArrowRight aria-hidden="true" className="ms-auto size-3 text-muted" />}
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section className="mt-4 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {[
          ["01", "Observe", "Trace signals across cache, checkout, and the database."],
          ["02", "Command", "Choose one production action at each decision gate."],
          ["03", "Debrief", "Inspect accuracy, MTTR, impact, and every rationale."],
        ].map(([number, title, detail]) => (
          <div key={number} className="bg-panel p-5 sm:p-6">
            <span className="font-mono text-[9px] text-primary">{number}</span>
            <h3 className="mt-4 text-sm font-medium">{title}</h3>
            <p className="mt-2 text-[10px] leading-5 text-muted">{detail}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function IncidentProgress({ elapsed, records, activeDecision }: { elapsed: number; records: LabDecisionRecord[]; activeDecision: LabIncidentDecision | null }) {
  return (
    <div className="grid min-w-0 grid-cols-6 gap-1" aria-label="Incident decision progress">
      {LAB_DECISIONS.map((decision, index) => {
        const complete = records.some((record) => record.decisionId === decision.id);
        const active = activeDecision?.id === decision.id;
        const upcoming = elapsed < decision.triggerAt;
        return (
          <div key={decision.id} className="min-w-0">
            <div className={cn("h-1 rounded-full bg-white/[0.055]", complete && "bg-primary", active && "bg-danger", !upcoming && !complete && !active && "bg-warning")} />
            <div className="mt-2 flex items-center gap-1.5">
              <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border border-border font-mono text-[7px] text-muted", complete && "border-primary/30 text-primary", active && "border-danger/40 text-danger")}>{complete ? <Check aria-hidden="true" className="size-2.5" /> : index + 1}</span>
              <span className={cn("hidden truncate font-mono text-[7px] uppercase text-muted md:block", active && "text-danger", complete && "text-foreground")}>{decision.title}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LabMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "danger" | "warning" | "success" | "signal" }) {
  const toneClass = { danger: "text-danger", warning: "text-warning", success: "text-success", signal: "text-signal" }[tone];
  return (
    <div className="min-w-0 bg-panel px-4 py-4 sm:px-5">
      <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className={cn("mt-2 truncate font-mono text-lg tabular tracking-[-0.03em]", toneClass)}>{value}</p>
      <p className="mt-1 truncate font-mono text-[7px] text-muted">{detail}</p>
    </div>
  );
}

function PanelHeading({ icon: Icon, title, detail, id }: { icon: typeof Activity; title: string; detail?: string; id?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 sm:px-5">
      <span className="grid size-7 place-items-center rounded-md border border-border bg-panel-soft text-primary"><Icon aria-hidden="true" className="size-3.5" /></span>
      <span><h2 id={id} className="text-[11px] font-medium">{title}</h2>{detail && <span className="mt-0.5 block font-mono text-[7px] text-muted">{detail}</span>}</span>
    </div>
  );
}

function ServiceTopology({ services, selectedId, onSelect }: { services: LabServiceNode[]; selectedId: LabServiceId; onSelect: (id: LabServiceId) => void }) {
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const links: Array<[LabServiceId, LabServiceId]> = [
    ["edge", "gateway"], ["gateway", "checkout"], ["checkout", "payments"], ["checkout", "cache"], ["payments", "database"], ["cache", "database"],
  ];
  return (
    <div className="overflow-x-auto p-3 sm:p-5">
      <div className="relative h-[330px] min-w-[760px] overflow-hidden rounded-lg border border-border bg-background/70 dot-grid">
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <defs><linearGradient id="lab-link" x1="0" x2="1"><stop offset="0" stopColor="rgba(99,216,238,.28)" /><stop offset="1" stopColor="rgba(184,246,106,.4)" /></linearGradient></defs>
          {links.map(([from, to]) => {
            const start = TOPOLOGY_POSITIONS[from];
            const end = TOPOLOGY_POSITIONS[to];
            const critical = serviceMap.get(from)?.status === "critical" || serviceMap.get(to)?.status === "critical";
            return <line key={`${from}-${to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} vectorEffect="non-scaling-stroke" stroke={critical ? "rgba(255,117,133,.7)" : "url(#lab-link)"} strokeWidth={critical ? 1.7 : 1.2} strokeDasharray={critical ? "3 3" : "7 6"} className="thread-path" />;
          })}
        </svg>
        {services.map((service) => {
          const position = TOPOLOGY_POSITIONS[service.id];
          return (
            <button
              type="button"
              key={service.id}
              onClick={() => onSelect(service.id)}
              aria-pressed={selectedId === service.id}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              className={cn(
                "absolute w-[118px] -translate-x-1/2 -translate-y-1/2 rounded-lg border p-3 text-start shadow-[0_16px_40px_rgba(0,0,0,.35)] transition-transform hover:-translate-y-[54%]",
                STATUS_BORDER[service.status],
                selectedId === service.id && "ring-2 ring-primary/45 ring-offset-2 ring-offset-background",
              )}
            >
              <span className="flex items-center justify-between"><span className="font-mono text-[7px] text-muted">{service.code}</span><span className={cn("size-1.5 rounded-full", service.status === "critical" ? "bg-danger" : service.status === "degraded" ? "bg-warning" : service.status === "recovering" ? "bg-signal" : "bg-success")} /></span>
              <span className="mt-2 block truncate text-[10px] font-medium">{service.label}</span>
              <span className={cn("mt-1 block truncate font-mono text-[8px]", STATUS_TEXT[service.status])}>{service.metricValue}</span>
              <span className="mt-2 block h-0.5 overflow-hidden rounded-full bg-white/[0.06]"><span className={cn("block h-full", service.status === "critical" ? "bg-danger" : service.status === "degraded" ? "bg-warning" : "bg-primary")} style={{ width: `${service.load}%` }} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TelemetryChart({ history, metric }: { history: LabTelemetryPoint[]; metric: LabMetricKey }) {
  const config = METRIC_TABS.find((item) => item.id === metric) ?? METRIC_TABS[0];
  const data = history.slice(-72);
  const values = data.map((point) => point[metric]);
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 1);
  const padding = Math.max((rawMax - rawMin) * 0.14, 1);
  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  const xFor = (index: number) => (data.length <= 1 ? 0 : (index / (data.length - 1)) * 720);
  const yFor = (value: number) => 172 - ((value - min) / Math.max(1, max - min)) * 144;
  const points = data.map((point, index) => `${xFor(index)},${yFor(point[metric])}`).join(" ");
  const latest = data.at(-1)?.[metric] ?? 0;
  const area = points ? `0,180 ${points} 720,180` : "";
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <span><span className="font-mono text-xl text-signal tabular">{typeof latest === "number" ? latest.toLocaleString("en-US", { maximumFractionDigits: 1 }) : latest}</span><span className="ms-2 font-mono text-[8px] text-muted">{config.unit}</span></span>
        <span className="font-mono text-[8px] text-muted">window {data[0]?.timeLabel ?? "T+00:00"} → {data.at(-1)?.timeLabel ?? "T+00:00"}</span>
      </div>
      <svg role="img" aria-label={`${config.label} rolling telemetry`} viewBox="0 0 720 180" className="h-[190px] w-full overflow-visible">
        <defs><linearGradient id="lab-chart-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(99,216,238,.24)" /><stop offset="1" stopColor="rgba(99,216,238,0)" /></linearGradient></defs>
        {[28, 76, 124, 172].map((y) => <line key={y} x1="0" x2="720" y1={y} y2={y} stroke="rgba(227,239,226,.08)" strokeWidth="1" />)}
        {area && <polygon points={area} fill="url(#lab-chart-area)" />}
        {points && <polyline points={points} fill="none" stroke="#63d8ee" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
        {data.length > 0 && <circle cx={xFor(data.length - 1)} cy={yFor(latest)} r="3.5" fill="#63d8ee" />}
      </svg>
    </div>
  );
}

function ServiceInspector({ service }: { service: LabServiceNode }) {
  return (
    <section className="panel overflow-hidden">
      <PanelHeading icon={Gauge} title="Service inspector" detail={service.code} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{service.label}</p><p className="mt-1 font-mono text-[8px] text-muted">production · us-east-1</p></div><StatusPill tone={STATUS_TONE[service.status]} dot>{service.status}</StatusPill></div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border bg-panel-soft p-3"><p className="font-mono text-[7px] uppercase text-muted">{service.metricLabel}</p><p className={cn("mt-2 font-mono text-sm", STATUS_TEXT[service.status])}>{service.metricValue}</p></div>
          <div className="rounded-md border border-border bg-panel-soft p-3"><p className="font-mono text-[7px] uppercase text-muted">Pressure</p><p className="mt-2 font-mono text-sm">{service.load}%</p></div>
        </div>
        <div className="mt-4"><div className="flex justify-between font-mono text-[7px] text-muted"><span>load envelope</span><span>{service.load}/100</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.055]"><div className={cn("h-full rounded-full", service.status === "critical" ? "bg-danger" : service.status === "degraded" ? "bg-warning" : "bg-primary")} style={{ width: `${service.load}%` }} /></div></div>
      </div>
    </section>
  );
}

function EvidenceStream({ elapsed, records }: { elapsed: number; records: LabDecisionRecord[] }) {
  const visible = EVIDENCE.filter((item) => elapsed >= item.at).slice(-5).reverse();
  return (
    <section className="panel overflow-hidden">
      <PanelHeading icon={ScanSearch} title="Evidence stream" detail={`${visible.length} signals in window`} />
      <div className="divide-y divide-border">
        {visible.map((item) => <div key={`${item.at}-${item.source}`} className="flex gap-3 px-4 py-3.5"><span className="font-mono text-[7px] text-muted">T+{formatLabTime(item.at)}</span><span className="min-w-0"><span className={cn("block font-mono text-[8px] uppercase", item.tone)}>{item.source}</span><span className="mt-1 block text-[9px] leading-4 text-muted">{item.detail}</span></span></div>)}
        {records.length > 0 && <div className="flex gap-3 px-4 py-3.5"><span className="font-mono text-[7px] text-muted">CMD</span><span><span className="block font-mono text-[8px] uppercase text-primary">Commander</span><span className="mt-1 block text-[9px] leading-4 text-muted">{records.at(-1)?.choiceLabel}</span></span></div>}
      </div>
    </section>
  );
}

function LogStream({ elapsed, records }: { elapsed: number; records: LabDecisionRecord[] }) {
  const systemEntries = SYSTEM_LOGS.filter((entry) => elapsed >= entry.at).map((entry) => ({ ...entry, key: `system-${entry.at}` }));
  const commandEntries = records.map((record) => ({ at: record.chosenAt, level: "CMD", message: record.command, key: `record-${record.decisionId}` }));
  const entries = [...systemEntries, ...commandEntries].sort((a, b) => a.at - b.at).slice(-7).reverse();
  return (
    <section className="panel overflow-hidden">
      <PanelHeading icon={Terminal} title="Event console" detail="Newest first" />
      <div className="max-h-[260px] overflow-y-auto bg-[#070a0c] p-3 font-mono text-[8px] leading-5">
        {entries.map((entry) => <div key={entry.key} className="grid grid-cols-[42px_38px_1fr] gap-2"><span className="text-muted">{formatLabTime(entry.at)}</span><span className={entry.level === "CRIT" || entry.level === "ERROR" ? "text-danger" : entry.level === "WARN" ? "text-warning" : entry.level === "CMD" ? "text-primary" : "text-signal"}>{entry.level}</span><span className="break-all text-[#a5b0b5]">{entry.message}</span></div>)}
      </div>
    </section>
  );
}

function DecisionDialog({ decision, onChoose }: { decision: LabIncidentDecision; onChoose: (choice: LabDecisionChoice) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      window.setTimeout(() => dialog.querySelector<HTMLButtonElement>("button[data-choice]")?.focus(), 0);
    }
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [decision.id]);
  return (
    <dialog ref={dialogRef} onCancel={(event) => event.preventDefault()} className="m-auto w-[min(980px,calc(100%-1.5rem))] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-danger/30 bg-[#0b0f12] p-0 text-foreground shadow-[0_40px_160px_rgba(0,0,0,.8)] backdrop:bg-black/75 backdrop:backdrop-blur-sm" aria-labelledby="decision-title">
      <div className="border-b border-border bg-danger/[0.045] px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-danger/25 bg-danger/[0.07] px-2.5 py-1 font-mono text-[8px] text-danger">DECISION GATE {decision.index}</span><span className="font-mono text-[8px] text-muted">SIMULATION PAUSED</span></div>
        <h2 id="decision-title" className="mt-4 text-xl font-medium tracking-[-0.025em] sm:text-2xl">{decision.title}</h2>
        <p className="mt-2 max-w-3xl text-xs leading-6 text-muted">{decision.situation}</p>
        <div className="mt-4 flex items-center gap-2 rounded-md border border-warning/15 bg-warning/[0.045] px-3 py-2 font-mono text-[9px] text-warning"><Activity aria-hidden="true" className="size-3.5 shrink-0" />{decision.signal}</div>
      </div>
      <div className="grid gap-3 p-4 sm:p-6 lg:grid-cols-3">
        {decision.choices.map((choice, index) => (
          <button
            type="button"
            data-choice
            key={choice.id}
            onClick={() => { dialogRef.current?.close(); onChoose(choice); }}
            className="group flex min-h-[210px] flex-col rounded-lg border border-border bg-panel-soft p-5 text-start outline-none transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.025] focus-visible:border-primary"
          >
            <span className="flex items-center justify-between"><span className="grid size-7 place-items-center rounded-md border border-border font-mono text-[9px] text-primary">{index + 1}</span><ArrowRight aria-hidden="true" className="size-3.5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" /></span>
            <span className="mt-5 text-sm font-medium">{choice.label}</span>
            <span className="mt-2 text-[10px] leading-5 text-muted">{choice.description}</span>
            <code className="mt-auto block break-all border-t border-border pt-4 font-mono text-[8px] leading-4 text-signal">$ {choice.command}</code>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3 font-mono text-[8px] text-muted sm:px-7"><Terminal aria-hidden="true" className="size-3" />Press 1–3 to execute<span className="ms-auto">The rationale is revealed in the debrief.</span></div>
    </dialog>
  );
}

function LabPostmortem({ result, records, onRestart, onDownload }: { result: LabIncidentResult; records: LabDecisionRecord[]; onRestart: () => void; onDownload: () => void }) {
  const ending = {
    sovereign: { eyebrow: "Sovereign recovery", title: "You broke the cascade—and the pattern behind it.", description: "Causal diagnosis, bounded load, progressive warming, and SLO-gated restoration returned the system without a second wave.", tone: "success" as const },
    contained: { eyebrow: "Incident contained", title: "The platform survived. The recovery is incomplete.", description: "You preserved the critical path, but one or more decisions traded full recovery for safety, time, or customer experience.", tone: "warning" as const },
    cascade: { eyebrow: "System cascade", title: "The visible symptom won the response window.", description: "The intervention amplified pressure or restored traffic before the underlying cache and database dynamics were safe.", tone: "danger" as const },
  }[result.ending];
  const verdictScore = (record: LabDecisionRecord) => record.verdict === "optimal" ? 100 : record.verdict === "mixed" ? 68 : 24;
  const average = (items: LabDecisionRecord[]) => Math.round(items.reduce((total, record) => total + verdictScore(record), 0) / Math.max(items.length, 1));
  const competencies = [
    { label: "Causal diagnosis", score: average(records.slice(0, 1)), detail: "trace before symptom", icon: ScanSearch, tone: "signal" as const },
    { label: "Load containment", score: average(records.slice(1, 4)), detail: "coalesce · gate · degrade", icon: ShieldCheck, tone: "primary" as const },
    { label: "Recovery discipline", score: average(records.slice(4, 6)), detail: "warm progressively · SLO gate", icon: TrendingDown, tone: "success" as const },
    { label: "Command efficiency", score: Math.min(100, Math.round((result.score + result.accuracy) / 2)), detail: `${formatLabTime(result.mttrSeconds)} modeled MTTR`, icon: TimerReset, tone: "inference" as const },
  ];
  const weakest = [...competencies].sort((a, b) => a.score - b.score)[0];
  return (
    <div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader eyebrow={`Crisis Lab · ${ending.eyebrow}`} title={ending.title} description={ending.description} actions={<StatusPill tone={ending.tone} dot>Grade {result.grade}</StatusPill>} />
      <section className={cn("panel relative mt-7 overflow-hidden p-6 sm:p-8", result.ending === "cascade" ? "border-danger/25" : result.ending === "contained" ? "border-warning/25" : "border-primary/20")}>
        <div aria-hidden="true" className={cn("absolute -end-20 -top-32 size-[420px] rounded-full blur-3xl", result.ending === "cascade" ? "bg-danger/[0.06]" : result.ending === "contained" ? "bg-warning/[0.055]" : "bg-primary/[0.055]")} />
        <div className="relative grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className={cn("grid size-28 place-items-center rounded-2xl border font-mono text-6xl tracking-[-0.08em]", result.ending === "cascade" ? "border-danger/25 bg-danger/[0.055] text-danger" : result.ending === "contained" ? "border-warning/25 bg-warning/[0.055] text-warning" : "border-primary/25 bg-primary/[0.055] text-primary")}>{result.grade}</div>
          <div><p className="eyebrow">Command score</p><p className="mt-2 font-mono text-4xl tabular">{result.score}<span className="text-base text-muted"> / 100</span></p><p className="mt-3 max-w-2xl text-xs leading-6 text-muted">Root cause confirmed: synchronized TTL expiry → origin stampede → database pool exhaustion → checkout cascade.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button type="button" onClick={onDownload} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-[10px] font-semibold text-primary-foreground"><Download aria-hidden="true" className="size-3.5" />Export after-action report</button>
            <button type="button" onClick={onRestart} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-[10px] text-muted hover:text-foreground"><RotateCcw aria-hidden="true" className="size-3.5" />Run scenario again</button>
          </div>
        </div>
      </section>

      <section aria-label="Simulation results" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResultMetric icon={Clock3} label="Modeled MTTR" value={formatLabTime(result.mttrSeconds)} detail="from first signal" />
        <ResultMetric icon={BrainCircuit} label="Decision accuracy" value={`${result.accuracy}%`} detail={`${records.filter((record) => record.verdict === "optimal").length} optimal commands`} />
        <ResultMetric icon={UsersRound} label="Peak affected" value={result.peakAffectedUsers.toLocaleString("en-US")} detail="modeled users" />
        <ResultMetric icon={ShieldCheck} label="Revenue protected" value={`$${result.revenueProtected.toLocaleString("en-US")}`} detail={`$${result.revenueLost.toLocaleString("en-US")} lost`} />
      </section>

      <section aria-labelledby="competency-title" className="panel panel-luminous mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div><p id="competency-title" className="text-xs font-medium">Incident command competency</p><p className="mt-1 font-mono text-[8px] text-muted">SRE response rubric · deterministic evidence from this run</p></div>
          <StatusPill tone="primary" className="ms-auto">4 dimensions</StatusPill>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {competencies.map((competency) => (
              <CompetencyBar key={competency.label} {...competency} />
            ))}
          </div>
          <aside className="border-t border-border bg-panel-soft p-5 lg:border-s lg:border-t-0">
            <div className="flex items-center gap-2"><BrainCircuit aria-hidden="true" className="size-4 text-inference" /><p className="eyebrow text-inference">Assessor readout</p></div>
            <h3 className="mt-4 text-sm font-medium leading-6">{result.ending === "sovereign" ? "You controlled both the incident and the recovery envelope." : `Prioritize ${weakest.label.toLowerCase()} in the next run.`}</h3>
            <p className="mt-2 text-[10px] leading-5 text-muted">{result.ending === "sovereign" ? "Every intervention reduced causal pressure while preserving the checkout path. The progressive warm-up prevented a second-wave regression." : `The ${weakest.label.toLowerCase()} dimension scored ${weakest.score}. Re-run the scenario and compare the system model before committing at that gate.`}</p>
            <dl className="mt-5 space-y-2 border-t border-border pt-4 font-mono text-[8px]">
              <ActionReadout label="Reference match" value={`${records.filter((record) => record.verdict === "optimal").length} / 6 decisions`} />
              <ActionReadout label="Recovery safety" value={result.ending === "sovereign" ? "No second wave" : "Review required"} />
              <ActionReadout label="Run attestation" value={`lab047-${result.score}-${records.length}`} />
            </dl>
          </aside>
        </div>
      </section>

      <section className="panel mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><p className="text-xs font-medium">Command timeline</p><p className="mt-1 font-mono text-[8px] text-muted">Canonical rationale · tamper-resistant scoring</p></div><StatusPill tone="signal">6 decision gates</StatusPill></div>
        <div className="divide-y divide-border">
          {records.map((record, index) => (
            <article key={record.decisionId} className="grid gap-3 px-4 py-5 sm:px-5 lg:grid-cols-[70px_minmax(180px,.65fr)_minmax(240px,1fr)_110px] lg:items-start">
              <span className="font-mono text-[8px] text-muted">T+{formatLabTime(record.chosenAt)}</span>
              <div><span className="font-mono text-[8px] text-primary">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-1 text-[11px] font-medium">{record.choiceLabel}</h3><code className="mt-2 block break-all font-mono text-[7px] leading-4 text-signal">$ {record.command}</code></div>
              <p className="text-[10px] leading-5 text-muted">{record.rationale}</p>
              <StatusPill tone={record.verdict === "optimal" ? "success" : record.verdict === "mixed" ? "warning" : "danger"}>{record.verdict} {record.scoreDelta > 0 ? "+" : ""}{record.scoreDelta}</StatusPill>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-panel-soft p-5 sm:flex-row sm:items-center">
        <span className="grid size-9 place-items-center rounded-md border border-primary/15 bg-primary/[0.055] text-primary"><Siren aria-hidden="true" className="size-4" /></span>
        <div><p className="text-[11px] font-medium">Move from training twin to evidence-backed operations.</p><p className="mt-1 text-[9px] text-muted">Inspect THREADLINE&apos;s resolved incident room and compare simulated judgment with a verified recovery.</p></div>
        <Link href="/incidents/inc-2471" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-[10px] text-muted hover:text-foreground sm:ms-auto">Open Incident Room<ArrowRight aria-hidden="true" className="size-3" /></Link>
      </div>
    </div>
  );
}

function ResultMetric({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) {
  return <div className="panel p-4 sm:p-5"><div className="flex items-center gap-2 text-muted"><Icon aria-hidden="true" className="size-3.5" /><span className="font-mono text-[8px] uppercase tracking-[0.08em]">{label}</span></div><p className="mt-4 font-mono text-xl tabular tracking-[-0.035em]">{value}</p><p className="mt-1 font-mono text-[7px] text-muted">{detail}</p></div>;
}

function CompetencyBar({ icon: Icon, label, score, detail, tone }: { icon: typeof Activity; label: string; score: number; detail: string; tone: "signal" | "primary" | "success" | "inference" }) {
  const toneClass = { signal: "text-signal", primary: "text-primary", success: "text-success", inference: "text-inference" }[tone];
  const fillClass = { signal: "from-signal/55 to-signal", primary: "from-primary/55 to-primary", success: "from-success/55 to-success", inference: "from-inference/55 to-inference" }[tone];
  return <article className="bg-panel p-5"><div className="flex items-start gap-3"><span className={cn("grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background", toneClass)}><Icon aria-hidden="true" className="size-3.5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h3 className="text-[11px] font-medium">{label}</h3><span className={cn("font-mono text-sm tabular", toneClass)}>{score}</span></div><p className="mt-1 font-mono text-[7px] text-muted">{detail}</p><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]" role="meter" aria-label={`${label} ${score} out of 100`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}><div className={cn("h-full rounded-full bg-gradient-to-r", fillClass)} style={{ width: `${score}%` }} /></div></div></div></article>;
}

function ActionReadout({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-muted">{label}</dt><dd className="text-end text-foreground">{value}</dd></div>;
}
