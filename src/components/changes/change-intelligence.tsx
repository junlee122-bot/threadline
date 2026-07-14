"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { changes as demoChanges } from "@/lib/demo-data";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Code2,
  FileCode2,
  GitCommitHorizontal,
  GitPullRequest,
  Search,
  ShieldAlert,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

type Risk = "critical" | "watch" | "routine";
type ChangeStatus = "Review now" | "Analyzing" | "Ready" | "Merged" | "Mitigated";

type Change = {
  id: string;
  number: string;
  title: string;
  repo: string;
  branch: string;
  author: string;
  initials: string;
  risk: Risk;
  score: number;
  status: ChangeStatus;
  updated: string;
  files: number;
  additions: number;
  deletions: number;
  summary: string;
  reason: string;
  impactPath: string[];
  checks: Array<{ label: string; status: "passed" | "warning" | "running"; detail: string }>;
  touchedFiles: Array<{ path: string; delta: string; tone: "add" | "mixed" }>;
  reviewers: string[];
};

const changes: Change[] = [
  {
    id: "chg-1842",
    number: "#1842",
    title: "Retry outbound tax quote requests",
    repo: "meridian/checkout-api",
    branch: "maya/tax-quote-retries",
    author: "Maya Chen",
    initials: "MC",
    risk: "critical",
    score: 92,
    status: "Mitigated",
    updated: "3m ago",
    files: 7,
    additions: 184,
    deletions: 63,
    summary: "Raises outbound tax quote retries from one to three; the code remains deployed while instant-tax-v2 is safely disabled.",
    reason: "At 100% flag exposure, retry amplification saturated the tax-adapter pool, lifted p95 from 680 ms to 1.84 s, and reduced checkout conversion 7.3% relative.",
    impactPath: ["checkout-api", "instant-tax-v2", "tax-adapter", "checkout conversion"],
    checks: [
      { label: "Trace evidence", status: "warning", detail: "92% of slow traces waited on the tax pool" },
      { label: "Load-test gate", status: "warning", detail: "100% exposure case was not modeled" },
      { label: "Recovery verification", status: "passed", detail: "p95 stayed below 800 ms for five minutes" },
    ],
    touchedFiles: [
      { path: "src/tax/quote-retry-policy.ts", delta: "+82 −31", tone: "mixed" },
      { path: "src/flags/instant-tax-v2.ts", delta: "+54 −22", tone: "mixed" },
      { path: "tests/tax-quote-retries.test.ts", delta: "+48 −10", tone: "mixed" },
    ],
    reviewers: ["Commerce Core", "Core Platform", "Shopping Experience"],
  },
  {
    id: "chg-839",
    number: "#839",
    title: "Show promotion savings in cart summary",
    repo: "meridian/cart",
    branch: "mira/promo-summary",
    author: "Mira Shah",
    initials: "MS",
    risk: "watch",
    score: 46,
    status: "Merged",
    updated: "12m ago",
    files: 12,
    additions: 242,
    deletions: 41,
    summary: "Adds customer-facing promotion savings to the cart and storefront summary.",
    reason: "The cross-service presentation contract is covered, but cart and storefront must deploy compatible representations.",
    impactPath: ["catalog", "cart", "web-storefront"],
    checks: [
      { label: "Contract compatibility", status: "passed", detail: "Cart and storefront aligned" },
      { label: "Visual regression", status: "passed", detail: "48 baselines matched" },
      { label: "Runtime simulation", status: "passed", detail: "No regression detected" },
    ],
    touchedFiles: [
      { path: "src/cart/promotion-summary.ts", delta: "+132 −22", tone: "mixed" },
      { path: "src/contracts/cart-view.ts", delta: "+44 −19", tone: "mixed" },
    ],
    reviewers: ["Shopping Experience", "Merchandising"],
  },
  {
    id: "chg-836",
    number: "#836",
    title: "Add inventory reservation span attributes",
    repo: "meridian/inventory",
    branch: "leo/reservation-otel-attrs",
    author: "Leo Martins",
    initials: "LM",
    risk: "routine",
    score: 18,
    status: "Merged",
    updated: "18m ago",
    files: 4,
    additions: 67,
    deletions: 12,
    summary: "Adds reservation identifiers and outcomes to OpenTelemetry spans.",
    reason: "Telemetry-only changes stay outside the request contract and pass cardinality safety checks.",
    impactPath: ["inventory", "OpenTelemetry", "incident evidence"],
    checks: [
      { label: "Span cardinality", status: "passed", detail: "Inside telemetry budget" },
      { label: "Test confidence", status: "passed", detail: "86 / 86 passed" },
      { label: "Runtime contract", status: "passed", detail: "No request-path changes" },
    ],
    touchedFiles: [
      { path: "src/reservations/tracing.ts", delta: "+52 −8", tone: "mixed" },
      { path: "src/telemetry/attributes.ts", delta: "+15", tone: "add" },
    ],
    reviewers: ["Fulfillment Platform", "Core Platform"],
  },
  {
    id: "chg-835",
    number: "#835",
    title: "Upgrade payment token SDK to 6.4.2",
    repo: "meridian/payments",
    branch: "renovate/payment-token-6.x",
    author: "Renovate Bot",
    initials: "RB",
    risk: "watch",
    score: 58,
    status: "Ready",
    updated: "31m ago",
    files: 3,
    additions: 14,
    deletions: 14,
    summary: "Upgrades the PCI-boundary token SDK after canary latency and redaction checks.",
    reason: "The diff is small but crosses a third-party dependency and PCI control boundary, so owner approval remains required.",
    impactPath: ["payment-token SDK", "payments", "checkout-api"],
    checks: [
      { label: "PCI controls", status: "passed", detail: "Attestation and redaction pass" },
      { label: "Canary latency", status: "passed", detail: "+0.7% at p95" },
      { label: "Owner approval", status: "running", detail: "Money Movement pending" },
    ],
    touchedFiles: [
      { path: "package.json", delta: "+1 −1", tone: "mixed" },
      { path: "pnpm-lock.yaml", delta: "+13 −13", tone: "mixed" },
    ],
    reviewers: ["Money Movement", "Security"],
  },
  {
    id: "chg-829",
    number: "#829",
    title: "Cap reservation retry backoff at two seconds",
    repo: "meridian/inventory",
    branch: "sofia/retry-cap",
    author: "Sofia Rossi",
    initials: "SR",
    risk: "watch",
    score: 64,
    status: "Analyzing",
    updated: "1h ago",
    files: 6,
    additions: 91,
    deletions: 38,
    summary: "Bounds inventory reservation retry delay while an active canary validates checkout behavior.",
    reason: "Retry behavior sits on the checkout dependency path and can amplify load, so the rollout stays under live observation.",
    impactPath: ["checkout-api", "inventory", "reservation queue"],
    checks: [
      { label: "Retry model", status: "passed", detail: "Bounded amplification" },
      { label: "Rollback policy", status: "passed", detail: "Threshold configured" },
      { label: "Canary", status: "running", detail: "31 minutes stable" },
    ],
    touchedFiles: [{ path: "src/reservations/retry-policy.ts", delta: "+44 −18", tone: "mixed" }],
    reviewers: ["Fulfillment Platform", "Checkout Reliability"],
  },
  {
    id: "chg-826",
    number: "#826",
    title: "Rotate session signing key without restart",
    repo: "meridian/identity",
    branch: "nora/hot-key-rotation",
    author: "Nora Kim",
    initials: "NK",
    risk: "critical",
    score: 78,
    status: "Review now",
    updated: "2h ago",
    files: 18,
    additions: 318,
    deletions: 126,
    summary: "Enables signing-key rotation without restarting the Tier-0 identity service.",
    reason: "Concurrent rotation lacks a stale-key overlap integration test across 17 session-token consumers.",
    impactPath: ["identity", "edge-gateway", "6 consumer repositories"],
    checks: [
      { label: "Key overlap", status: "warning", detail: "Concurrent case missing" },
      { label: "Consumer coverage", status: "warning", detail: "17 consumers affected" },
      { label: "Test confidence", status: "passed", detail: "64 / 64 passed" },
    ],
    touchedFiles: [
      { path: "src/session/key-ring.ts", delta: "+182 −64", tone: "mixed" },
      { path: "src/session/verify.ts", delta: "+91 −42", tone: "mixed" },
    ],
    reviewers: ["Trust Platform", "Core Platform", "Security"],
  },
];

