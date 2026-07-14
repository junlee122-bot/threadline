import type {
  LabDecisionChoice,
  LabDecisionEffects,
  LabDecisionRecord,
  LabIncidentDecision,
  LabIncidentResult,
  LabServiceId,
  LabServiceLink,
  LabServiceNode,
  LabSimulationModifiers,
  LabSimulationSnapshot,
  LabSystemStatus,
} from "@/types/crisis-lab";

export const LAB_TOTAL_SECONDS = 8 * 60;

export const LAB_INITIAL_MODIFIERS: LabSimulationModifiers = {
  stability: 0,
  load: 0,
  cache: 0,
  database: 0,
  observability: 0,
  revenue: 0,
};

function effects(
  stability: number,
  load: number,
  cache: number,
  database: number,
  observability: number,
  revenue: number,
): LabDecisionEffects {
  return { stability, load, cache, database, observability, revenue };
}

/**
 * FAULTLINE scenario 047 is the training twin for THREADLINE's live incident
 * experience. The release is deliberate misdirection; the causal chain is a
 * synchronized cache expiry -> origin stampede -> database pool exhaustion.
 */
export const LAB_DECISIONS: LabIncidentDecision[] = [
  {
    id: "first-signal",
    triggerAt: 45,
    index: "01 / 06",
    title: "A suspicious coincidence",
    situation:
      "Checkout p95 rose four minutes after release 24.7.13. Cache misses are climbing too, but the deploy touched no cache code.",
    signal: "Release correlation 0.61 · cache-miss correlation 0.93",
    choices: [
      {
        id: "trace-correlation",
        label: "Trace the dependency chain",
        command: "trace --from checkout --through cache,db --freeze-deploys",
        description: "Freeze new changes and correlate cache misses with database saturation before mutating production.",
        rationale: "The trace exposes the cache-to-database causal edge and preserves the response window.",
        verdict: "optimal",
        scoreDelta: 12,
        effects: effects(3, 4, 8, 6, 18, 2),
      },
      {
        id: "rollback-release",
        label: "Rollback the release",
        command: "deploy rollback release-24.7.13 --global",
        description: "Treat temporal correlation as causation and spend the next deployment window reverting.",
        rationale: "The release is a red herring. Rollback adds churn while the cache stampede keeps opening database connections.",
        verdict: "dangerous",
        scoreDelta: -10,
        effects: effects(-5, -2, 0, -3, -6, -7),
      },
      {
        id: "scale-api",
        label: "Double API capacity",
        command: "scale api-gateway --replicas 2x",
        description: "Add stateless capacity to absorb the latency spike while investigation continues.",
        rationale: "More workers briefly hide queueing, but create more concurrent calls to the constrained database.",
        verdict: "mixed",
        scoreDelta: 1,
        effects: effects(3, -4, 0, -8, 2, 1),
      },
    ],
  },
  {
    id: "cache-stampede",
    triggerAt: 110,
    index: "02 / 06",
    title: "The herd arrives",
    situation: "A synchronized TTL cohort expired across 38 hot product keys. Thousands of workers are rebuilding identical values.",
    signal: "Hit rate 96% → 34% · origin reads +1,840%",
    choices: [
      {
        id: "single-flight",
        label: "Coalesce cache fills",
        command: "cache singleflight enable --keys hotset --stale-while-revalidate",
        description: "Serve stale values and allow only one origin request to rebuild each hot key.",
        rationale: "Request coalescing breaks the stampede at its source and immediately relieves the database.",
        verdict: "optimal",
        scoreDelta: 15,
        effects: effects(9, 10, 30, 12, 4, 10),
      },
      {
        id: "flush-cache",
        label: "Flush the entire cache",
        command: "cache flush --all --force",
        description: "Remove suspect entries and let every node rebuild from the source of truth.",
        rationale: "A global flush turns a partial stampede into a guaranteed one and multiplies origin reads.",
        verdict: "dangerous",
        scoreDelta: -18,
        effects: effects(-12, -14, -35, -24, -2, -14),
      },
      {
        id: "add-workers",
        label: "Add checkout workers",
        command: "scale checkout-workers --replicas +120",
        description: "Increase consumer concurrency to drain the visible queue.",
        rationale: "The queue drains briefly, but additional consumers amplify pressure on the same bottleneck.",
        verdict: "mixed",
        scoreDelta: -3,
        effects: effects(3, -8, 2, -12, 1, 2),
      },
    ],
  },
  {
    id: "pool-exhaustion",
    triggerAt: 175,
    index: "03 / 06",
    title: "Connections at the redline",
    situation: "The primary has capacity for 1,800 connections. Active sessions crossed 1,620 and lock wait time is accelerating.",
    signal: "Pool utilization 91% · lock waits +730% · CPU only 58%",
    choices: [
      {
        id: "backpressure",
        label: "Gate concurrency",
        command: "gateway shed --class noncritical --db-concurrency 720",
        description: "Apply backpressure, preserve payment writes, and reject low-value fan-out before it reaches the pool.",
        rationale: "Concurrency limits stop connection amplification while protecting the revenue-critical path.",
        verdict: "optimal",
        scoreDelta: 14,
        effects: effects(12, 25, 0, 28, 2, 0),
      },
      {
        id: "raise-pool-limit",
        label: "Raise the pool ceiling",
        command: "db pool set --max 3200",
        description: "Allow every waiting worker to open a database connection.",
        rationale: "The database is waiting on locks, not CPU. More sessions deepen contention and push the primary into collapse.",
        verdict: "dangerous",
        scoreDelta: -16,
        effects: effects(-18, -10, -4, -32, -5, -12),
      },
      {
        id: "kill-long-queries",
        label: "Terminate long queries",
        command: "db terminate --older-than 15s --exclude payments",
        description: "Free a subset of occupied sessions without changing admission control.",
        rationale: "This buys time, but stampede reads refill every connection until upstream pressure is gated.",
        verdict: "mixed",
        scoreDelta: 4,
        effects: effects(5, 2, 0, 11, 4, 0),
      },
    ],
  },
  {
    id: "blast-radius",
    triggerAt: 250,
    index: "04 / 06",
    title: "Choose what survives",
    situation: "Search, recommendations, and order history now compete with payments for the same constrained dependencies.",
    signal: "$612 lost / sec · 86,000 active checkout sessions",
    choices: [
      {
        id: "degraded-checkout",
        label: "Enter graceful degradation",
        command: "features disable recs,history --preserve checkout,payments",
        description: "Remove nonessential reads and keep a minimal checkout path online.",
        rationale: "A smaller product surface sharply reduces fan-out while preserving the transaction path customers need.",
        verdict: "optimal",
        scoreDelta: 11,
        effects: effects(14, 18, 3, 10, 1, 14),
      },
      {
        id: "global-failover",
        label: "Fail over the whole region",
        command: "traffic failover us-east eu-west --all",
        description: "Move all traffic to a warm region that still shares the global catalog primary.",
        rationale: "The bottleneck follows the workload because the destination still depends on the saturated global database.",
        verdict: "dangerous",
        scoreDelta: -9,
        effects: effects(-10, -20, 0, -14, 1, -10),
      },
      {
        id: "payments-only",
        label: "Queue new orders",
        command: "checkout mode queue --confirm-asynchronously",
        description: "Accept carts into a durable queue and process payment confirmation asynchronously.",
        rationale: "Queueing protects intent and reduces synchronous load, though confirmation latency costs some conversion.",
        verdict: "mixed",
        scoreDelta: 5,
        effects: effects(9, 13, 0, 7, 2, -3),
      },
    ],
  },
  {
    id: "recovery-window",
    triggerAt: 330,
    index: "05 / 06",
    title: "Recovery can trigger a second wave",
    situation: "The pool is draining. Millions of invalid or expired keys remain, and a careless recovery will recreate the herd.",
    signal: "Connection slope −42/min · cold-key population 2.8M",
    choices: [
      {
        id: "progressive-warm",
        label: "Warm the cache progressively",
        command: "cache warm --rate 2pct/min --jitter-ttl 35pct --canary 5pct",
        description: "Canary hot keys, jitter expirations, and expand only while connection pressure falls.",
        rationale: "A staggered warm-up prevents synchronized expiry and converts recovery into a controlled slope.",
        verdict: "optimal",
        scoreDelta: 15,
        effects: effects(14, 8, 28, 16, 3, 4),
      },
      {
        id: "invalidate-again",
        label: "Invalidate and rebuild cleanly",
        command: "cache invalidate --namespace catalog --rebuild-now",
        description: "Discard the remaining cache population and perform one clean rebuild.",
        rationale: "The second invalidation synchronizes the cold population and launches another origin-read wave.",
        verdict: "dangerous",
        scoreDelta: -18,
        effects: effects(-16, -12, -30, -20, -2, -14),
      },
      {
        id: "hold-forty-percent",
        label: "Hold traffic at 40%",
        command: "gateway cap --traffic 40pct --until manual",
        description: "Keep the system stable at a low ceiling without repairing cache behavior yet.",
        rationale: "The platform stabilizes, but unresolved cache behavior and lost demand prevent a full recovery.",
        verdict: "mixed",
        scoreDelta: 2,
        effects: effects(8, 12, 2, 9, 1, -8),
      },
    ],
  },
  {
    id: "restore-service",
    triggerAt: 410,
    index: "06 / 06",
    title: "The last gate",
    situation: "Customer traffic is waiting behind the gates. Metrics are green, but only under reduced concurrency.",
    signal: "p95 612ms · pool 43% · queued sessions 118,000",
    choices: [
      {
        id: "slo-gated-release",
        label: "Reopen against live SLOs",
        command: "gateway ramp --step 10pct --guard p95<800,pool<70",
        description: "Increase traffic in measured steps and stop automatically if saturation returns.",
        rationale: "SLO gates recover revenue while keeping the restored cache and database inside safe limits.",
        verdict: "optimal",
        scoreDelta: 14,
        effects: effects(16, 10, 8, 14, 2, 8),
      },
      {
        id: "open-floodgates",
        label: "Reopen all traffic now",
        command: "gateway cap --remove --all-regions",
        description: "Recover conversion immediately by releasing every waiting session.",
        rationale: "The synchronized surge recreates connection pressure before the cache population is fully healthy.",
        verdict: "dangerous",
        scoreDelta: -17,
        effects: effects(-18, -25, -8, -20, 0, 8),
      },
      {
        id: "stay-degraded",
        label: "Stay degraded until morning",
        command: "incident hold --mode degraded --ttl 8h",
        description: "Protect stability by leaving gates and nonessential features disabled.",
        rationale: "Safe but costly: the incident is contained without restoring normal customer experience or revenue.",
        verdict: "mixed",
        scoreDelta: 3,
        effects: effects(9, 15, 4, 10, 1, -18),
      },
    ],
  },
];

