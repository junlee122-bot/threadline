import { DEMO_NOW, incidentSummary, reportMetrics } from "@/lib/demo-data";

const periods = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Quarter",
} as const;

type Period = keyof typeof periods;

export function GET(request: Request) {
  const requestedPeriod = new URL(request.url).searchParams.get("period") ?? "7d";
  const period: Period = requestedPeriod in periods ? (requestedPeriod as Period) : "7d";
  const payload = {
    product: "Threadline",
    workspace: "Meridian Market · Demo",
    period: { id: period, label: periods[period] },
    generatedAt: DEMO_NOW,
    source: "deterministic-demo",
    incident: incidentSummary,
    dora: reportMetrics.dora,
    slos: reportMetrics.slos,
    impact: reportMetrics.incident,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": `attachment; filename="threadline-impact-${period}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
