import type {
  DecisionChoice,
  DecisionRecord,
  IncidentResult,
  ServiceId,
  ServiceLink,
  ServiceNode,
  SimulationModifiers,
  SimulationSnapshot,
  SystemStatus,
  TelemetryPoint,
} from '../types'
import {
  INCIDENT_DECISIONS,
  INITIAL_MODIFIERS,
  TOTAL_SECONDS,
} from './scenario'

const MODIFIER_MIN = -100
const MODIFIER_MAX = 100
const LOSS_INTEGRATION_STEP = 4

interface RawFrame {
  stampede: number
  poolExhaustion: number
  cascade: number
  latency: number
  errorRate: number
  throughput: number
  dbConnections: number
  cacheHitRate: number
  affectedUsers: number
  revenueLossRate: number
  health: number
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, finite(value, minimum)))
}

function roundTo(value: number, digits = 0): number {
  const magnitude = 10 ** digits
  return Math.round((value + Number.EPSILON) * magnitude) / magnitude
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp((value - start) / (end - start), 0, 1)
  return progress * progress * (3 - 2 * progress)
}

function sanitizeModifiers(modifiers: SimulationModifiers): SimulationModifiers {
  return {
    stability: clamp(modifiers.stability, MODIFIER_MIN, MODIFIER_MAX),
    load: clamp(modifiers.load, MODIFIER_MIN, MODIFIER_MAX),
    cache: clamp(modifiers.cache, MODIFIER_MIN, MODIFIER_MAX),
    database: clamp(modifiers.database, MODIFIER_MIN, MODIFIER_MAX),
    observability: clamp(
      modifiers.observability,
      MODIFIER_MIN,
      MODIFIER_MAX,
    ),
    revenue: clamp(modifiers.revenue, MODIFIER_MIN, MODIFIER_MAX),
  }
}

/**
 * Produces the causal state at a point in time. There is deliberately no random
 * term: charts, replays, and tests receive the exact same incident every run.
 */
function calculateFrame(
  elapsed: number,
  inputModifiers: SimulationModifiers,
): RawFrame {
  const time = clamp(elapsed, 0, TOTAL_SECONDS)
  const modifiers = sanitizeModifiers(inputModifiers)

  // The cache fails first. Database and checkout failure are delayed consequences.
  const stampede = smoothstep(20, 130, time)
  const poolExhaustion = smoothstep(80, 260, time)
  const cascade = smoothstep(180, 390, time)

  const cacheHitRate = clamp(
    97 -
      70 * stampede +
      0.78 * modifiers.cache +
      0.12 * modifiers.stability,
    3,
    99.5,
  )

  const dbConnections = clamp(
    260 +
      1_450 * poolExhaustion +
      280 * cascade -
      8.5 * modifiers.database -
      4.2 * modifiers.cache -
      4 * modifiers.load -
      1.5 * modifiers.stability,
    90,
    2_400,
  )

  const latency = clamp(
    130 +
      460 * stampede +
      1_250 * poolExhaustion +
      1_200 * cascade -
      14 * modifiers.stability -
      9 * modifiers.database -
      5 * modifiers.cache -
      4 * modifiers.load,
    70,
    6_500,
  )

  const errorRate = clamp(
    0.35 +
      2.2 * stampede +
      14 * poolExhaustion +
      24 * cascade -
      0.22 * modifiers.stability -
      0.12 * modifiers.database -
      0.08 * modifiers.cache -
      0.07 * modifiers.load,
    0.05,
    99.9,
  )

  // A subtle deterministic pulse keeps the telemetry alive without compromising
  // replayability. Positive load relief intentionally trades raw RPS for safety.
  const demand = 8_350 + 380 * Math.sin(time / 31) + 170 * Math.sin(time / 9)
  const availability = clamp(1 - errorRate / 112, 0.08, 1)
  const admission = clamp(1 - Math.max(0, modifiers.load) * 0.0022, 0.72, 1)
  const throughput = clamp(demand * availability * admission, 300, 9_200)

  const affectedUsers = clamp(
    300 +
      errorRate * 2_300 +
      Math.max(0, latency - 220) * 25 +
      Math.max(0, 90 - cacheHitRate) * 110 -
      Math.max(0, modifiers.revenue) * 100,
    0,
    250_000,
  )

  const revenueProtectionFactor = clamp(
    1 - modifiers.revenue / 180,
    0.45,
    1.6,
  )
  const revenueLossRate = clamp(
    (affectedUsers * 0.0028 +
      errorRate * 5 +
      Math.max(0, 7_200 - throughput) * 0.025) *
      revenueProtectionFactor,
    0,
    1_600,
  )

  const health = clamp(
    100 -
      errorRate * 0.8 -
      Math.max(0, latency - 180) / 75 -
      Math.max(0, dbConnections - 350) / 55 -
      Math.max(0, 90 - cacheHitRate) * 0.35 +
      Math.max(0, modifiers.stability) * 0.08 +
      Math.max(0, modifiers.observability) * 0.03,
    0,
    100,
  )

  return {
    stampede,
    poolExhaustion,
    cascade,
    latency,
    errorRate,
    throughput,
    dbConnections,
    cacheHitRate,
    affectedUsers,
    revenueLossRate,
    health,
  }
}

