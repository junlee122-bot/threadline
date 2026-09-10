import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/reports/impact/route";
import { impactReports, type ReportPeriodId } from "@/lib/impact-reports";

describe("impact report download", () => {
  it("returns an attributable JSON attachment for a supported period", async () => {
    const response = GET(new Request("https://threadline.example/api/reports/impact?period=30d"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="threadline-impact-30d.json"',
    );
    expect(payload.period).toEqual({ id: "30d", label: "Last 30 days" });
    expect(payload.incident.id).toBe("INC-2471");
    expect(payload.source).toBe("deterministic-demo");
    expect(payload.dora).toHaveLength(5);
    expect(payload.slos).toHaveLength(4);
    expect(payload.snapshotContext.note).toContain("not aggregates for the selected report period");
    expect(payload.report.modeledHours).toBe(76.2);
    expect(payload.report.trackedChanges).toBe(2004);
    expect(payload.report.series).toHaveLength(5);
    expect(payload.report.methodology.classification).toBe("illustrative-model");
  });

  it("falls back to seven days for an unknown period", async () => {
    const response = GET(new Request("https://threadline.example/api/reports/impact?period=invalid"));
    const payload = await response.json();

    expect(payload.period.id).toBe("7d");
    expect(response.headers.get("content-disposition")).toContain("threadline-impact-7d.json");
  });

  it.each([
    ["7d", 18.4, 481, 7, "2026-07-08"],
    ["30d", 76.2, 2004, 5, "2026-06-15"],
    ["90d", 231, 5977, 7, "2026-04-16"],
  ] as const)("exports the selected %s cohort rather than a fixed incident summary", async (period, hours, tracked, buckets, start) => {
    const payload = await GET(new Request(`https://threadline.example/api/reports/impact?period=${period}`)).json();
    expect(payload.report.modeledHours).toBe(hours);
    expect(payload.report.trackedChanges).toBe(tracked);
    expect(payload.report.startDate).toBe(start);
    expect(payload.report.endDate).toBe("2026-07-14");
    expect(payload.report.series).toHaveLength(buckets);
    expect(payload.report.series.reduce((sum: number, point: { modeledHours: number }) => sum + point.modeledHours, 0)).toBeCloseTo(hours);
    expect(payload.report.series.reduce((sum: number, point: { trackedChanges: number }) => sum + point.trackedChanges, 0)).toBe(tracked);
    expect(payload.report.riskMix.reduce((sum: number, risk: { count: number }) => sum + risk.count, 0)).toBe(tracked);
  });

  it.each(["7d", "30d", "90d"] as ReportPeriodId[])("downloads CSV with exactly the %s chart values and date bounds", async (period) => {
    const response = GET(new Request(`https://threadline.example/api/reports/impact?period=${period}&format=csv`));
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toBe(`attachment; filename="threadline-impact-${period}.csv"`);
    const rows = (await response.text()).trim().split("\r\n").map((line) => line.split(",").map((value) => value.slice(1, -1)));
    expect(rows[0]).toEqual(["period", "start_date", "end_date", "bucket", "modeled_hours", "tracked_changes", "source", "timezone"]);
    const report = impactReports[period];
    expect(rows.slice(1).map((row) => Number(row[4]))).toEqual(report.hours);
    expect(rows.slice(1).map((row) => Number(row[5]))).toEqual(report.volume);
    expect(rows[1][1]).toBe(report.startDate);
    expect(rows.at(-1)?.[2]).toBe(report.endDate);
    expect(rows.slice(1).every((row) => row[6] === "deterministic-demo" && row[7] === "Asia/Seoul")).toBe(true);
  });

  it("keeps the date buckets contiguous, including partial final buckets", () => {
    for (const [period, report] of Object.entries(impactReports)) {
      const dayCount = (Date.parse(report.endDate) - Date.parse(report.startDate)) / 86400000 + 1;
      expect(dayCount).toBe(Number.parseInt(period, 10));
      for (let index = 1; index < report.bucketStarts.length; index++) {
        expect(Date.parse(report.bucketStarts[index]) - Date.parse(report.bucketEnds[index - 1])).toBe(86400000);
      }
    }
  });

  it.each(["toString", "constructor", "__proto__"])("does not treat the prototype property %s as a valid period", async (period) => {
    const payload = await GET(new Request(`https://threadline.example/api/reports/impact?period=${period}`)).json();
    expect(payload.period.id).toBe("7d");
    expect(payload.report.modeledHours).toBe(18.4);
  });
});