const riskFilters: Array<{ id: "all" | Risk; label: string }> = [
  { id: "all", label: "All changes" },
  { id: "critical", label: "Critical" },
  { id: "watch", label: "Watch" },
  { id: "routine", label: "Routine" },
];

const statusTone: Record<ChangeStatus, string> = {
  "Review now": "border-rose-400/25 bg-rose-400/10 text-rose-300",
  Analyzing: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  Ready: "border-[#b7f34b]/20 bg-[#b7f34b]/10 text-[#c7f77a]",
  Merged: "border-white/10 bg-white/5 text-white/55",
  Mitigated: "border-violet-300/20 bg-violet-300/10 text-violet-200",
};

export function ChangeIntelligence() {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | Risk>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredChanges = (() => {
    const normalized = query.trim().toLowerCase();
    return changes.filter((change) => {
      const matchesRisk = riskFilter === "all" || change.risk === riskFilter;
      const searchable = `${change.title} ${change.repo} ${change.branch} ${change.author} ${change.number}`.toLowerCase();
      return matchesRisk && (!normalized || searchable.includes(normalized));
    });
  })();

  const selectedChange = changes.find((change) => change.id === selectedId) ?? null;

  return (
    <section className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b7f34b]">
            <GitCommitHorizontal className="size-3.5" aria-hidden="true" />
            Change intelligence
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Changes</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            A risk-ranked view of every change moving through your system—before it becomes an incident.
          </p>
        </div>
        <a href="https://github.com/junlee122-bot/something" target="_blank" rel="noreferrer" className="flex h-10 w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white">
          <GitPullRequest className="size-4" aria-hidden="true" />
          Open source repository
        </a>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Tracked changes" value={String(demoChanges.length).padStart(2, "0")} detail="across the Meridian graph" icon={Code2} tone="neutral" />
        <SummaryCard label="Needs attention" value="02" detail="both block release paths" icon={ShieldAlert} tone="critical" />
        <SummaryCard label="Median review" value="11m" detail="32% faster this week" icon={Clock3} tone="good" />
        <SummaryCard label="Agent coverage" value="96%" detail="1 change awaiting context" icon={Bot} tone="good" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f0d]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, repository, branch…"
              aria-label="Search changes"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.035] pl-9 pr-9 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#b7f34b]/40 focus:ring-2 focus:ring-[#b7f34b]/10"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/55 hover:bg-white/10 hover:text-white">
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.025] p-1" role="group" aria-label="Filter changes by risk">
            {riskFilters.map((filter) => {
              const active = riskFilter === filter.id;
              const count = filter.id === "all" ? changes.length : changes.filter((change) => change.risk === filter.id).length;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRiskFilter(filter.id)}
                  className={`flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-xs transition ${active ? "bg-white/10 font-medium text-white" : "text-white/55 hover:text-white/70"}`}
                >
                  {filter.label}
                  <span className={`font-mono text-[9px] ${active ? "text-[#b7f34b]" : "text-white/50"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(260px,2fr)_minmax(150px,1fr)_90px_100px_44px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/50 md:grid">
          <span>Change</span><span>Repository</span><span>Risk</span><span>Status</span><span />
        </div>

        <div className="divide-y divide-white/[0.07]" aria-live="polite">
          {filteredChanges.map((change) => (
            <button
              key={change.id}
              type="button"
              onClick={() => setSelectedId(change.id)}
              className="group grid w-full gap-4 px-4 py-4 text-left transition hover:bg-white/[0.035] focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b7f34b]/60 md:grid-cols-[minmax(260px,2fr)_minmax(150px,1fr)_90px_100px_44px] md:items-center md:px-5"
            >
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-white/50">{change.number}</span>
                  <span className="truncate text-sm font-medium text-white/82 group-hover:text-white">{change.title}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/55">
                  <span className="flex items-center gap-1"><UserRound className="size-3" aria-hidden="true" />{change.author}</span>
                  <span>{change.updated}</span>
                  <span className="font-mono text-emerald-300/60">+{change.additions}</span>
                  <span className="font-mono text-rose-300/60">−{change.deletions}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-[11px] text-white/55">{change.repo}</p>
                <p className="mt-1 truncate font-mono text-[9px] text-white/50">{change.branch}</p>
              </div>
              <div className="flex items-center justify-between md:block">
                <span className="text-[9px] uppercase tracking-[0.12em] text-white/50 md:hidden">Risk</span>
                <RiskBadge risk={change.risk} score={change.score} />
              </div>
              <div className="flex items-center justify-between md:block">
                <span className="text-[9px] uppercase tracking-[0.12em] text-white/50 md:hidden">Status</span>
                <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-medium ${statusTone[change.status]}`}>{change.status}</span>
              </div>
              <span className="hidden size-8 place-items-center rounded-lg border border-white/10 text-white/25 transition group-hover:border-white/20 group-hover:bg-white/5 group-hover:text-white md:grid">
                <ChevronRight className="size-4" aria-hidden="true" />
              </span>
            </button>
          ))}
          {!filteredChanges.length ? (
            <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
              <div>
                <CircleDashed className="mx-auto size-8 text-white/20" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-white/65">No changes match this view</p>
                <p className="mt-1 text-xs text-white/55">Try another search or risk level.</p>
                <button type="button" onClick={() => { setQuery(""); setRiskFilter("all"); }} className="mt-4 text-xs font-medium text-[#b7f34b] hover:text-[#cbff7a]">Clear filters</button>
              </div>
            </div>
          ) : null}
        </div>
        <footer className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3 text-[10px] text-white/50">
          <span>Showing {filteredChanges.length} of {demoChanges.length} tracked changes</span>
          <span className="font-mono">Synced 18s ago</span>
        </footer>
      </div>

      {selectedChange ? <ChangeDrawer change={selectedChange} onClose={() => setSelectedId(null)} /> : null}
    </section>
  );
}

function SummaryCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone: "neutral" | "critical" | "good" }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0c100e] p-4">
      <div className={`absolute inset-x-0 top-0 h-px ${tone === "critical" ? "bg-gradient-to-r from-transparent via-rose-400/70 to-transparent" : tone === "good" ? "bg-gradient-to-r from-transparent via-[#b7f34b]/45 to-transparent" : "bg-gradient-to-r from-transparent via-white/20 to-transparent"}`} />
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">{label}</p>
        <Icon className={`size-4 ${tone === "critical" ? "text-rose-300" : tone === "good" ? "text-[#b7f34b]" : "text-white/30"}`} aria-hidden="true" />
      </div>
      <p className="mt-3 font-mono text-2xl font-medium tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[10px] text-white/50">{detail}</p>
    </div>
  );
}

function RiskBadge({ risk, score }: { risk: Risk; score: number }) {
  const styles: Record<Risk, string> = {
    critical: "border-rose-400/25 bg-rose-400/10 text-rose-300",
    watch: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    routine: "border-emerald-300/20 bg-emerald-300/5 text-emerald-300",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${styles[risk]}`}>
      <span className="font-mono">{score}</span> {risk}
    </span>
  );
}

function ChangeDrawer({ change, onClose }: { change: Change; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      aria-labelledby="change-drawer-title"
      className="fixed inset-y-0 end-0 start-auto m-0 h-dvh w-full max-w-xl overflow-y-auto border-0 border-s border-white/10 bg-[#0a0e0c] p-0 text-foreground shadow-[-24px_0_80px_rgba(0,0,0,0.4)] backdrop:bg-black/65 backdrop:backdrop-blur-[2px]"
    >
      <div className="min-h-full">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0e0c]/90 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/55">
            <GitPullRequest className="size-3.5" aria-hidden="true" />
            Change brief <span className="font-mono text-white/50">{change.number}</span>
          </div>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close details" className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/55 hover:bg-white/5 hover:text-white">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge risk={change.risk} score={change.score} />
            <span className={`rounded-full border px-2 py-1 text-[9px] font-medium ${statusTone[change.status]}`}>{change.status}</span>
          </div>
          <h2 id="change-drawer-title" className="mt-4 text-xl font-semibold leading-7 tracking-[-0.025em] text-white">{change.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-white/55">
            <span className="font-mono text-white/55">{change.repo}</span>
            <span>by {change.author}</span>
            <span>{change.updated}</span>
            <span>{change.files} files</span>
          </div>

          <div className="mt-6 rounded-xl border border-[#b7f34b]/15 bg-[#b7f34b]/[0.045] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b7f34b]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Threadline summary
            </div>
            <p className="mt-3 text-sm leading-6 text-white/66">{change.summary}</p>
            <div className="mt-4 border-t border-[#b7f34b]/10 pt-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/50">Why this score</p>
              <p className="mt-2 text-xs leading-5 text-white/60">{change.reason}</p>
            </div>
          </div>

          <DrawerSection title="Blast radius" icon={ArrowUpRight}>
            <div className="flex flex-wrap items-center gap-1.5">
              {change.impactPath.map((item, index) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className={`rounded-lg border px-2.5 py-1.5 font-mono text-[10px] ${index === change.impactPath.length - 1 ? "border-rose-400/20 bg-rose-400/[0.07] text-rose-200" : "border-white/10 bg-white/[0.03] text-white/55"}`}>{item}</span>
                  {index < change.impactPath.length - 1 ? <ArrowRight className="size-3 text-white/20" aria-hidden="true" /> : null}
                </div>
              ))}
            </div>
          </DrawerSection>

          <DrawerSection title="Verification" icon={CheckCircle2}>
            <div className="divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/[0.08]">
              {change.checks.map((check) => (
                <div key={check.label} className="flex items-center gap-3 bg-white/[0.02] px-3.5 py-3">
                  {check.status === "passed" ? <CheckCircle2 className="size-4 shrink-0 text-emerald-300" aria-hidden="true" /> : check.status === "warning" ? <AlertTriangle className="size-4 shrink-0 text-amber-300" aria-hidden="true" /> : <CircleDashed className="size-4 shrink-0 animate-spin text-cyan-300" aria-hidden="true" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white/68">{check.label}</p>
                    <p className="mt-0.5 text-[10px] text-white/50">{check.detail}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-white/50">{check.status}</span>
                </div>
              ))}
            </div>
          </DrawerSection>

          <DrawerSection title="Files with leverage" icon={FileCode2}>
            <div className="space-y-2">
              {change.touchedFiles.map((file) => (
                <div key={file.path} className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                  <FileCode2 className="size-3.5 shrink-0 text-white/30" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-white/55">{file.path}</span>
                  <span className={`font-mono text-[9px] ${file.tone === "add" ? "text-emerald-300/70" : "text-white/50"}`}>{file.delta}</span>
                </div>
              ))}
            </div>
          </DrawerSection>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <a href="https://github.com/junlee122-bot/something" target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] text-xs font-semibold text-white/60 hover:border-white/20 hover:text-white">
              Open source <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
            <Link href="/agents" className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#b7f34b] text-xs font-semibold text-[#14200d] hover:bg-[#c9fa75]">
              <Bot className="size-3.5" aria-hidden="true" /> Ask an agent
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function DrawerSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-3.5 text-white/35" aria-hidden="true" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">{title}</h3>
      </div>
      {children}
    </section>
  );
}
