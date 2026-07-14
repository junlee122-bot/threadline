import { describe, expect, it } from "vitest";
import {
  DEMO_NOW,
  agentRuns,
  attentionItems,
  causalEdges,
  causalNodes,
  changes,
  evidence,
  incidentSummary,
  metricSeries,
  pulseMetrics,
  reportMetrics,
  services,
  timelineEvents,
} from "@/lib/demo-data";

type Identified = { readonly id: string };

function expectUniqueIds(items: readonly Identified[], label: string) {
  const ids = items.map((item) => item.id);
  expect(new Set(ids).size, `${label} must use unique IDs`).toBe(ids.length);
}

function expectKnownIds(ids: readonly string[], knownIds: ReadonlySet<string>, label: string) {
  for (const id of ids) {
    expect(knownIds.has(id), `${label} references unknown ID "${id}"`).toBe(true);
  }
}

function expectChronological(timestamps: readonly string[], label: string) {
  const parsed = timestamps.map((timestamp) => Date.parse(timestamp));

  for (const value of parsed) {
    expect(Number.isNaN(value), `${label} contains an invalid timestamp`).toBe(false);
  }

  expect(parsed, `${label} must be chronological`).toEqual(
    [...parsed].sort((left, right) => left - right),
  );
}

describe("deterministic demo data", () => {
  it("uses one valid, frozen clock after the incident resolution", () => {
    const now = Date.parse(DEMO_NOW);
    const startedAt = Date.parse(incidentSummary.startedAt);
    const resolvedAt = Date.parse(incidentSummary.resolvedAt ?? "");

    expect(Number.isNaN(now)).toBe(false);
    expect(startedAt).toBeLessThan(resolvedAt);
    expect(resolvedAt).toBeLessThanOrEqual(now);
    expect(reportMetrics.generatedAt).toBe(DEMO_NOW);
    expect(Date.parse(reportMetrics.window.from)).toBeLessThan(Date.parse(reportMetrics.window.to));
    expect(reportMetrics.window.to).toBe(DEMO_NOW);
  });

  it("keeps identifiers unique within every collection", () => {
    const collections: ReadonlyArray<readonly [string, readonly Identified[]]> = [
      ["services", services],
      ["evidence", evidence],
      ["changes", changes],
      ["causal nodes", causalNodes],
      ["causal edges", causalEdges],
      ["timeline events", timelineEvents],
      ["metric series", metricSeries],
      ["agent runs", agentRuns],
      ["DORA metrics", reportMetrics.dora],
      ["SLO reports", reportMetrics.slos],
      ["attention items", attentionItems],
      ["pulse metrics", pulseMetrics],
    ];

    for (const [label, items] of collections) {
      expectUniqueIds(items, label);
    }

    for (const run of agentRuns) {
      expectUniqueIds(run.steps, `steps in ${run.id}`);
    }
  });

  it("locks the INC-2471 tax-quote and human-approved flag-disable story", () => {
    expect(incidentSummary).toMatchObject({
      id: "INC-2471",
      title: "Checkout latency elevated",
      status: "resolved",
      startedAt: "2026-07-14T09:24:00.000Z",
      resolvedAt: "2026-07-14T09:40:00.000Z",
    });
    expect(services.map(({ id }) => id)).toContain("tax-adapter");
    expect(changes.find(({ id }) => id === "chg-1842")).toMatchObject({
      pullRequest: 1842,
      status: "deployed",
      deployedAt: "2026-07-14T09:12:00.000Z",
      serviceIds: ["checkout-api", "tax-adapter"],
    });
    expect(evidence.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        "ev-pr-1842",
        "ev-deploy-2180",
        "ev-flag-instant-tax-v2",
        "ev-trace-tax-7f91",
        "ev-metric-checkout",
        "ev-commerce-conversion",
        "ev-runbook-instant-tax-v2",
      ]),
    );
    expect(causalNodes.find(({ id }) => id === "node-deploy-2180")?.metadata.version).toBe("2.18.0");
    expect(causalNodes.find(({ id }) => id === "node-flag-disable")?.metadata).toMatchObject({
      flag: "instant-tax-v2",
      beforePercent: 100,
      afterPercent: 0,
      approver: "J. Lee",
      approvalRole: "Production Operator",
    });

    const values = (id: string) => metricSeries.find((series) => series.id === id)?.points.map(({ value }) => value) ?? [];
    expect(Math.max(...values("metric-checkout-p95"))).toBe(1840);
    expect(Math.max(...values("metric-checkout-errors"))).toBe(4.9);
    expect(Math.min(...values("metric-checkout-conversion"))).toBe(63.5);
    expect(timelineEvents.at(-1)).toMatchObject({ id: "tl-12", title: "Recovery verified" });
  });

  it("resolves every service and evidence reference", () => {
    const serviceIds = new Set(services.map((service) => service.id));
    const evidenceIds = new Set(evidence.map((item) => item.id));

    expectKnownIds(incidentSummary.serviceIds, serviceIds, incidentSummary.id);

    for (const service of services) {
      expectKnownIds(service.dependencyIds, serviceIds, service.id);
      expect(service.dependencyIds, `${service.id} must not depend on itself`).not.toContain(service.id);
    }

    for (const item of evidence) {
      expectKnownIds(item.serviceIds, serviceIds, item.id);
      expect(() => new URL(item.externalUrl)).not.toThrow();
      expect(new URL(item.externalUrl).protocol).toBe("https:");
    }

    for (const change of changes) {
      expectKnownIds(change.serviceIds, serviceIds, change.id);
      expectKnownIds(change.evidenceIds, evidenceIds, change.id);
    }

    for (const node of causalNodes) {
      if (node.serviceId) expectKnownIds([node.serviceId], serviceIds, node.id);
      expectKnownIds(node.evidenceIds, evidenceIds, node.id);
    }

    for (const event of timelineEvents) {
      expectKnownIds(event.serviceIds, serviceIds, event.id);
      expectKnownIds(event.evidenceIds, evidenceIds, event.id);
    }

    for (const series of metricSeries) {
      expectKnownIds([series.serviceId], serviceIds, series.id);
    }

    for (const run of agentRuns) {
      expectKnownIds(run.serviceIds, serviceIds, run.id);
      expectKnownIds(run.evidenceIds, evidenceIds, run.id);
    }

    for (const slo of reportMetrics.slos) {
      expectKnownIds([slo.serviceId], serviceIds, slo.id);
    }

    for (const item of attentionItems) {
      if (item.serviceId) expectKnownIds([item.serviceId], serviceIds, item.id);
    }
  });

  it("keeps the causal graph connected by valid, evidence-backed edges", () => {
    const nodeIds = new Set(causalNodes.map((node) => node.id));
    const evidenceIds = new Set(evidence.map((item) => item.id));

    for (const edge of causalEdges) {
      expectKnownIds([edge.source, edge.target], nodeIds, edge.id);
      expect(edge.source).not.toBe(edge.target);
      expect(edge.confidence).toBeGreaterThanOrEqual(0);
      expect(edge.confidence).toBeLessThanOrEqual(1);
      expect(edge.evidenceIds.length, `${edge.id} needs supporting evidence`).toBeGreaterThan(0);
      expectKnownIds(edge.evidenceIds, evidenceIds, edge.id);
    }

    const participatingNodeIds = new Set(
      causalEdges.flatMap((edge) => [edge.source, edge.target]),
    );
    expect(participatingNodeIds, "every causal node must participate in the graph").toEqual(nodeIds);

    const incoming = new Map(causalNodes.map((node) => [node.id, 0]));
    const outgoing = new Map(causalNodes.map((node) => [node.id, [] as string[]]));
    for (const edge of causalEdges) {
      incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
      outgoing.get(edge.source)?.push(edge.target);
    }

    const queue = [...incoming].filter(([, count]) => count === 0).map(([id]) => id);
    let visited = 0;
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) continue;
      visited += 1;
      for (const target of outgoing.get(id) ?? []) {
        const nextCount = (incoming.get(target) ?? 0) - 1;
        incoming.set(target, nextCount);
        if (nextCount === 0) queue.push(target);
      }
    }

    expect(visited, "causal graph must remain acyclic").toBe(causalNodes.length);
  });

  it("keeps timelines and metric samples chronological", () => {
    expectChronological(
      timelineEvents.map((event) => event.timestamp),
      "timeline events",
    );

    for (const series of metricSeries) {
      expect(series.points.length, `${series.id} needs enough points to show a trend`).toBeGreaterThan(2);
      expectChronological(
        series.points.map((point) => point.timestamp),
        series.id,
      );
    }

    for (const run of agentRuns) {
      expect(run.progress).toBeGreaterThanOrEqual(0);
      expect(run.progress).toBeLessThanOrEqual(1);
      expect(run.confidence).toBeGreaterThanOrEqual(0);
      expect(run.confidence).toBeLessThanOrEqual(1);
      if (run.finishedAt) {
        expect(Date.parse(run.finishedAt)).toBeGreaterThanOrEqual(Date.parse(run.startedAt));
      }

      for (const step of run.steps) {
        if (step.startedAt && step.finishedAt) {
          expect(Date.parse(step.finishedAt)).toBeGreaterThanOrEqual(Date.parse(step.startedAt));
        }
      }
    }
  });

  it("keeps percentages, risk scores, and SLO values within meaningful bounds", () => {
    for (const service of services) {
      expect(service.slo.availability).toBeGreaterThan(0);
      expect(service.slo.availability).toBeLessThanOrEqual(100);
      expect(service.slo.latencyP95Ms).toBeGreaterThan(0);
    }

    for (const change of changes) {
      expect(change.risk.score).toBeGreaterThanOrEqual(0);
      expect(change.risk.score).toBeLessThanOrEqual(100);
    }

    for (const slo of reportMetrics.slos) {
      expect(slo.target).toBeGreaterThan(0);
      expect(slo.target).toBeLessThanOrEqual(100);
      expect(slo.current).toBeGreaterThan(0);
      expect(slo.current).toBeLessThanOrEqual(100);
      expect(slo.errorBudgetRemaining).toBeGreaterThanOrEqual(0);
      expect(slo.errorBudgetRemaining).toBeLessThanOrEqual(100);
    }
  });
});
