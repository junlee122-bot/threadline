"use client";

import { useId, useState } from "react";
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

import { impactReports, reportMethodology, type ReportMetric, type ReportPeriodId } from "@/lib/impact-reports";

type Period = ReportPeriodId;

const metricIcons = {
  changes: GitPullRequest,
  shield: ShieldCheck,
  timer: TimerReset,
  network: Network,
};

const periodTabs: Array<{ id: Period; label: string }> = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "Quarter" },
];

export function ImpactReports() {
  const [period, setPeriod] = useState<Period>("7d");
  const [narrativeEvidenceOpen, setNarrativeEvidenceOpen] = useState(false);
  const report = impactReports[period];

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
            Review coverage, context quality, and modeled effort across a clearly scoped demo cohort.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <a href={`/api/reports/impact?period=${period}`} download aria-label="Download selected report as JSON" className="flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.025] px-3 text-[10px] text-white/65 hover:border-white/20 hover:text-white">
            <Download className="size-3.5" aria-hidden="true" />JSON
          </a>
          <a href={`/api/reports/impact?period=${period}&format=csv`} download aria-label="Download selected chart data as CSV" className="flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.025] px-3 text-[10px] text-white/65 hover:border-white/20 hover:text-white">
            CSV
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
              <HeroStat value={report.trackedChanges.toLocaleString("en-US")} label="tracked changes" />
              <HeroStat value={report.analyzedChanges.toLocaleString("en-US")} label="analyzed changes" />
              <HeroStat value={String(report.trackedChanges - report.analyzedChanges)} label="awaiting analysis" />
              <HeroStat value="KST" label="snapshot timezone" />
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
                  <h2 className="text-sm font-semibold text-white/82">Modeled effort over time</h2>
                </div>
                <p className="mt-1.5 text-[10px] leading-4 text-white/60">Synthetic hours avoided and tracked changes. Separate axes; final buckets can be partial.</p>
              </div>
              <div className="flex items-center gap-4 text-[9px] text-white/50">
                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#b7f34b]" />Modeled hours</span>
                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-cyan-300" />Tracked changes</span>
              </div>
            </div>
            <LeverageChart key={period} hours={report.hours} volume={report.volume} labels={report.labels} bucketStarts={report.bucketStarts} bucketEnds={report.bucketEnds} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b0f0d] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-[#b7f34b]" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-white/82">Change risk mix</h2>
            </div>
            <p className="mt-1.5 text-[10px] text-white/50">Distribution across all {report.trackedChanges.toLocaleString("en-US")} tracked changes.</p>
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
                  <span className="text-white/65">{report.riskMix.at(-1)?.count} changes</span> carry critical risk in this sample. A risk classification is not proof that an incident was prevented.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f0d]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-white/82">Context completeness</h2>
                <p className="mt-1 text-[10px] text-white/50">Illustrative score / 100 · ownership, contracts, recent evidence.</p>
              </div>
              <Link href="/map" className="text-[10px] font-medium text-[#b7f34b] hover:text-[#cafa74]">View system map</Link>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {report.services.map((service) => (
                <div key={service.name} className="grid grid-cols-[minmax(0,1fr)_54px] items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_70px_92px]">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] text-white/62">{service.name}</p>
                    <p className="mt-1 truncate text-[9px] text-white/50">{service.owner} · {service.changes} changes</p>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    {service.direction === "up" ? <TrendingUp className="size-3 text-emerald-300" aria-label="Improving" /> : service.direction === "down" ? <TrendingDown className="size-3 text-rose-300" aria-label="Declining" /> : <span className="size-3 text-center text-[9px] text-white/50" aria-label="Stable">—</span>}
                    <span className="font-mono text-xs text-white/62">{service.score}</span>
                  </div>
                  <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06] sm:col-span-1">
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
                {report.narrative.title}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/60">
                {report.narrative.detail}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <InsightStat label="Context time" value={report.narrative.reviewChange} icon={Clock3} />
                <InsightStat label="Critical findings" value={report.narrative.findingChange} icon={TriangleAlert} />
              </div>
              <button type="button" aria-expanded={narrativeEvidenceOpen} onClick={() => setNarrativeEvidenceOpen((open) => !open)} className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] text-[10px] font-semibold text-white/55 hover:border-white/20 hover:text-white">
                <Bot className="size-3.5" aria-hidden="true" />
                {narrativeEvidenceOpen ? "Hide cohort details" : "Inspect cohort details"}
              </button>
              {narrativeEvidenceOpen ? <p role="status" className="mt-3 rounded-lg border border-violet-300/15 bg-violet-300/[0.04] p-3 text-[10px] leading-5 text-white/60">{report.narrative.evidence}</p> : null}
            </div>
          </div>
        </div>
      </div>
      <details className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/60">
        <summary className="cursor-pointer font-medium text-white/80">Methodology &amp; data provenance</summary>
        <div className="mt-3 grid gap-4 leading-6 md:grid-cols-3">
          <p><span className="block font-medium text-primary">Modeled effort</span>{reportMethodology.hours}</p>
          <p><span className="block font-medium text-signal">Cohort denominator</span>{reportMethodology.volume}</p>
          <p><span className="block font-medium text-inference">Context quality</span>{reportMethodology.contextScore}</p>
        </div>
        <p className="mt-4 border-t border-white/10 pt-3 font-mono text-[10px]">Snapshot: Jul 14, 2026, 19:42 KST · JSON and CSV use this selected period.</p>
      </details>
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

