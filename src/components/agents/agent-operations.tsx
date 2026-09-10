"use client";

import { useState } from "react";
import {
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDashed,
  Code2,
  FileCheck2,
  GitPullRequest,
  MoreHorizontal,
  Pause,
  Play,
  Radar,
  SearchCode,
  ShieldCheck,
  Sparkles,
  Terminal,
  TimerReset,
  TriangleAlert,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

type AgentStatus = "running" | "review" | "scheduled";
type AgentRuntimeStatus = AgentStatus | "paused" | "reviewed";
type AgentFilter = "all" | AgentStatus;

type AgentStep = {
  label: string;
  detail: string;
  state: "complete" | "active" | "queued" | "warning";
  kind?: "approval";
  time?: string;
};

type AgentRun = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  task: string;
  repo: string;
  target: string;
  progress: number;
  elapsed: string;
  eta: string;
  icon: LucideIcon;
  accent: "lime" | "cyan" | "violet" | "amber";
  summary: string;
  trigger: string;
  confidence: number;
  context: string[];
  output: string;
  steps: AgentStep[];
};

const agents: AgentRun[] = [
  {
    id: "run-slo-checkout",
    name: "SLO Guard",
    role: "Error-budget guardian",
    status: "running",
    task: "Guard checkout error budget after INC-2471",
    repo: "meridian/checkout-api",
    target: "INC-2471",
    progress: 68,
    elapsed: "8m 42s",
    eta: "~4m",
    icon: ShieldCheck,
    accent: "lime",
    summary: "Watches multi-window burn rate after the incident and holds risky checkout deployments until recovery is durable.",
    trigger: "INC-2471 moved to resolved",
    confidence: 96,
    context: ["Checkout SLO policy", "30-day error budget", "INC-2471 evidence", "deployment hold rules"],
    output: "Verified recovery + deployment hold decision",
    steps: [
      { label: "Recalculate error budget", detail: "Thirty-day budget remaining is 42.6%", state: "complete", time: "2m 11s" },
      { label: "Verify flag disable", detail: "instant-tax-v2 disabled; checkout p95 returned to baseline", state: "complete", time: "1m 34s" },
      { label: "Watch recovery window", detail: "Two-hour burn rate remains below 1×", state: "active", time: "in progress" },
      { label: "Release deployment hold", detail: "Requires 120 stable minutes", state: "queued" },
    ],
  },
  {
    id: "run-postmortem-2471",
    name: "Postmortem",
    role: "Incident review writer",
    status: "running",
    task: "Draft the evidence-linked INC-2471 review",
    repo: "meridian/checkout-api",
    target: "INC-2471",
    progress: 56,
    elapsed: "3m 18s",
    eta: "~1m",
    icon: FileCheck2,
    accent: "cyan",
    summary: "Builds a verifiable incident timeline with causal evidence, corrective actions, and owner sign-off.",
    trigger: "INC-2471 resolved",
    confidence: 94,
    context: ["12 timeline events", "7 primary evidence items", "checkout runbook", "service ownership graph"],
    output: "Evidence-linked incident review",
    steps: [
      { label: "Assemble incident timeline", detail: "Twelve events normalized to UTC", state: "complete", time: "44s" },
      { label: "Verify causal claims", detail: "Every claim links to primary evidence", state: "complete", time: "1m 02s" },
      { label: "Draft corrective actions", detail: "Retry-budget and graduated flag rollout gates", state: "active", time: "in progress" },
      { label: "Request owner sign-off", detail: "Checkout Reliability and Core Platform", state: "queued" },
    ],
  },
  {
    id: "cartographer-nightly",
    name: "Cartographer",
    role: "Dependency mapper",
    status: "scheduled",
    task: "Refresh dependency and ownership graph",
    repo: "organization-wide",
    target: "8 services",
    progress: 0,
    elapsed: "—",
    eta: "01:00 UTC",
    icon: Radar,
    accent: "violet",
    summary: "Reconciles declared dependencies against runtime traces and repository ownership every night.",
    trigger: "Nightly topology refresh",
    confidence: 97,
    context: ["8 service manifests", "OpenTelemetry traces", "CODEOWNERS history", "deployment registry"],
    output: "Verified system map delta",
    steps: [
      { label: "Read service manifests", detail: "Collect declared dependencies", state: "queued" },
      { label: "Compare runtime traces", detail: "Find undeclared edges", state: "queued" },
      { label: "Reconcile ownership", detail: "Map CODEOWNERS and on-call", state: "queued" },
      { label: "Publish graph delta", detail: "Request owner verification", state: "queued" },
    ],
  },
  {
    id: "run-release-835",
    name: "Release Reviewer",
    role: "Readiness verifier",
    status: "review",
    task: "Review payment token SDK 6.4.2 rollout",
    repo: "meridian/payments",
    target: "PR #835",
    progress: 82,
    elapsed: "11m 26s",
    eta: "Done",
    icon: SearchCode,
    accent: "amber",
    summary: "Automated checks passed; the production rollout is held at the Money Movement approval boundary.",
    trigger: "PR #835 entered production queue",
    confidence: 91,
    context: ["payment-token 6.4.2 diff", "PCI control set", "canary traces", "rollback runbook"],
    output: "Payment SDK release decision",
    steps: [
      { label: "Inspect dependency diff", detail: "No transitive runtime packages added", state: "complete", time: "2m 41s" },
      { label: "Compare canary traces", detail: "p95 authorization latency +0.7%", state: "complete", time: "6m 03s" },
      { label: "Check PCI controls", detail: "Attestation and redaction passed", state: "complete", time: "1m 52s" },
      { label: "Human rollout decision", detail: "Money Movement owner approval required", state: "warning", kind: "approval" },
    ],
  },
  {
    id: "groundskeeper-12",
    name: "Groundskeeper",
    role: "Code health steward",
    status: "scheduled",
    task: "Find stale feature flags and unreachable branches",
    repo: "organization-wide",
    target: "12 repositories",
    progress: 0,
    elapsed: "—",
    eta: "02:00 UTC",
    icon: Code2,
    accent: "lime",
    summary: "Weekly hygiene pass that validates flag state against runtime telemetry before suggesting deletion patches.",
    trigger: "Every Tuesday",
    confidence: 94,
    context: ["12 repositories", "feature flag registry", "30 days of evaluations", "ownership graph"],
    output: "Cleanup PR bundle",
    steps: [
      { label: "Snapshot flag registry", detail: "Read current production state", state: "queued" },
      { label: "Find unreachable paths", detail: "Cross-check static and runtime usage", state: "queued" },
      { label: "Generate safe patches", detail: "One patch per owner boundary", state: "queued" },
    ],
  },
  {
    id: "briefing-05",
    name: "Briefing",
    role: "Team intelligence",
    status: "scheduled",
    task: "Prepare the Monday engineering context brief",
    repo: "organization-wide",
    target: "Engineering leads",
    progress: 0,
    elapsed: "—",
    eta: "Mon 08:30",
    icon: BrainCircuit,
    accent: "cyan",
    summary: "Synthesizes consequential changes, emerging risks, and cross-team decisions into one context brief.",
    trigger: "Every Monday",
    confidence: 97,
    context: ["change ledger", "incident timeline", "decision log", "ownership graph"],
    output: "Weekly context brief",
    steps: [
      { label: "Collect weekly signals", detail: "Changes, decisions, and incidents", state: "queued" },
      { label: "Rank by consequence", detail: "Score cross-team impact", state: "queued" },
      { label: "Compose brief", detail: "Tailor summaries by audience", state: "queued" },
    ],
  },
];

