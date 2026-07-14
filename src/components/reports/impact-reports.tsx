"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  CalendarDays,
  Clock3,
  Download,
  Gauge,
  GitPullRequest,
  Lightbulb,
  Network,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";

type Period = "7d" | "30d" | "90d";

type ReportPeriod = {
  label: string;
  range: string;
  headline: string;
  change: string;
  metrics: Array<{
    label: string;
    value: string;
    delta: string;
    positive: boolean;
    detail: string;
    icon: LucideIcon;
  }>;
  hours: number[];
  volume: number[];
  labels: string[];
  riskMix: Array<{ label: string; value: number; count: number; color: string }>;
  services: Array<{ name: string; owner: string; score: number; changes: number; direction: "up" | "down" | "same" }>;
};

const reportData: Record<Period, ReportPeriod> = {
  "7d": {
    label: "Last 7 days",
    range: "Jul 8 – Jul 14, 2026",
    headline: "18.4 hours returned to engineering",
    change: "32% more than the previous week",
    metrics: [
      { label: "Change coverage", value: "96%", delta: "+4.2%", positive: true, detail: "462 of 481 changes analyzed", icon: GitPullRequest },
      { label: "Critical risks caught", value: "11", delta: "+3", positive: true, detail: "before reaching production", icon: ShieldCheck },
      { label: "Time to context", value: "7.4m", delta: "−38%", positive: true, detail: "median across all reviews", icon: TimerReset },
      { label: "Architecture freshness", value: "91%", delta: "+6.7%", positive: true, detail: "of system briefs verified", icon: Network },
    ],
    hours: [1.4, 2.1, 2.5, 2.2, 3.4, 3.1, 3.7],
    volume: [54, 67, 71, 59, 82, 73, 75],
    labels: ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"],
    riskMix: [
      { label: "Routine", value: 67, count: 322, color: "bg-emerald-300" },
      { label: "Watch", value: 27, count: 129, color: "bg-amber-300" },
      { label: "Critical", value: 6, count: 30, color: "bg-rose-400" },
    ],
    services: [
      { name: "orders", owner: "Commerce", score: 72, changes: 31, direction: "down" },
      { name: "api-gateway", owner: "Core Services", score: 84, changes: 23, direction: "up" },
      { name: "identity", owner: "Trust", score: 96, changes: 5, direction: "same" },
      { name: "billing", owner: "Money Movement", score: 88, changes: 11, direction: "up" },
    ],
  },
  "30d": {
    label: "Last 30 days",
    range: "Jun 15 – Jul 14, 2026",
    headline: "76.2 hours returned to engineering",
    change: "24% more than the previous 30 days",
    metrics: [
      { label: "Change coverage", value: "94%", delta: "+2.8%", positive: true, detail: "1,884 of 2,004 changes analyzed", icon: GitPullRequest },
      { label: "Critical risks caught", value: "38", delta: "+9", positive: true, detail: "before reaching production", icon: ShieldCheck },
      { label: "Time to context", value: "8.1m", delta: "−29%", positive: true, detail: "median across all reviews", icon: TimerReset },
      { label: "Architecture freshness", value: "89%", delta: "+11%", positive: true, detail: "of system briefs verified", icon: Network },
    ],
    hours: [12.8, 15.4, 14.9, 18.7, 14.4],
    volume: [338, 397, 421, 463, 385],
    labels: ["Jun 15", "Jun 22", "Jun 29", "Jul 6", "Jul 13"],
    riskMix: [
      { label: "Routine", value: 64, count: 1283, color: "bg-emerald-300" },
      { label: "Watch", value: 30, count: 601, color: "bg-amber-300" },
      { label: "Critical", value: 6, count: 120, color: "bg-rose-400" },
    ],
    services: [
      { name: "orders", owner: "Commerce", score: 78, changes: 124, direction: "down" },
      { name: "api-gateway", owner: "Core Services", score: 86, changes: 92, direction: "up" },
      { name: "identity", owner: "Trust", score: 95, changes: 28, direction: "up" },
      { name: "billing", owner: "Money Movement", score: 87, changes: 51, direction: "same" },
    ],
  },
  "90d": {
    label: "Last 90 days",
    range: "Apr 16 – Jul 14, 2026",
    headline: "231 hours returned to engineering",
    change: "Equivalent to 5.8 engineering weeks",
    metrics: [
      { label: "Change coverage", value: "92%", delta: "+14%", positive: true, detail: "5,498 changes analyzed", icon: GitPullRequest },
      { label: "Critical risks caught", value: "109", delta: "+41", positive: true, detail: "before reaching production", icon: ShieldCheck },
      { label: "Time to context", value: "8.8m", delta: "−46%", positive: true, detail: "from a 16.3m baseline", icon: TimerReset },
      { label: "Architecture freshness", value: "87%", delta: "+24%", positive: true, detail: "of system briefs verified", icon: Network },
    ],
    hours: [18, 24, 29, 27, 34, 41, 58],
    volume: [602, 687, 711, 742, 826, 918, 1012],
    labels: ["Apr", "", "May", "", "Jun", "", "Jul"],
    riskMix: [
      { label: "Routine", value: 62, count: 3706, color: "bg-emerald-300" },
      { label: "Watch", value: 32, count: 1913, color: "bg-amber-300" },
      { label: "Critical", value: 6, count: 358, color: "bg-rose-400" },
    ],
    services: [
      { name: "orders", owner: "Commerce", score: 82, changes: 351, direction: "up" },
      { name: "api-gateway", owner: "Core Services", score: 88, changes: 278, direction: "up" },
      { name: "identity", owner: "Trust", score: 95, changes: 84, direction: "same" },
      { name: "billing", owner: "Money Movement", score: 86, changes: 158, direction: "up" },
    ],
  },
};