function MetricCard({ label, value, delta, positive, direction, detail, icon }: ReportMetric) {
  const Icon = metricIcons[icon];
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0f0d] p-4">
      <div className="flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-lg bg-white/[0.045] text-white/35">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className={`flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[9px] ${positive ? "bg-[#b7f34b]/10 text-[#b7f34b]" : "bg-rose-400/10 text-rose-300"}`}>
          {direction === "up" ? <ArrowUp className="size-2.5" aria-hidden="true" /> : <ArrowDown className="size-2.5" aria-hidden="true" />}{delta}
        </span>
      </div>
      <p className="mt-4 font-mono text-2xl font-medium tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/55">{label}</p>
      <p className="mt-1 text-[9px] text-white/50">{detail}</p>
    </div>
  );
}

function LeverageChart({ hours, volume, labels, bucketStarts, bucketEnds }: { hours: number[]; volume: number[]; labels: string[]; bucketStarts: string[]; bucketEnds: string[] }) {
  const gradientId = `hours-${useId().replace(/:/g, "")}`;
  const width = 640;
  const height = 240;
  const paddingX = 46;
  const paddingY = 32;
  const maxHours = Math.ceil(Math.max(...hours) * 1.15);
  const maxVolume = Math.ceil(Math.max(...volume) * 1.1 / 10) * 10;
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
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label={`Modeled effort and tracked changes across ${hours.length} buckets. Exact values are available in the table below.`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b7f34b" stopOpacity=".18" />
            <stop offset="1" stopColor="#b7f34b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <text x={paddingX} y="13" fill="#b7f34b" fontSize="9">Modeled hours</text>
        <text x={width - paddingX} y="13" fill="#67e8f9" fontSize="9" textAnchor="end">Tracked changes</text>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <g key={ratio}>
            <line x1={paddingX} x2={width - paddingX} y1={paddingY + ratio * (height - paddingY * 2)} y2={paddingY + ratio * (height - paddingY * 2)} stroke="rgba(255,255,255,.07)" strokeWidth="1" />
            <text x={paddingX - 10} y={paddingY + ratio * (height - paddingY * 2) + 3} textAnchor="end" fill="rgba(183,243,75,.65)" fontSize="9">{Number((maxHours * (1 - ratio)).toFixed(1))}</text>
            <text x={width - paddingX + 10} y={paddingY + ratio * (height - paddingY * 2) + 3} fill="rgba(103,232,249,.65)" fontSize="9">{Math.round(maxVolume * (1 - ratio))}</text>
          </g>
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={volumePath} fill="none" stroke="rgba(103,232,249,.65)" strokeWidth="1.5" strokeDasharray="4 5" />
        <path d={hourPath} fill="none" stroke="#b7f34b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {hourPoints.map((point, index) => (
          <g key={`${point.x}-${point.y}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="#0b0f0d" stroke="#b7f34b" strokeWidth="2"><title>{`${bucketStarts[index]} – ${bucketEnds[index]}: ${hours[index]} modeled hours, ${volume[index]} tracked changes`}</title></circle>
            <text x={point.x} y={height - 10} textAnchor="middle" fill="rgba(255,255,255,.6)" fontSize="9">{labels[index]}</text>
          </g>
        ))}
      </svg>
      <details className="mt-3 rounded-lg border border-white/10 bg-white/[0.015] p-3">
        <summary className="cursor-pointer text-[10px] font-medium text-white/70">View exact chart data</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[310px] text-left font-mono text-[10px] text-white/65">
            <caption className="sr-only">Selected report period chart values, in Asia/Seoul timezone</caption>
            <thead><tr className="border-b border-white/10"><th scope="col" className="pb-2 font-medium">Bucket (KST)</th><th scope="col" className="pb-2 text-right font-medium">Hours</th><th scope="col" className="pb-2 text-right font-medium">Changes</th></tr></thead>
            <tbody>{hours.map((value, index) => <tr key={bucketStarts[index]} className="border-b border-white/[0.05] last:border-0"><th scope="row" className="py-2 font-normal">{bucketStarts[index]}{bucketEnds[index] !== bucketStarts[index] ? ` – ${bucketEnds[index].slice(5)}` : ""}</th><td className="text-right text-primary">{value.toFixed(1)}</td><td className="text-right text-signal">{volume[index]}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
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