const filters: Array<{ id: AgentFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "running", label: "In progress" },
  { id: "review", label: "Needs review" },
  { id: "scheduled", label: "Scheduled" },
];

const accentStyles = {
  lime: { icon: "bg-[#b7f34b]/10 text-[#b7f34b] ring-[#b7f34b]/20", bar: "bg-[#b7f34b]" },
  cyan: { icon: "bg-cyan-300/10 text-cyan-300 ring-cyan-300/20", bar: "bg-cyan-300" },
  violet: { icon: "bg-violet-300/10 text-violet-300 ring-violet-300/20", bar: "bg-violet-300" },
  amber: { icon: "bg-amber-300/10 text-amber-300 ring-amber-300/20", bar: "bg-amber-300" },
};

function matchesFilter(status: AgentRuntimeStatus, filter: AgentFilter) {
  if (filter === "all") return true;
  if (filter === "running") return status === "running" || status === "paused";
  if (filter === "review") return status === "review";
  return status === "scheduled";
}

function filterForStatus(status: AgentRuntimeStatus): AgentFilter {
  if (status === "paused") return "running";
  if (status === "reviewed") return "all";
  return status;
}

function displayedProgress(agent: AgentRun, status: AgentRuntimeStatus) {
  if (status === "scheduled") return 0;
  if (status === "reviewed") {
    const completed = agent.steps.filter((step) => step.state === "complete" || step.kind === "approval").length;
    return Math.round((completed / agent.steps.length) * 100);
  }
  return agent.progress;
}