const periodTabs: Array<{ id: Period; label: string }> = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "Quarter" },
];

export function ImpactReports() {
  const [period, setPeriod] = useState<Period>("7d");
  const [narrativeEvidenceOpen, setNarrativeEvidenceOpen] = useState(false);
  const report = reportData[period];

  return (
    <section className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b7f34b]">
            <Gauge className="size-3.5" aria-hidden="true" />
            Engineering impact
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Reports</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Make invisible leverage visible—from risk prevented to time returned and context kept fresh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/[0.025] p-1" role="group" aria-label="Report period">
            {periodTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={period === tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`h-8 rounded-md px-3 text-[10px] font-medium transition ${period === tab.id ? "bg-white/10 text-white shadow-sm" : "text-white/55 hover:text-white/65"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <a href={`/api/reports/impact?period=${period}`} download aria-label="Download report as JSON" className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/[0.025] text-white/55 hover:border-white/20 hover:text-white">
            <Download className="size-4" aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-[#b7f34b]/15 bg-[#0c110d] p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#b7f34b]/[0.07] blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/50">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {report.range}
              </div>
              <p className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl lg:text-4xl">{report.headline}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-[#b7f34b]">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                {report.change}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 lg:min-w-[315px]">
              <HeroStat value="1,284" label="agent actions" />
              <HeroStat value="99.2%" label="traceable claims" />
              <HeroStat value="4.7×" label="review leverage" />
              <HeroStat value="0" label="escaped critical" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {report.metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.65fr)]">
          <div className="rounded-2xl border border-white/10 bg-[#0b0f0d] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="size-3.5 text-[#b7f34b]" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-white/82">Leverage over time</h2>
                </div>
                <p className="mt-1.5 text-[10px] text-white/50">Hours returned through faster context, review, and documentation.</p>
              </div>
              <div className="flex items-center gap-4 text-[9px] text-white/50">
                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#b7f34b]" />Hours returned</span>
                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-cyan-300" />Change volume</span>
              </div>
            </div>
            <LeverageChart hours={report.hours} volume={report.volume} labels={report.labels} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b0f0d] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-[#b7f34b]" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-white/82">Change risk mix</h2>
            </div>
            <p className="mt-1.5 text-[10px] text-white/50">Distribution across analyzed changes.</p>
            <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-white/5">
              {report.riskMix.map((risk) => <div key={risk.label} className={risk.color} style={{ width: `${risk.value}%` }} />)}
            </div>
            <div className="mt-5 space-y-4">
              {report.riskMix.map((risk) => (
                <div key={risk.label} className="flex items-center gap-3">
                  <span className={`size-2 rounded-full ${risk.color}`} />
                  <span className="flex-1 text-xs text-white/50">{risk.label}</span>
                  <span className="font-mono text-[10px] text-white/50">{risk.count.toLocaleString("en-US")}</span>
                  <span className="w-8 text-right font-mono text-xs text-white/70">{risk.value}%</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="flex gap-2.5">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-300" aria-hidden="true" />
                <p className="text-[10px] leading-4 text-white/55">
                  Critical changes are stable at <span className="text-white/65">6%</span>, while pre-merge detection improved by <span className="text-[#b7f34b]">12 points</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f0d]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-white/82">System confidence</h2>
                <p className="mt-1 text-[10px] text-white/50">High-change services ranked by contextual health.</p>
              </div>
              <Link href="/map" className="text-[10px] font-medium text-[#b7f34b] hover:text-[#cafa74]">View system map</Link>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {report.services.map((service) => (
                <div key={service.name} className="grid grid-cols-[minmax(0,1fr)_70px_92px] items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] text-white/62">{service.name}</p>
                    <p className="mt-1 truncate text-[9px] text-white/50">{service.owner} · {service.changes} changes</p>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    {service.direction === "up" ? <TrendingUp className="size-3 text-emerald-300" aria-label="Improving" /> : service.direction === "down" ? <TrendingDown className="size-3 text-rose-300" aria-label="Declining" /> : <span className="size-3 text-center text-[9px] text-white/50" aria-label="Stable">—</span>}
                    <span className="font-mono text-xs text-white/62">{service.score}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${service.score >= 90 ? "bg-[#b7f34b]" : service.score >= 80 ? "bg-cyan-300" : "bg-amber-300"}`} style={{ width: `${service.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d120f] p-5">
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-violet-400/[0.07] blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Narrative insight
              </div>
              <p className="mt-4 text-base font-medium leading-6 text-white/78">
                Review speed improved without lowering scrutiny.
              </p>
              <p className="mt-2 text-xs leading-5 text-white/60">
                The largest gain came from contract-aware summaries in Commerce, where median time-to-context fell 46% while critical findings rose.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <InsightStat label="Commerce review" value="−46%" icon={Clock3} />
                <InsightStat label="Critical findings" value="+18%" icon={TriangleAlert} />
              </div>
              <button type="button" aria-expanded={narrativeEvidenceOpen} onClick={() => setNarrativeEvidenceOpen((open) => !open)} className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] text-[10px] font-semibold text-white/55 hover:border-white/20 hover:text-white">
                <Bot className="size-3.5" aria-hidden="true" />
                {narrativeEvidenceOpen ? "Hide supporting evidence" : "Ask about this report"}
              </button>
              {narrativeEvidenceOpen ? <p role="status" className="mt-3 rounded-lg border border-violet-300/15 bg-violet-300/[0.04] p-3 text-[10px] leading-5 text-white/60">The narrative is supported by review-cycle samples across 34 changes, six service scorecards, and two incident retrospectives. Commerce contributed 61% of the measured improvement.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[#0c100e]/80 px-4 py-3.5">
      <p className="font-mono text-lg font-medium text-white">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.11em] text-white/50">{label}</p>
    </div>
  );
}

function MetricCard({ label, value, delta, positive, detail, icon: Icon }: ReportPeriod["metrics"][number]) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0f0d] p-4">
      <div className="flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-lg bg-white/[0.045] text-white/35">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className={`flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[9px] ${positive ? "bg-[#b7f34b]/10 text-[#b7f34b]" : "bg-rose-400/10 text-rose-300"}`}>
          {positive ? <ArrowUp className="size-2.5" aria-hidden="true" /> : <ArrowDown className="size-2.5" aria-hidden="true" />}{delta}
        </span>
      </div>
      <p className="mt-4 font-mono text-2xl font-medium tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/55">{label}</p>
      <p className="mt-1 text-[9px] text-white/50">{detail}</p>
    </div>
  );
}

function LeverageChart({ hours, volume, labels }: { hours: number[]; volume: number[]; labels: string[] }) {
  const width = 640;
  const height = 210;
  const paddingX = 22;
  const paddingY = 24;
  const maxHours = Math.max(...hours) * 1.2;
  const maxVolume = Math.max(...volume) * 1.1;
  const hourPoints = hours.map((value, index) => ({
    x: paddingX + (index * (width - paddingX * 2)) / Math.max(hours.length - 1, 1),
    y: height - paddingY - (value / maxHours) * (height - paddingY * 2),
  }));
  const volumePoints = volume.map((value, index) => ({
    x: paddingX + (index * (width - paddingX * 2)) / Math.max(volume.length - 1, 1),
    y: height - paddingY - (value / maxVolume) * (height - paddingY * 2),
  }));
  const hourPath = hourPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const volumePath = volumePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${hourPath} L ${hourPoints.at(-1)?.x ?? width - paddingX} ${height - paddingY} L ${hourPoints[0]?.x ?? paddingX} ${height - paddingY} Z`;

  return (
    <div className="mt-5">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label={`Hours returned increased from ${hours[0]} to ${hours.at(-1)} over this period`}>
        <defs>
          <linearGradient id="hours-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b7f34b" stopOpacity=".18" />
            <stop offset="1" stopColor="#b7f34b" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
          <line key={ratio} x1={paddingX} x2={width - paddingX} y1={paddingY + ratio * (height - paddingY * 2)} y2={paddingY + ratio * (height - paddingY * 2)} stroke="rgba(255,255,255,.055)" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#hours-area)" />
        <path d={volumePath} fill="none" stroke="rgba(103,232,249,.34)" strokeWidth="1.5" strokeDasharray="4 5" />
        <path d={hourPath} fill="none" stroke="#b7f34b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {hourPoints.map((point, index) => (
          <g key={`${point.x}-${point.y}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="#0b0f0d" stroke="#b7f34b" strokeWidth="2" />
            <text x={point.x} y={height - 4} textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="8">{labels[index]}</text>
          </g>
        ))}
      </svg>
      <div className="sr-only">Values: {hours.join(", ")} hours returned.</div>
    </div>
  );
}

function InsightStat({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">
      <Icon className="size-3.5 text-white/30" aria-hidden="true" />
      <p className="mt-3 font-mono text-lg text-white/75">{value}</p>
      <p className="mt-1 text-[9px] text-white/50">{label}</p>
    </div>
  );
}