const MODIFIER_MIN = -100;
const MODIFIER_MAX = 100;
const LOSS_INTEGRATION_STEP = 4;

interface RawFrame {
  stampede: number;
  poolExhaustion: number;
  cascade: number;
  latency: number;
  errorRate: number;
  throughput: number;
  dbConnections: number;
  cacheHitRate: number;
  affectedUsers: number;
  revenueLossRate: number;
  health: number;
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, finite(value, minimum)));
}

function roundTo(value: number, digits = 0): number {
  const magnitude = 10 ** digits;
  return Math.round((value + Number.EPSILON) * magnitude) / magnitude;
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function sanitizeModifiers(modifiers: LabSimulationModifiers): LabSimulationModifiers {
  return {
    stability: clamp(modifiers.stability, MODIFIER_MIN, MODIFIER_MAX),
    load: clamp(modifiers.load, MODIFIER_MIN, MODIFIER_MAX),
    cache: clamp(modifiers.cache, MODIFIER_MIN, MODIFIER_MAX),
    database: clamp(modifiers.database, MODIFIER_MIN, MODIFIER_MAX),
    observability: clamp(modifiers.observability, MODIFIER_MIN, MODIFIER_MAX),
    revenue: clamp(modifiers.revenue, MODIFIER_MIN, MODIFIER_MAX),
  };
}

function calculateFrame(elapsed: number, inputModifiers: LabSimulationModifiers): RawFrame {
  const time = clamp(elapsed, 0, LAB_TOTAL_SECONDS);
  const modifiers = sanitizeModifiers(inputModifiers);
  const stampede = smoothstep(20, 130, time);
  const poolExhaustion = smoothstep(80, 260, time);
  const cascade = smoothstep(180, 390, time);

  const cacheHitRate = clamp(97 - 70 * stampede + 0.78 * modifiers.cache + 0.12 * modifiers.stability, 3, 99.5);
  const dbConnections = clamp(
    260 + 1_450 * poolExhaustion + 280 * cascade - 8.5 * modifiers.database - 4.2 * modifiers.cache - 4 * modifiers.load - 1.5 * modifiers.stability,
    90,
    2_400,
  );
  const latency = clamp(
    130 + 460 * stampede + 1_250 * poolExhaustion + 1_200 * cascade - 14 * modifiers.stability - 9 * modifiers.database - 5 * modifiers.cache - 4 * modifiers.load,
    70,
    6_500,
  );
  const errorRate = clamp(
    0.35 + 2.2 * stampede + 14 * poolExhaustion + 24 * cascade - 0.22 * modifiers.stability - 0.12 * modifiers.database - 0.08 * modifiers.cache - 0.07 * modifiers.load,
    0.05,
    99.9,
  );
  const demand = 8_350 + 380 * Math.sin(time / 31) + 170 * Math.sin(time / 9);
  const availability = clamp(1 - errorRate / 112, 0.08, 1);
  const admission = clamp(1 - Math.max(0, modifiers.load) * 0.0022, 0.72, 1);
  const throughput = clamp(demand * availability * admission, 300, 9_200);
  const affectedUsers = clamp(
    300 + errorRate * 2_300 + Math.max(0, latency - 220) * 25 + Math.max(0, 90 - cacheHitRate) * 110 - Math.max(0, modifiers.revenue) * 100,
    0,
    250_000,
  );
  const revenueProtectionFactor = clamp(1 - modifiers.revenue / 180, 0.45, 1.6);
  const revenueLossRate = clamp(
    (affectedUsers * 0.0028 + errorRate * 5 + Math.max(0, 7_200 - throughput) * 0.025) * revenueProtectionFactor,
    0,
    1_600,
  );
  const health = clamp(
    100 - errorRate * 0.8 - Math.max(0, latency - 180) / 75 - Math.max(0, dbConnections - 350) / 55 - Math.max(0, 90 - cacheHitRate) * 0.35 + Math.max(0, modifiers.stability) * 0.08 + Math.max(0, modifiers.observability) * 0.03,
    0,
    100,
  );

  return { stampede, poolExhaustion, cascade, latency, errorRate, throughput, dbConnections, cacheHitRate, affectedUsers, revenueLossRate, health };
}

function integrateRevenueLoss(elapsed: number, modifiers: LabSimulationModifiers): number {
  const end = clamp(elapsed, 0, LAB_TOTAL_SECONDS);
  let cursor = 0;
  let total = 0;
  while (cursor < end) {
    const width = Math.min(LOSS_INTEGRATION_STEP, end - cursor);
    total += calculateFrame(cursor + width / 2, modifiers).revenueLossRate * width;
    cursor += width;
  }
  return total;
}

export function formatLabTime(elapsed: number): string {
  const wholeSeconds = Math.floor(clamp(elapsed, 0, LAB_TOTAL_SECONDS));
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function systemStatus(frame: RawFrame, modifiers: LabSimulationModifiers): LabSystemStatus {
  if (frame.health < 35) return "critical";
  if (frame.health < 68) return "degraded";
  const responseStrength = modifiers.stability + modifiers.load + modifiers.cache + modifiers.database + modifiers.observability * 0.5;
  const incidentPressure = frame.stampede * 0.25 + frame.poolExhaustion * 0.35 + frame.cascade * 0.4;
  if (incidentPressure > 0.08 && responseStrength > 35) return "recovering";
  if (incidentPressure > 0.08) return "degraded";
  return "nominal";
}

function serviceStatus(load: number, recovering: boolean): LabSystemStatus {
  if (load >= 82) return "critical";
  if (load >= 58) return "degraded";
  if (recovering && load >= 25) return "recovering";
  return "nominal";
}

function makeServices(frame: RawFrame, modifiers: LabSimulationModifiers, status: LabSystemStatus): LabServiceNode[] {
  const recovering = status === "recovering";
  const throughputDeficit = Math.max(0, 8_000 - frame.throughput);
  const loads: Record<LabServiceId, number> = {
    edge: clamp(18 + frame.errorRate * 0.7 + throughputDeficit / 190, 0, 100),
    gateway: clamp(20 + frame.errorRate * 1.1 + throughputDeficit / 130 - Math.max(0, modifiers.load) * 0.12, 0, 100),
    checkout: clamp(22 + frame.errorRate * 1.4 + frame.latency / 55 - Math.max(0, modifiers.stability) * 0.12, 0, 100),
    payments: clamp(18 + frame.errorRate * 1.3 + frame.dbConnections / 65, 0, 100),
    cache: clamp(100 - frame.cacheHitRate, 0, 100),
    database: clamp(frame.dbConnections / 20, 0, 100),
  };
  const service = (id: LabServiceId, label: string, code: string, metricLabel: string, metricValue: string): LabServiceNode => ({
    id,
    label,
    code,
    status: serviceStatus(loads[id], recovering),
    metricLabel,
    metricValue,
    load: Math.round(loads[id]),
  });
  return [
    service("edge", "Global edge", "EDGE", "Egress", `${Math.round(frame.throughput).toLocaleString("en-US")} rps`),
    service("gateway", "API gateway", "GTWY", "Admitted", `${Math.round(frame.throughput).toLocaleString("en-US")} rps`),
    service("checkout", "Checkout", "CHKT", "p95 latency", `${Math.round(frame.latency).toLocaleString("en-US")} ms`),
    service("payments", "Payments", "PAY", "Error rate", `${roundTo(frame.errorRate, 1).toFixed(1)}%`),
    service("cache", "Catalog cache", "CACH", "Hit rate", `${roundTo(frame.cacheHitRate, 1).toFixed(1)}%`),
    service("database", "Primary DB", "PG-01", "Connections", `${Math.round(frame.dbConnections).toLocaleString("en-US")} / 1,800`),
  ];
}

function makeLinks(services: LabServiceNode[], throughput: number): LabServiceLink[] {
  const byId = new Map(services.map((service) => [service.id, service]));
  const recovering = services.some((service) => service.status === "recovering");
  const link = (from: LabServiceId, to: LabServiceId, trafficFactor = 1): LabServiceLink => {
    const load = Math.max(byId.get(from)?.load ?? 0, byId.get(to)?.load ?? 0);
    return { from, to, status: serviceStatus(load, recovering), traffic: Math.round(clamp((throughput / 92) * trafficFactor, 0, 100)) };
  };
  return [
    link("edge", "gateway"),
    link("gateway", "checkout", 0.92),
    link("checkout", "payments", 0.67),
    link("checkout", "cache", 0.88),
    link("payments", "database", 0.56),
    link("cache", "database", 0.76),
  ];
}

export function computeLabSnapshot(elapsed: number, inputModifiers: LabSimulationModifiers): LabSimulationSnapshot {
  const safeElapsed = clamp(elapsed, 0, LAB_TOTAL_SECONDS);
  const modifiers = sanitizeModifiers(inputModifiers);
  const frame = calculateFrame(safeElapsed, modifiers);
  const status = systemStatus(frame, modifiers);
  const services = makeServices(frame, modifiers, status);
  return {
    elapsed: safeElapsed,
    remaining: Math.max(0, LAB_TOTAL_SECONDS - safeElapsed),
    health: Math.round(frame.health),
    affectedUsers: Math.round(frame.affectedUsers),
    revenueLossRate: Math.round(frame.revenueLossRate),
    totalRevenueLost: Math.round(integrateRevenueLoss(safeElapsed, modifiers)),
    metrics: {
      tick: Math.floor(safeElapsed),
      timeLabel: `T+${formatLabTime(safeElapsed)}`,
      latency: Math.round(frame.latency),
      errorRate: roundTo(frame.errorRate, 1),
      throughput: Math.round(frame.throughput),
      dbConnections: Math.round(frame.dbConnections),
      cacheHitRate: roundTo(frame.cacheHitRate, 1),
      revenueLoss: Math.round(frame.revenueLossRate),
    },
    services,
    links: makeLinks(services, frame.throughput),
    status,
  };
}

export function applyLabChoice(inputModifiers: LabSimulationModifiers, choice: LabDecisionChoice): LabSimulationModifiers {
  const modifiers = sanitizeModifiers(inputModifiers);
  return {
    stability: clamp(modifiers.stability + finite(choice.effects.stability), MODIFIER_MIN, MODIFIER_MAX),
    load: clamp(modifiers.load + finite(choice.effects.load), MODIFIER_MIN, MODIFIER_MAX),
    cache: clamp(modifiers.cache + finite(choice.effects.cache), MODIFIER_MIN, MODIFIER_MAX),
    database: clamp(modifiers.database + finite(choice.effects.database), MODIFIER_MIN, MODIFIER_MAX),
    observability: clamp(modifiers.observability + finite(choice.effects.observability), MODIFIER_MIN, MODIFIER_MAX),
    revenue: clamp(modifiers.revenue + finite(choice.effects.revenue), MODIFIER_MIN, MODIFIER_MAX),
  };
}

const POSSIBLE_SCORE_MIN = LAB_DECISIONS.reduce((total, decision) => total + Math.min(...decision.choices.map((choice) => choice.scoreDelta)), 0);
const POSSIBLE_SCORE_MAX = LAB_DECISIONS.reduce((total, decision) => total + Math.max(...decision.choices.map((choice) => choice.scoreDelta)), 0);

export function buildLabResult(snapshot: LabSimulationSnapshot, records: LabDecisionRecord[]): LabIncidentResult {
  const canonicalChoices = new Map<string, { scoreDelta: number; verdict: LabDecisionChoice["verdict"] }>();
  for (const record of records) {
    const decision = LAB_DECISIONS.find((candidate) => candidate.id === record.decisionId);
    const choice = decision?.choices.find((candidate) => candidate.id === record.choiceId);
    if (decision && choice) canonicalChoices.set(decision.id, { scoreDelta: choice.scoreDelta, verdict: choice.verdict });
  }
  const canonical = [...canonicalChoices.values()];
  const rawDecisionScore = canonical.reduce((total, choice) => total + choice.scoreDelta, 0);
  const decisionQuality = clamp(((rawDecisionScore - POSSIBLE_SCORE_MIN) / (POSSIBLE_SCORE_MAX - POSSIBLE_SCORE_MIN)) * 100, 0, 100);
  const accuracy = Math.round(
    (canonical.reduce((total, choice) => total + (choice.verdict === "optimal" ? 1 : choice.verdict === "mixed" ? 0.4 : 0), 0) / LAB_DECISIONS.length) * 100,
  );
  const finalHealth = Math.round(clamp(snapshot.health, 0, 100));
  const score = Math.round(clamp(finalHealth * 0.5 + accuracy * 0.3 + decisionQuality * 0.2, 0, 100));
  const ending: LabIncidentResult["ending"] =
    score >= 82 && finalHealth >= 75 && accuracy >= 67 ? "sovereign" : score >= 40 && finalHealth >= 35 ? "contained" : "cascade";
  const grade: LabIncidentResult["grade"] = score >= 90 ? "S" : score >= 78 ? "A" : score >= 64 ? "B" : score >= 48 ? "C" : "D";
  const noInterventionLoss = computeLabSnapshot(LAB_TOTAL_SECONDS, LAB_INITIAL_MODIFIERS).totalRevenueLost;
  const revenueLost = Math.max(0, Math.round(snapshot.totalRevenueLost));
  return {
    ending,
    grade,
    score,
    mttrSeconds: ending === "cascade" ? LAB_TOTAL_SECONDS : Math.round(clamp(LAB_TOTAL_SECONDS - Math.max(0, score - 25) * 3.4, 180, LAB_TOTAL_SECONDS)),
    peakAffectedUsers: Math.round(Math.max(Math.max(0, finite(snapshot.affectedUsers)), 12_000 + (100 - finalHealth) * 1_700)),
    revenueProtected: Math.max(0, noInterventionLoss - revenueLost),
    revenueLost,
    finalHealth,
    accuracy,
  };
}

export function createLabReport(result: LabIncidentResult, records: LabDecisionRecord[]): string {
  return [
    "# THREADLINE CRISIS LAB / AFTER-ACTION REPORT",
    "",
    `Scenario: FAULTLINE 047 — Cache stampede`,
    `Ending: ${result.ending.toUpperCase()}`,
    `Grade: ${result.grade} (${result.score}/100)`,
    `MTTR: ${formatLabTime(result.mttrSeconds)}`,
    `Decision accuracy: ${result.accuracy}%`,
    `Revenue protected: $${result.revenueProtected.toLocaleString("en-US")}`,
    `Revenue lost: $${result.revenueLost.toLocaleString("en-US")}`,
    "",
    "## COMMAND TIMELINE",
    ...records.flatMap((record) => [
      "",
      `### T+${formatLabTime(record.chosenAt)} / ${record.choiceLabel}`,
      `\`${record.command}\``,
      `${record.verdict.toUpperCase()} (${record.scoreDelta > 0 ? "+" : ""}${record.scoreDelta}) — ${record.rationale}`,
    ]),
    "",
    "## ROOT CAUSE",
    "A synchronized cache expiry triggered an origin stampede, exhausted the database connection pool, and cascaded into checkout.",
    "",
    "_Generated by Threadline Crisis Lab. Scenario data is deterministic and synthetic._",
  ].join("\n");
}