function integrateRevenueLoss(
  elapsed: number,
  modifiers: SimulationModifiers,
): number {
  const end = clamp(elapsed, 0, TOTAL_SECONDS)
  let cursor = 0
  let total = 0

  while (cursor < end) {
    const width = Math.min(LOSS_INTEGRATION_STEP, end - cursor)
    const midpoint = cursor + width / 2
    total += calculateFrame(midpoint, modifiers).revenueLossRate * width
    cursor += width
  }

  return total
}

function formatElapsed(elapsed: number): string {
  const wholeSeconds = Math.floor(clamp(elapsed, 0, TOTAL_SECONDS))
  const minutes = Math.floor(wholeSeconds / 60)
  const seconds = wholeSeconds % 60
  return `T+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function systemStatus(
  frame: RawFrame,
  modifiers: SimulationModifiers,
): SystemStatus {
  if (frame.health < 35) return 'critical'
  if (frame.health < 68) return 'degraded'

  const responseStrength =
    modifiers.stability +
    modifiers.load +
    modifiers.cache +
    modifiers.database +
    modifiers.observability * 0.5
  const incidentPressure =
    frame.stampede * 0.25 +
    frame.poolExhaustion * 0.35 +
    frame.cascade * 0.4

  if (incidentPressure > 0.08 && responseStrength > 35) return 'recovering'
  if (incidentPressure > 0.08) return 'degraded'
  return 'nominal'
}

function serviceStatus(load: number, recovering: boolean): SystemStatus {
  if (load >= 82) return 'critical'
  if (load >= 58) return 'degraded'
  if (recovering && load >= 25) return 'recovering'
  return 'nominal'
}

function makeServices(
  frame: RawFrame,
  modifiers: SimulationModifiers,
  status: SystemStatus,
): ServiceNode[] {
  const recovering = status === 'recovering'
  const throughputDeficit = Math.max(0, 8_000 - frame.throughput)
  const loads: Record<ServiceId, number> = {
    edge: clamp(18 + frame.errorRate * 0.7 + throughputDeficit / 190, 0, 100),
    gateway: clamp(
      20 +
        frame.errorRate * 1.1 +
        throughputDeficit / 130 -
        Math.max(0, modifiers.load) * 0.12,
      0,
      100,
    ),
    checkout: clamp(
      22 +
        frame.errorRate * 1.4 +
        frame.latency / 55 -
        Math.max(0, modifiers.stability) * 0.12,
      0,
      100,
    ),
    payments: clamp(
      18 + frame.errorRate * 1.3 + frame.dbConnections / 65,
      0,
      100,
    ),
    cache: clamp(100 - frame.cacheHitRate, 0, 100),
    database: clamp(frame.dbConnections / 20, 0, 100),
  }

  const service = (
    id: ServiceId,
    label: string,
    code: string,
    metricLabel: string,
    metricValue: string,
  ): ServiceNode => ({
    id,
    label,
    code,
    status: serviceStatus(loads[id], recovering),
    metricLabel,
    metricValue,
    load: Math.round(loads[id]),
  })

  return [
    service(
      'edge',
      'Global Edge',
      'EDGE',
      'EGRESS',
      `${Math.round(frame.throughput).toLocaleString('en-US')} rps`,
    ),
    service(
      'gateway',
      'API Gateway',
      'GTWY',
      'ADMITTED',
      `${Math.round(frame.throughput).toLocaleString('en-US')} rps`,
    ),
    service(
      'checkout',
      'Checkout',
      'CHKT',
      'P95 LATENCY',
      `${Math.round(frame.latency).toLocaleString('en-US')} ms`,
    ),
    service(
      'payments',
      'Payments',
      'PAY',
      'ERROR RATE',
      `${roundTo(frame.errorRate, 1).toFixed(1)}%`,
    ),
    service(
      'cache',
      'Catalog Cache',
      'CACH',
      'HIT RATE',
      `${roundTo(frame.cacheHitRate, 1).toFixed(1)}%`,
    ),
    service(
      'database',
      'Primary DB',
      'PG-01',
      'CONNECTIONS',
      `${Math.round(frame.dbConnections).toLocaleString('en-US')} / 1,800`,
    ),
  ]
}

function makeLinks(services: ServiceNode[], throughput: number): ServiceLink[] {
  const byId = new Map(services.map((service) => [service.id, service]))
  const recovering = services.some((service) => service.status === 'recovering')

  const link = (
    from: ServiceId,
    to: ServiceId,
    trafficFactor = 1,
  ): ServiceLink => {
    const load = Math.max(byId.get(from)?.load ?? 0, byId.get(to)?.load ?? 0)
    return {
      from,
      to,
      status: serviceStatus(load, recovering),
      traffic: Math.round(clamp((throughput / 92) * trafficFactor, 0, 100)),
    }
  }

  return [
    link('edge', 'gateway'),
    link('gateway', 'checkout', 0.92),
    link('checkout', 'payments', 0.67),
    link('checkout', 'cache', 0.88),
    link('payments', 'database', 0.56),
    link('cache', 'database', 0.76),
  ]
}

/**
 * Computes a complete simulation frame from only elapsed time and accumulated
 * modifiers. Calling it repeatedly with equal inputs is guaranteed to be stable.
 */
export function computeSnapshot(
  elapsed: number,
  inputModifiers: SimulationModifiers,
): SimulationSnapshot {
  const safeElapsed = clamp(elapsed, 0, TOTAL_SECONDS)
  const modifiers = sanitizeModifiers(inputModifiers)
  const frame = calculateFrame(safeElapsed, modifiers)
  const status = systemStatus(frame, modifiers)
  const services = makeServices(frame, modifiers, status)

  const metrics: TelemetryPoint = {
    tick: Math.floor(safeElapsed),
    timeLabel: formatElapsed(safeElapsed),
    latency: Math.round(frame.latency),
    errorRate: roundTo(frame.errorRate, 1),
    throughput: Math.round(frame.throughput),
    dbConnections: Math.round(frame.dbConnections),
    cacheHitRate: roundTo(frame.cacheHitRate, 1),
    revenueLoss: Math.round(frame.revenueLossRate),
  }

  return {
    elapsed: safeElapsed,
    remaining: Math.max(0, TOTAL_SECONDS - safeElapsed),
    health: Math.round(frame.health),
    affectedUsers: Math.round(frame.affectedUsers),
    revenueLossRate: Math.round(frame.revenueLossRate),
    totalRevenueLost: Math.round(
      integrateRevenueLoss(safeElapsed, modifiers),
    ),
    metrics,
    services,
    links: makeLinks(services, frame.throughput),
    status,
  }
}

/** Applies a decision without mutating either argument. */
export function applyChoice(
  inputModifiers: SimulationModifiers,
  choice: DecisionChoice,
): SimulationModifiers {
  const modifiers = sanitizeModifiers(inputModifiers)
  const effect = choice.effects

  return {
    stability: clamp(
      modifiers.stability + finite(effect.stability),
      MODIFIER_MIN,
      MODIFIER_MAX,
    ),
    load: clamp(
      modifiers.load + finite(effect.load),
      MODIFIER_MIN,
      MODIFIER_MAX,
    ),
    cache: clamp(
      modifiers.cache + finite(effect.cache),
      MODIFIER_MIN,
      MODIFIER_MAX,
    ),
    database: clamp(
      modifiers.database + finite(effect.database),
      MODIFIER_MIN,
      MODIFIER_MAX,
    ),
    observability: clamp(
      modifiers.observability + finite(effect.observability),
      MODIFIER_MIN,
      MODIFIER_MAX,
    ),
    revenue: clamp(
      modifiers.revenue + finite(effect.revenue),
      MODIFIER_MIN,
      MODIFIER_MAX,
    ),
  }
}

const POSSIBLE_SCORE_MIN = INCIDENT_DECISIONS.reduce(
  (total, decision) =>
    total + Math.min(...decision.choices.map((choice) => choice.scoreDelta)),
  0,
)

const POSSIBLE_SCORE_MAX = INCIDENT_DECISIONS.reduce(
  (total, decision) =>
    total + Math.max(...decision.choices.map((choice) => choice.scoreDelta)),
  0,
)

/** Builds the deterministic debrief for the final frame and canonical choices. */
export function buildResult(
  snapshot: SimulationSnapshot,
  records: DecisionRecord[],
): IncidentResult {
  // A decision counts once, and score/verdict come from the scenario rather than
  // trusting values supplied by UI state.
  const canonicalChoices = new Map<
    string,
    { scoreDelta: number; verdict: DecisionChoice['verdict'] }
  >()

  for (const record of records) {
    const decision = INCIDENT_DECISIONS.find(
      (candidate) => candidate.id === record.decisionId,
    )
    const choice = decision?.choices.find(
      (candidate) => candidate.id === record.choiceId,
    )
    if (decision && choice) {
      canonicalChoices.set(decision.id, {
        scoreDelta: choice.scoreDelta,
        verdict: choice.verdict,
      })
    }
  }

  const canonical = [...canonicalChoices.values()]
  const rawDecisionScore = canonical.reduce(
    (total, choice) => total + choice.scoreDelta,
    0,
  )
  const decisionQuality = clamp(
    ((rawDecisionScore - POSSIBLE_SCORE_MIN) /
      (POSSIBLE_SCORE_MAX - POSSIBLE_SCORE_MIN)) *
      100,
    0,
    100,
  )
  const accuracy = Math.round(
    (canonical.reduce((total, choice) => {
      if (choice.verdict === 'optimal') return total + 1
      if (choice.verdict === 'mixed') return total + 0.4
      return total
    }, 0) /
      INCIDENT_DECISIONS.length) *
      100,
  )

  const finalHealth = Math.round(clamp(snapshot.health, 0, 100))
  const score = Math.round(
    clamp(
      finalHealth * 0.5 + accuracy * 0.3 + decisionQuality * 0.2,
      0,
      100,
    ),
  )

  const ending: IncidentResult['ending'] =
    score >= 82 && finalHealth >= 75 && accuracy >= 67
      ? 'sovereign'
      : score >= 40 && finalHealth >= 35
        ? 'contained'
        : 'cascade'

  const grade: IncidentResult['grade'] =
    score >= 90
      ? 'S'
      : score >= 78
        ? 'A'
        : score >= 64
          ? 'B'
          : score >= 48
            ? 'C'
            : 'D'

  const noInterventionLoss = computeSnapshot(
    TOTAL_SECONDS,
    INITIAL_MODIFIERS,
  ).totalRevenueLost
  const revenueLost = Math.max(0, Math.round(snapshot.totalRevenueLost))
  const revenueProtected = Math.max(0, noInterventionLoss - revenueLost)

  return {
    ending,
    grade,
    score,
    mttrSeconds:
      ending === 'cascade'
        ? TOTAL_SECONDS
        : Math.round(
            clamp(
              TOTAL_SECONDS - Math.max(0, score - 25) * 3.4,
              180,
              TOTAL_SECONDS,
            ),
          ),
    peakAffectedUsers: Math.round(
      Math.max(
        Math.max(0, finite(snapshot.affectedUsers)),
        12_000 + (100 - finalHealth) * 1_700,
      ),
    ),
    revenueProtected,
    revenueLost,
    finalHealth,
    accuracy,
  }
}
