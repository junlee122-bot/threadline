import { DEMO_NOW } from "@/lib/demo-data";

export type ReportPeriodId = "7d" | "30d" | "90d";
export type ReportMetricIcon = "changes" | "shield" | "timer" | "network";

export type ReportMetric = {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  direction: "up" | "down";
  detail: string;
  icon: ReportMetricIcon;
};

export type ImpactReport = {
  label: string;
  range: string;
  startDate: string;
  endDate: string;
  headline: string;
  change: string;
  modeledHours: number;
  analyzedChanges: number;
  trackedChanges: number;
  metrics: ReportMetric[];
  hours: number[];
  volume: number[];
  labels: string[];
  bucketStarts: string[];
  bucketEnds: string[];
  riskMix: Array<{ label: string; value: number; count: number; color: string }>;
  services: Array<{ name: string; owner: string; score: number; changes: number; direction: "up" | "down" | "same" }>;
  narrative: { title: string; detail: string; reviewChange: string; findingChange: string; evidence: string };
};

export const reportMethodology = {
  source: "deterministic-demo",
  classification: "illustrative-model",
  snapshotAt: DEMO_NOW,
  timezone: "Asia/Seoul",
  hours: "Illustrative estimate of review and context time avoided. Synthetic fixtures, not observed productivity or verified ROI; no causal attribution is implied.",
  volume: "All tracked changes per bucket, including changes awaiting analysis. Risk distribution uses this same tracked-change denominator.",
  contextScore: "Illustrative completeness score for ownership, contracts, and recent evidence. This is not a calibrated probability or a service reliability score.",
} as const;

