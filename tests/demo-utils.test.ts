import { describe, expect, it } from "vitest";
import {
  agentRuns,
  changes,
  evidence,
  services,
  timelineEvents,
} from "@/lib/demo-data";
import {
  filterAgentRuns,
  filterChanges,
  filterServices,
  filterTimelineEvents,
  formatDuration,
  formatRelativeTime,
  getDownstreamServices,
  getEvidenceForNode,
  getServiceById,
  getUpstreamServices,
  minutesBetween,
  riskBand,
  riskScore,
} from "@/lib/demo-utils";

describe("time formatters", () => {
  it("formats deterministic relative time in both directions", () => {
    const now = "2026-07-14T10:42:00.000Z";

    expect(formatRelativeTime(now, now)).toBe("just now");
    expect(formatRelativeTime("2026-07-14T10:41:30.000Z", now)).toBe("just now");
    expect(formatRelativeTime("2026-07-14T10:42:30.000Z", now)).toBe("in a moment");
    expect(formatRelativeTime("2026-07-14T10:37:00.000Z", now)).toBe("5m ago");
    expect(formatRelativeTime("2026-07-14T12:42:00.000Z", now)).toBe("in 2h");
    expect(formatRelativeTime("2026-07-12T10:42:00.000Z", now)).toBe("2d ago");
  });

  it("formats durations at unit boundaries and clamps negative values", () => {
    expect(formatDuration(-50)).toBe("0 ms");
    expect(formatDuration(999)).toBe("999 ms");
    expect(formatDuration(1_000)).toBe("1 s");
    expect(formatDuration(61_000)).toBe("1 min 1 s");
    expect(formatDuration(3_600_000)).toBe("1 h");
    expect(formatDuration(3_660_000)).toBe("1 h 1 min");
    expect(formatDuration(90_000_000)).toBe("1 d 1 h");
  });

  it("calculates elapsed minutes without relying on the system clock", () => {
    expect(
      minutesBetween("2026-07-14T09:24:00.000Z", "2026-07-14T09:40:00.000Z"),
    ).toBe(16);
    expect(minutesBetween(0, 90_000)).toBe(1.5);
  });
});

describe("risk helpers", () => {
  it("normalizes a change risk score to an integer from zero to one hundred", () => {
    const change = changes[0];
    expect(change).toBeDefined();

    expect(riskScore(change)).toBe(92);
    expect(riskScore({ risk: { score: -12.4, level: "low", factors: [] } })).toBe(0);
    expect(riskScore({ risk: { score: 48.6, level: "medium", factors: [] } })).toBe(49);
    expect(riskScore({ risk: { score: 144, level: "critical", factors: [] } })).toBe(100);
  });

  it("uses stable, inclusive risk-band thresholds", () => {
    expect(riskBand(-1)).toBe("low");
    expect(riskBand(29.99)).toBe("low");
    expect(riskBand(30)).toBe("medium");
    expect(riskBand(59.99)).toBe("medium");
    expect(riskBand(60)).toBe("high");
    expect(riskBand(84.99)).toBe("high");
    expect(riskBand(85)).toBe("critical");
    expect(riskBand(120)).toBe("critical");
  });

  it("keeps declared fixture bands aligned with calculated bands", () => {
    for (const change of changes) {
      expect(change.risk.level, change.id).toBe(riskBand(riskScore(change)));
    }
  });
});

describe("collection filters", () => {
  it("combines service search, health, ownership, and tag filters", () => {
    expect(filterServices(services, { query: "checkout" }).map(({ id }) => id)).toContain(
      "checkout-api",
    );
    expect(
      filterServices(services, { health: ["critical", "degraded"] }).map(({ id }) => id),
    ).toEqual(["tax-adapter", "checkout-api"]);
    expect(filterServices(services, { owner: "core platform" }).map(({ id }) => id)).toEqual([
      "edge-gateway",
    ]);
    expect(filterServices(services, { tags: ["tier:0", "domain:tax"] }).map(({ id }) => id)).toEqual([
      "tax-adapter",
    ]);
  });

  it("combines change search, status, service, and risk ranges", () => {
    expect(filterChanges(changes, { query: "1842" }).map(({ id }) => id)).toEqual(["chg-1842"]);
    expect(
      filterChanges(changes, { status: ["blocked", "ready"] }).map(({ id }) => id),
    ).toEqual(["chg-835", "chg-826"]);

    const results = filterChanges(changes, {
      serviceId: "checkout-api",
      minRisk: 60,
      maxRisk: 80,
    });
    expect(results.map(({ id }) => id)).toEqual(["chg-829"]);
  });

  it("uses inclusive timeline bounds and composes every predicate", () => {
    const results = filterTimelineEvents(timelineEvents, {
      query: "checkout",
      kinds: ["alert", "incident"],
      severities: ["critical"],
      serviceId: "checkout-api",
      from: "2026-07-14T09:21:30.000Z",
      to: "2026-07-14T09:24:00.000Z",
    });

    expect(results.map(({ id }) => id)).toEqual(["tl-05", "tl-06", "tl-08"]);
  });

  it("filters agent runs by search, state, mission, and service", () => {
    expect(filterAgentRuns(agentRuns, { query: "payment SDK" }).map(({ id }) => id)).toEqual([
      "run-release-835",
    ]);

    const results = filterAgentRuns(agentRuns, {
      status: ["running", "awaiting-approval"],
      mission: ["release-readiness", "slo-guard"],
      serviceId: "checkout-api",
    });
    expect(results.map(({ id }) => id)).toEqual(["run-release-835", "run-slo-checkout"]);
  });

  it("returns a new array without mutating source fixtures", () => {
    const original = [...services];
    const filtered = filterServices(services);

    expect(filtered).not.toBe(services);
    expect(filtered).toEqual(original);
    expect(services).toEqual(original);
  });
});

describe("graph selectors", () => {
  it("finds a service and returns undefined for an unknown ID", () => {
    expect(getServiceById("checkout-api")?.name).toBe("Checkout API");
    expect(getServiceById("missing-service")).toBeUndefined();
  });

  it("resolves node evidence in canonical evidence order", () => {
    expect(getEvidenceForNode("node-checkout").map(({ id }) => id)).toEqual([
      "ev-flag-instant-tax-v2",
      "ev-trace-tax-7f91",
      "ev-metric-checkout",
    ]);
    expect(getEvidenceForNode("missing-node", [], evidence)).toEqual([]);
  });

  it("walks all transitive downstream dependencies once", () => {
    const downstream = getDownstreamServices("web-storefront");
    const ids = downstream.map(({ id }) => id);

    expect(ids[0]).toBe("edge-gateway");
    expect(new Set(ids)).toEqual(
      new Set([
        "edge-gateway",
        "identity",
        "tax-adapter",
        "cart",
        "checkout-api",
        "inventory",
        "payments",
      ]),
    );
    expect(ids).not.toContain("web-storefront");
  });

  it("walks all transitive upstream callers once", () => {
    const upstream = getUpstreamServices("payments");
    const ids = upstream.map(({ id }) => id);

    expect(ids[0]).toBe("checkout-api");
    expect(ids).toEqual(["checkout-api", "edge-gateway", "web-storefront"]);
    expect(ids).not.toContain("payments");
  });

  it("returns an empty traversal for unknown services", () => {
    expect(getDownstreamServices("missing-service")).toEqual([]);
    expect(getUpstreamServices("missing-service")).toEqual([]);
  });
});
