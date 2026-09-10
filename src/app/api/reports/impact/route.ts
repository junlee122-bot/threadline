import { DEMO_NOW, incidentSummary, reportMetrics } from "@/lib/demo-data";
import { impactReports, reportCsv, reportMethodology, reportSeries, resolveReportPeriod } from "@/lib/impact-reports";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const period = resolveReportPeriod(params.get("period"));
  const report = impactReports[period];
  if (params.get("format") === "csv") {
    return new Response(reportCsv(period), {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Content-Disposition": `attachment; filename="threadline-impact-${period}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  const payload = {
    product: "Threadline",
    workspace: "Meridian Market · Demo",
    period: { id: period, label: report.label },
    generatedAt: DEMO_NOW,
    source: "deterministic-demo",
    report: {
      startDate: report.startDate,
      endDate: report.endDate,
      headline: report.headline,
      modeledHours: report.modeledHours,
      trackedChanges: report.trackedChanges,
      analyzedChanges: report.analyzedChanges,
      metrics: report.metrics.map(({ label, value, delta, positive, direction, detail }) => ({ label, value, delta, positive, direction, detail })),
      series: reportSeries(period),
      riskMix: report.riskMix.map(({ label, value, count }) => ({ label, value, count })),
      services: report.services,
      narrative: report.narrative,
      methodology: reportMethodology,
    },
    snapshotContext: {
      note: "The incident, dora, slos, and impact fields below preserve the original incident snapshot. They are not aggregates for the selected report period.",
      timestamp: DEMO_NOW,
    },
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
