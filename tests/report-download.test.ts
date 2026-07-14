import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/reports/impact/route";

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
  });

  it("falls back to seven days for an unknown period", async () => {
    const response = GET(new Request("https://threadline.example/api/reports/impact?period=invalid"));
    const payload = await response.json();

    expect(payload.period.id).toBe("7d");
    expect(response.headers.get("content-disposition")).toContain("threadline-impact-7d.json");
  });
});