export const impactReports: Record<ReportPeriodId, ImpactReport> = {
  "7d": {
    label: "Last 7 days", range: "Jul 8 – Jul 14, 2026", startDate: "2026-07-08", endDate: "2026-07-14",
    headline: "18.4 modeled engineering hours", change: "Illustrative estimate · 32% above the previous week",
    modeledHours: 18.4, analyzedChanges: 462, trackedChanges: 481,
    metrics: [
      { label: "Change coverage", value: "96%", delta: "+4.2 pp", positive: true, direction: "up", detail: "462 of 481 changes analyzed", icon: "changes" },
      { label: "Critical risks flagged", value: "11", delta: "+3", positive: true, direction: "up", detail: "in the pre-production sample", icon: "shield" },
      { label: "Time to context", value: "7.4m", delta: "−38%", positive: true, direction: "down", detail: "median in the review sample", icon: "timer" },
      { label: "Architecture freshness", value: "91%", delta: "+6.7 pp", positive: true, direction: "up", detail: "of sample briefs verified", icon: "network" },
    ],
    hours: [1.4, 2.1, 2.5, 2.2, 3.4, 3.1, 3.7], volume: [54, 67, 71, 59, 82, 73, 75],
    labels: ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"],
    bucketStarts: ["2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12", "2026-07-13", "2026-07-14"],
    bucketEnds: ["2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12", "2026-07-13", "2026-07-14"],
    riskMix: [
      { label: "Routine", value: 67, count: 322, color: "bg-emerald-300" },
      { label: "Watch", value: 27, count: 129, color: "bg-amber-300" },
      { label: "Critical", value: 6, count: 30, color: "bg-rose-400" },
    ],
    services: [
      { name: "checkout-api", owner: "Checkout Reliability", score: 72, changes: 31, direction: "down" },
      { name: "edge-gateway", owner: "Core Platform", score: 84, changes: 23, direction: "up" },
      { name: "identity", owner: "Trust Platform", score: 96, changes: 5, direction: "same" },
      { name: "payments", owner: "Money Movement", score: 88, changes: 11, direction: "up" },
    ],
    narrative: { title: "Commerce is the next review focus.", detail: "Checkout has the lowest context completeness in this sample, while 31 changes passed through the service. Reconcile the retry contract and incident evidence before the next rollout.", reviewChange: "−38%", findingChange: "+3", evidence: "Illustrative 7-day cohort: 462 analyzed changes out of 481 tracked. Context time is a sample median; the model does not establish that agent use caused the change." },
  },
  "30d": {
    label: "Last 30 days", range: "Jun 15 – Jul 14, 2026", startDate: "2026-06-15", endDate: "2026-07-14",
    headline: "76.2 modeled engineering hours", change: "Illustrative estimate · 24% above the previous 30 days",
    modeledHours: 76.2, analyzedChanges: 1884, trackedChanges: 2004,
    metrics: [
      { label: "Change coverage", value: "94%", delta: "+2.8 pp", positive: true, direction: "up", detail: "1,884 of 2,004 changes analyzed", icon: "changes" },
      { label: "Critical risks flagged", value: "38", delta: "+9", positive: true, direction: "up", detail: "in the pre-production sample", icon: "shield" },
      { label: "Time to context", value: "8.1m", delta: "−29%", positive: true, direction: "down", detail: "median in the review sample", icon: "timer" },
      { label: "Architecture freshness", value: "89%", delta: "+11 pp", positive: true, direction: "up", detail: "of sample briefs verified", icon: "network" },
    ],
    hours: [12.8, 15.4, 14.9, 18.7, 14.4], volume: [338, 397, 421, 463, 385],
    labels: ["Jun 15", "Jun 22", "Jun 29", "Jul 6", "Jul 13"],
    bucketStarts: ["2026-06-15", "2026-06-22", "2026-06-29", "2026-07-06", "2026-07-13"],
    bucketEnds: ["2026-06-21", "2026-06-28", "2026-07-05", "2026-07-12", "2026-07-14"],
    riskMix: [
      { label: "Routine", value: 64, count: 1283, color: "bg-emerald-300" },
      { label: "Watch", value: 30, count: 601, color: "bg-amber-300" },
      { label: "Critical", value: 6, count: 120, color: "bg-rose-400" },
    ],
    services: [
      { name: "checkout-api", owner: "Checkout Reliability", score: 78, changes: 124, direction: "down" },
      { name: "edge-gateway", owner: "Core Platform", score: 86, changes: 92, direction: "up" },
      { name: "identity", owner: "Trust Platform", score: 95, changes: 28, direction: "up" },
      { name: "payments", owner: "Money Movement", score: 87, changes: 51, direction: "same" },
    ],
    narrative: { title: "Close the context coverage gap.", detail: "120 tracked changes await analysis in this monthly sample. Prioritize high-change services and make contract ownership explicit before expanding automated review coverage.", reviewChange: "−29%", findingChange: "+9", evidence: "Illustrative 30-day cohort: 1,884 analyzed changes out of 2,004 tracked. Five chart buckets cover the full window; the final bucket contains two days and is not a full-week comparison." },
  },
  "90d": {
    label: "Quarter", range: "Apr 16 – Jul 14, 2026", startDate: "2026-04-16", endDate: "2026-07-14",
    headline: "231 modeled engineering hours", change: "Illustrative estimate · equivalent to 5.8 × 40-hour weeks",
    modeledHours: 231, analyzedChanges: 5498, trackedChanges: 5977,
    metrics: [
      { label: "Change coverage", value: "92%", delta: "+14 pp", positive: true, direction: "up", detail: "5,498 of 5,977 changes analyzed", icon: "changes" },
      { label: "Critical risks flagged", value: "109", delta: "+41", positive: true, direction: "up", detail: "in the pre-production sample", icon: "shield" },
      { label: "Time to context", value: "8.8m", delta: "−46%", positive: true, direction: "down", detail: "from a 16.3m sample baseline", icon: "timer" },
      { label: "Architecture freshness", value: "87%", delta: "+24 pp", positive: true, direction: "up", detail: "of sample briefs verified", icon: "network" },
    ],
    hours: [18, 24, 29, 27, 34, 41, 58], volume: [650, 747, 776, 811, 901, 992, 1100],
    labels: ["Apr 16", "Apr 30", "May 14", "May 28", "Jun 11", "Jun 25", "Jul 9"],
    bucketStarts: ["2026-04-16", "2026-04-30", "2026-05-14", "2026-05-28", "2026-06-11", "2026-06-25", "2026-07-09"],
    bucketEnds: ["2026-04-29", "2026-05-13", "2026-05-27", "2026-06-10", "2026-06-24", "2026-07-08", "2026-07-14"],
    riskMix: [
      { label: "Routine", value: 62, count: 3706, color: "bg-emerald-300" },
      { label: "Watch", value: 32, count: 1913, color: "bg-amber-300" },
      { label: "Critical", value: 6, count: 358, color: "bg-rose-400" },
    ],
    services: [
      { name: "checkout-api", owner: "Checkout Reliability", score: 82, changes: 351, direction: "up" },
      { name: "edge-gateway", owner: "Core Platform", score: 88, changes: 278, direction: "up" },
      { name: "identity", owner: "Trust Platform", score: 95, changes: 84, direction: "same" },
      { name: "payments", owner: "Money Movement", score: 86, changes: 158, direction: "up" },
    ],
    narrative: { title: "Coverage gains need a durable review loop.", detail: "The quarterly sample pairs higher coverage with shorter context time. Use incident retrospectives to check for missed risks, and review changes that still lack fresh architectural evidence.", reviewChange: "−46%", findingChange: "+41", evidence: "Illustrative 90-day cohort: 5,498 analyzed changes out of 5,977 tracked. Six 14-day buckets and a final 6-day bucket cover the selected period. Productivity values are modeled, not observed savings." },
  },
};

export function resolveReportPeriod(value: string | null): ReportPeriodId {
  return value === "7d" || value === "30d" || value === "90d" ? value : "7d";
}

export function reportSeries(period: ReportPeriodId) {
  const report = impactReports[period];
  return report.hours.map((hours, index) => ({
    startDate: report.bucketStarts[index], endDate: report.bucketEnds[index],
    label: report.labels[index], modeledHours: hours, trackedChanges: report.volume[index],
  }));
}

export function reportCsv(period: ReportPeriodId): string {
  const rows: Array<Array<string | number>> = [
    ["period", "start_date", "end_date", "bucket", "modeled_hours", "tracked_changes", "source", "timezone"],
    ...reportSeries(period).map((row) => [period, row.startDate, row.endDate, row.label, row.modeledHours, row.trackedChanges, reportMethodology.source, reportMethodology.timezone]),
  ];
  return rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n";
}