function runtimeSummary(agent: AgentRun, status: AgentRuntimeStatus, progress: number) {
  if (status === "scheduled") return agent.eta;
  if (status === "review") return "Decision pending";
  if (status === "reviewed") return `Reviewed · ${progress}%`;
  if (status === "paused") return `Paused · ${progress}%`;
  return `${progress}%`;
}

function traceSummary(agent: AgentRun, status: AgentRuntimeStatus) {
  if (status === "scheduled") return agent.eta;
  if (status === "review") return "Human decision pending";
  if (status === "reviewed") return "Review complete";
  if (status === "paused") return `Paused · ${agent.eta}`;
  return `Snapshot ETA ${agent.eta}`;
}

function displayedSteps(agent: AgentRun, status: AgentRuntimeStatus): AgentStep[] {
  if (status === "reviewed") {
    return agent.steps.map((step) => step.kind === "approval"
      ? { ...step, state: "complete", detail: "Approval gate acknowledged in this demo. Production rollout has not been executed.", time: "demo review" }
      : step);
  }
  return agent.steps;
}

export function AgentOperations() {
  const [filter, setFilter] = useState<AgentFilter>("all");
  const [selectedId, setSelectedId] = useState(agents[0].id);
  const [runtimeStatuses, setRuntimeStatuses] = useState<Record<string, AgentRuntimeStatus>>(
    () => Object.fromEntries(agents.map((agent) => [agent.id, agent.status])) as Record<string, AgentRuntimeStatus>,
  );

  const visibleAgents = agents.filter((agent) => matchesFilter(runtimeStatuses[agent.id] ?? agent.status, filter));
  const selectedAgent = agents.find((agent) => agent.id === selectedId) ?? visibleAgents[0] ?? agents[0];
  const selectedRuntimeStatus = runtimeStatuses[selectedAgent.id] ?? selectedAgent.status;
  const activeNow = Object.values(runtimeStatuses).filter((status) => status === "running").length;
  const needsReview = Object.values(runtimeStatuses).filter((status) => status === "review").length;

  function chooseFilter(nextFilter: AgentFilter) {
    setFilter(nextFilter);
    const first = agents.find((agent) => matchesFilter(runtimeStatuses[agent.id] ?? agent.status, nextFilter));
    if (first && !matchesFilter(selectedRuntimeStatus, nextFilter)) setSelectedId(first.id);
  }

  function selectScheduledAgent() {
    const scheduledAgent = agents.find((agent) => (runtimeStatuses[agent.id] ?? agent.status) === "scheduled");
    if (!scheduledAgent) return;
    setFilter("scheduled");
    setSelectedId(scheduledAgent.id);
  }

  function updateRuntimeStatus(agentId: string, status: AgentRuntimeStatus) {
    setRuntimeStatuses((current) => ({ ...current, [agentId]: status }));
    if (!matchesFilter(status, filter)) setFilter(filterForStatus(status));
  }

  return (
    <section className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b7f34b]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Autonomous context
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Agents</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Specialized agents keep your architecture explainable, verify risky changes, and surface decisions that need a human.
          </p>
        </div>
        <button type="button" onClick={selectScheduledAgent} disabled={!agents.some((agent) => (runtimeStatuses[agent.id] ?? agent.status) === "scheduled")} className="flex h-10 w-fit items-center gap-2 rounded-lg bg-[#b7f34b] px-4 text-xs font-semibold text-[#14200d] transition hover:bg-[#c9fa75] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f34b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d0b] disabled:cursor-not-allowed disabled:opacity-50">
          <WandSparkles className="size-4" aria-hidden="true" />
          Select scheduled agent
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AgentMetric label="Active now" value={String(activeNow).padStart(2, "0")} detail="24 tasks completed today" icon={Zap} trend="live" />
        <AgentMetric label="Needs review" value={String(needsReview).padStart(2, "0")} detail="rollout decision pending" icon={TriangleAlert} trend="warn" />
        <AgentMetric label="Time returned" value="18.4h" detail="across the last 7 days" icon={TimerReset} trend="good" />
        <AgentMetric label="Acceptance" value="92%" detail="of agent recommendations" icon={CheckCircle2} trend="good" />
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e0c] xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="border-b border-white/10 xl:border-b-0 xl:border-r">
          <div className="border-b border-white/10 p-3">
            <div className="flex gap-1 overflow-x-auto rounded-lg border border-white/[0.08] bg-white/[0.025] p-1" role="group" aria-label="Filter agents by status">
              {filters.map((option) => {
                const active = filter === option.id;
                const count = agents.filter((agent) => matchesFilter(runtimeStatuses[agent.id] ?? agent.status, option.id)).length;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chooseFilter(option.id)}
                    className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[10px] transition ${active ? "bg-white/10 font-medium text-white" : "text-white/55 hover:text-white/70"}`}
                  >
                    {option.label}<span className={`font-mono text-[9px] ${active ? "text-[#b7f34b]" : "text-white/50"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[720px] divide-y divide-white/[0.07] overflow-y-auto">
            {visibleAgents.map((agent) => {
              const Icon = agent.icon;
              const selected = agent.id === selectedAgent.id;
              const accent = accentStyles[agent.accent];
              const runtimeStatus = runtimeStatuses[agent.id] ?? agent.status;
              const progress = displayedProgress(agent, runtimeStatus);
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedId(agent.id)}
                  aria-pressed={selected}
                  className={`relative w-full p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b7f34b]/60 ${selected ? "bg-white/[0.055]" : "hover:bg-white/[0.025]"}`}
                >
                  {selected ? <span className="absolute inset-y-3 left-0 w-0.5 rounded-r bg-[#b7f34b]" /> : null}
                  <div className="flex gap-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${accent.icon}`}>
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span>
                          <span className="block text-xs font-semibold text-white/80">{agent.name}</span>
                          <span className="mt-0.5 block text-[9px] uppercase tracking-[0.11em] text-white/50">{agent.role}</span>
                        </span>
                        <StatusLabel status={runtimeStatus} />
                      </span>
                      <span className="mt-3 line-clamp-2 block text-xs leading-5 text-white/52">{agent.task}</span>
                      <span className="mt-3 flex items-center justify-between font-mono text-[9px] text-white/50">
                        <span className="truncate">{agent.repo}</span>
                        <span>{runtimeSummary(agent, runtimeStatus, progress)}</span>
                      </span>
                      {runtimeStatus === "running" || runtimeStatus === "paused" || runtimeStatus === "review" || runtimeStatus === "reviewed" ? (
                        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label={`${agent.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                          <span className={`block h-full rounded-full transition-all ${runtimeStatus === "paused" ? "bg-white/35" : accent.bar}`} style={{ width: `${progress}%` }} />
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight className={`mt-2 size-3.5 shrink-0 ${selected ? "text-[#b7f34b]" : "text-white/15"}`} aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <AgentDetail key={selectedAgent.id} agent={selectedAgent} runtimeStatus={selectedRuntimeStatus} onStatusChange={(status) => updateRuntimeStatus(selectedAgent.id, status)} />
      </div>
    </section>
  );
}

function AgentDetail({ agent, runtimeStatus, onStatusChange }: { agent: AgentRun; runtimeStatus: AgentRuntimeStatus; onStatusChange: (status: AgentRuntimeStatus) => void }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const Icon = agent.icon;
  const accent = accentStyles[agent.accent];
  const progress = displayedProgress(agent, runtimeStatus);
  const steps = displayedSteps(agent, runtimeStatus);
  const statusDetail = runtimeStatus === "review" ? "awaiting decision" : runtimeStatus;
  return (
    <article className="min-w-0 bg-[radial-gradient(circle_at_90%_0%,rgba(183,243,75,0.04),transparent_28%)]">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 gap-3.5">
          <span className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${accent.icon}`}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-white">{agent.name}</h2>
              <StatusLabel status={runtimeStatus} />
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/50">{agent.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {runtimeStatus === "running" ? (
            <button type="button" onClick={() => onStatusChange("paused")} className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[10px] font-medium text-white/60 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f34b]/70">
              <Pause className="size-3" aria-hidden="true" /> Pause
            </button>
          ) : runtimeStatus === "paused" ? (
            <button type="button" onClick={() => onStatusChange("running")} className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[10px] font-medium text-white/60 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f34b]/70">
              <Play className="size-3" aria-hidden="true" /> Resume
            </button>
          ) : runtimeStatus === "scheduled" ? (
            <button type="button" aria-expanded={previewOpen} aria-controls="agent-plan-preview" onClick={() => setPreviewOpen((open) => !open)} className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[10px] font-medium text-white/60 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f34b]/70">
              <SearchCode className="size-3" aria-hidden="true" /> {previewOpen ? "Close preview" : "Preview run"}
            </button>
          ) : (
            <button type="button" disabled={runtimeStatus === "reviewed"} onClick={() => onStatusChange("reviewed")} className="flex h-8 items-center gap-1.5 rounded-lg bg-[#b7f34b] px-3 text-[10px] font-semibold text-[#14200d] hover:bg-[#c9fa75] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f34b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d0b] disabled:opacity-60">
              <FileCheck2 className="size-3" aria-hidden="true" /> {runtimeStatus === "reviewed" ? "Review recorded" : "Record demo review"}
            </button>
          )}
          <button type="button" disabled aria-label="More agent options unavailable in demo" className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/20">
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {previewOpen && runtimeStatus === "scheduled" ? (
          <section id="agent-plan-preview" aria-label="Agent run preview" className="mb-5 rounded-xl border border-violet-300/20 bg-violet-300/[0.045] p-4">
            <p className="text-xs font-semibold text-violet-200">Execution plan preview</p>
            <p className="mt-2 text-xs leading-5 text-white/65">Inspect the {agent.steps.length}-step plan and {agent.context.length} source inputs below. This preview does not launch a background job; the run remains scheduled.</p>
            <dl className="mt-4 grid gap-3 text-[10px] sm:grid-cols-3">
              <div><dt className="text-white/45">Scope</dt><dd className="mt-1 font-mono text-white/80">{agent.target}</dd></div>
              <div><dt className="text-white/45">Planned output</dt><dd className="mt-1 text-white/80">{agent.output}</dd></div>
              <div><dt className="text-white/45">Publication boundary</dt><dd className="mt-1 text-white/80">Owner verification required</dd></div>
            </dl>
          </section>
        ) : null}
        {runtimeStatus === "reviewed" ? <p role="status" className="mb-5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-3 text-[11px] leading-5 text-cyan-100/80">Demo review recorded. Only the human approval gate is acknowledged; warning findings and unfinished checks remain unchanged. No production action was sent.</p> : null}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b7f34b]">Current mission</p>
              <h3 className="mt-2 text-base font-medium leading-6 text-white/85">{agent.task}</h3>
              <p className="mt-2 text-xs leading-5 text-white/60">{agent.summary}</p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="font-mono text-2xl font-medium text-white">{runtimeStatus === "scheduled" ? "—" : `${progress}%`}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/50">{statusDetail}</p>
            </div>
          </div>
          {runtimeStatus !== "scheduled" ? (
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label={`${agent.name} mission progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className={`h-full rounded-full transition-all ${runtimeStatus === "paused" ? "bg-white/35" : accent.bar}`} style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <DetailMetric label="Target" value={agent.target} />
            <DetailMetric label="Trigger" value={agent.trigger} />
            <DetailMetric label="Snapshot elapsed" value={agent.elapsed} mono />
            <DetailMetric label="Evidence inputs" value={`${agent.context.length} sources`} mono />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(230px,.6fr)]">
          <section>
            <SectionLabel icon={Terminal} label="Execution trace" side={traceSummary(agent, runtimeStatus)} />
            <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#080b09]">
              {steps.map((step, index) => (
                <div key={step.label} className="relative flex gap-3 px-4 py-3.5">
                  {index < agent.steps.length - 1 ? <span className="absolute bottom-0 left-[23px] top-8 w-px bg-white/[0.08]" /> : null}
                  <StepIcon state={step.state} paused={runtimeStatus === "paused" && step.state === "active"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-xs ${step.state === "active" ? "font-medium text-white" : step.state === "warning" ? "font-medium text-amber-200" : step.state === "complete" ? "text-white/60" : "text-white/50"}`}>{step.label}</p>
                      {step.time ? <span className="shrink-0 font-mono text-[9px] text-white/50">{step.time}</span> : null}
                    </div>
                    <p className="mt-1 text-[10px] leading-4 text-white/50">{step.detail}</p>
                    {step.state === "active" ? (
                      <div className={`mt-2 flex items-center gap-1.5 text-[9px] ${runtimeStatus === "paused" ? "text-white/55" : "text-[#b7f34b]/70"}`}>
                        <span className={`size-1 rounded-full ${runtimeStatus === "paused" ? "bg-white/35" : "animate-pulse bg-[#b7f34b]"}`} /> {runtimeStatus === "paused" ? "Paused by operator" : "Working now"}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-5">
            <section>
              <SectionLabel icon={BrainCircuit} label="Context loaded" side={`${agent.context.length} sources`} />
              <div className="mt-3 space-y-2">
                {agent.context.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[10px] text-white/55">
                    <Check className="size-3 shrink-0 text-[#b7f34b]" aria-hidden="true" />
                    <span className="min-w-0 truncate">{item}</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <SectionLabel icon={GitPullRequest} label="Expected output" />
              <div className="mt-3 rounded-lg border border-dashed border-white/10 bg-white/[0.015] p-3">
                <p className="text-xs text-white/52">{agent.output}</p>
                <p className="mt-1.5 text-[9px] leading-4 text-white/50">Evidence remains linked to every recommendation for human verification.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}

function AgentMetric({ label, value, detail, icon: Icon, trend }: { label: string; value: string; detail: string; icon: LucideIcon; trend: "live" | "warn" | "good" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0c100e] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">{label}</p>
        <span className={`grid size-7 place-items-center rounded-lg ${trend === "warn" ? "bg-amber-300/10 text-amber-300" : trend === "live" ? "bg-cyan-300/10 text-cyan-300" : "bg-[#b7f34b]/10 text-[#b7f34b]"}`}>
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 font-mono text-2xl font-medium text-white">{value}</p>
      <p className="mt-1 text-[10px] text-white/50">{detail}</p>
    </div>
  );
}

function StatusLabel({ status }: { status: AgentRuntimeStatus }) {
  const labels: Record<AgentRuntimeStatus, string> = { running: "Running", paused: "Paused", review: "Needs review", reviewed: "Reviewed", scheduled: "Scheduled" };
  const styles = {
    running: "border-[#b7f34b]/20 bg-[#b7f34b]/10 text-[#c9fa75]",
    paused: "border-white/15 bg-white/[0.055] text-white/50",
    review: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    reviewed: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
    scheduled: "border-white/10 bg-white/[0.035] text-white/50",
  };
  return (
    <span aria-live="polite" className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] ${styles[status]}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${status === "running" ? "animate-pulse bg-[#b7f34b]" : status === "review" ? "bg-amber-300" : status === "reviewed" ? "bg-cyan-300" : "bg-white/25"}`} />
      {labels[status]}
    </span>
  );
}

function DetailMetric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-black/10 px-3 py-2.5">
      <p className="text-[8px] uppercase tracking-[0.13em] text-white/50">{label}</p>
      <p className={`mt-1 truncate text-[10px] text-white/52 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function SectionLabel({ icon: Icon, label, side }: { icon: LucideIcon; label: string; side?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-white/32" aria-hidden="true" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">{label}</h3>
      </div>
      {side ? <span className="font-mono text-[9px] text-white/50">{side}</span> : null}
    </div>
  );
}

function StepIcon({ state, paused = false }: { state: AgentStep["state"]; paused?: boolean }) {
  if (state === "complete") return <span className="relative z-10 grid size-4 shrink-0 place-items-center rounded-full bg-[#b7f34b]/15 text-[#b7f34b]"><Check className="size-2.5" aria-hidden="true" /></span>;
  if (state === "active" && paused) return <span className="relative z-10 grid size-4 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/45"><Pause className="size-2.5" aria-hidden="true" /></span>;
  if (state === "active") return <span className="relative z-10 grid size-4 shrink-0 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-300"><CircleDashed className="size-2.5 animate-spin" aria-hidden="true" /></span>;
  if (state === "warning") return <span className="relative z-10 grid size-4 shrink-0 place-items-center rounded-full bg-amber-300/15 text-amber-300"><TriangleAlert className="size-2.5" aria-hidden="true" /></span>;
  return <span className="relative z-10 grid size-4 shrink-0 place-items-center rounded-full bg-[#080b09]"><Circle className="size-3 text-white/15" aria-hidden="true" /></span>;
}
