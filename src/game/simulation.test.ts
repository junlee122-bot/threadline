import { describe, expect, it } from 'vitest'
import type {
  DecisionChoice,
  DecisionRecord,
  IncidentDecision,
  SimulationModifiers,
} from '../types'
import {
  INCIDENT_DECISIONS,
  INITIAL_MODIFIERS,
  TOTAL_SECONDS,
} from './scenario'
import { applyChoice, buildResult, computeSnapshot } from './simulation'

function choiceWithVerdict(
  decision: IncidentDecision,
  verdict: DecisionChoice['verdict'],
): DecisionChoice {
  const choice = decision.choices.find((candidate) => candidate.verdict === verdict)
  if (!choice) throw new Error(`No ${verdict} choice for ${decision.id}`)
  return choice
}

function recordChoice(
  decision: IncidentDecision,
  choice: DecisionChoice,
): DecisionRecord {
  return {
    decisionId: decision.id,
    choiceId: choice.id,
    title: decision.title,
    choiceLabel: choice.label,
    command: choice.command,
    verdict: choice.verdict,
    scoreDelta: choice.scoreDelta,
    rationale: choice.rationale,
    chosenAt: decision.triggerAt,
  }
}

function playChoices(
  verdictFor: (
    decision: IncidentDecision,
    index: number,
  ) => DecisionChoice['verdict'],
): { modifiers: SimulationModifiers; records: DecisionRecord[] } {
  let modifiers = { ...INITIAL_MODIFIERS }
  const records = INCIDENT_DECISIONS.map((decision, index) => {
    const choice = choiceWithVerdict(decision, verdictFor(decision, index))
    modifiers = applyChoice(modifiers, choice)
    return recordChoice(decision, choice)
  })
  return { modifiers, records }
}

describe('FAULTLINE scenario', () => {
  it('contains six ordered decision points inside the eight-minute incident', () => {
    expect(TOTAL_SECONDS).toBe(480)
    expect(INCIDENT_DECISIONS).toHaveLength(6)
    expect(INCIDENT_DECISIONS.map((decision) => decision.triggerAt)).toEqual([
      45, 110, 175, 250, 330, 410,
    ])

    const decisionIds = new Set(INCIDENT_DECISIONS.map((decision) => decision.id))
    const choiceIds = new Set(
      INCIDENT_DECISIONS.flatMap((decision) =>
        decision.choices.map((choice) => choice.id),
      ),
    )

    expect(decisionIds.size).toBe(6)
    expect(choiceIds.size).toBe(18)
    for (const decision of INCIDENT_DECISIONS) {
      expect(decision.triggerAt).toBeGreaterThan(0)
      expect(decision.triggerAt).toBeLessThan(TOTAL_SECONDS)
      expect(decision.choices).toHaveLength(3)
      expect(decision.choices.map((choice) => choice.verdict).sort()).toEqual([
        'dangerous',
        'mixed',
        'optimal',
      ])
    }
  })

  it('marks the tempting release rollback as dangerous red-herring behavior', () => {
    const opening = INCIDENT_DECISIONS[0]
    const rollback = opening.choices.find(
      (choice) => choice.id === 'rollback-release',
    )

    expect(rollback?.verdict).toBe('dangerous')
    expect(rollback?.rationale.toLowerCase()).toContain('red herring')
  })
})

describe('computeSnapshot', () => {
  it('is deterministic and clamps time and every bounded metric', () => {
    const modifiers: SimulationModifiers = {
      stability: 17,
      load: -9,
      cache: 23,
      database: 11,
      observability: 7,
      revenue: 4,
    }
    const first = computeSnapshot(243.75, modifiers)
    const replay = computeSnapshot(243.75, modifiers)

    expect(replay).toEqual(first)
    expect(computeSnapshot(-20, modifiers).elapsed).toBe(0)
    expect(computeSnapshot(900, modifiers).elapsed).toBe(TOTAL_SECONDS)
    expect(first.health).toBeGreaterThanOrEqual(0)
    expect(first.health).toBeLessThanOrEqual(100)
    expect(first.metrics.errorRate).toBeGreaterThanOrEqual(0)
    expect(first.metrics.errorRate).toBeLessThanOrEqual(100)
    expect(first.metrics.cacheHitRate).toBeGreaterThanOrEqual(0)
    expect(first.metrics.cacheHitRate).toBeLessThanOrEqual(100)
    expect(first.affectedUsers).toBeGreaterThanOrEqual(0)
    expect(first.revenueLossRate).toBeGreaterThanOrEqual(0)
    expect(first.totalRevenueLost).toBeGreaterThanOrEqual(0)
    expect(first.services).toHaveLength(6)
    expect(first.links).toHaveLength(6)
    for (const service of first.services) {
      expect(service.load).toBeGreaterThanOrEqual(0)
      expect(service.load).toBeLessThanOrEqual(100)
    }
    for (const link of first.links) {
      expect(link.traffic).toBeGreaterThanOrEqual(0)
      expect(link.traffic).toBeLessThanOrEqual(100)
    }
  })

  it('models cache collapse before database connection exhaustion', () => {
    const healthy = computeSnapshot(0, INITIAL_MODIFIERS)
    const stampede = computeSnapshot(125, INITIAL_MODIFIERS)
    const exhausted = computeSnapshot(260, INITIAL_MODIFIERS)

    expect(stampede.metrics.cacheHitRate).toBeLessThan(
      healthy.metrics.cacheHitRate - 45,
    )
    expect(exhausted.metrics.dbConnections).toBeGreaterThan(
      stampede.metrics.dbConnections + 900,
    )
    expect(exhausted.metrics.latency).toBeGreaterThan(stampede.metrics.latency)
  })

  it('keeps accumulated loss monotonic for a fixed intervention state', () => {
    const fixed: SimulationModifiers = {
      stability: 24,
      load: 18,
      cache: 30,
      database: 22,
      observability: 10,
      revenue: 8,
    }
    const losses = [0, 90, 180, 300, 480].map(
      (time) => computeSnapshot(time, fixed).totalRevenueLost,
    )

    expect(losses[0]).toBe(0)
    for (let index = 1; index < losses.length; index += 1) {
      expect(losses[index]).toBeGreaterThanOrEqual(losses[index - 1])
    }
  })

  it('rewards fixing the stampede instead of rolling back the decoy release', () => {
    const firstDecision = INCIDENT_DECISIONS[0]
    const cacheDecision = INCIDENT_DECISIONS[1]
    const rollback = firstDecision.choices.find(
      (choice) => choice.id === 'rollback-release',
    )!
    const singleFlight = cacheDecision.choices.find(
      (choice) => choice.id === 'single-flight',
    )!

    const rollbackSnapshot = computeSnapshot(
      240,
      applyChoice(INITIAL_MODIFIERS, rollback),
    )
    const repairedSnapshot = computeSnapshot(
      240,
      applyChoice(INITIAL_MODIFIERS, singleFlight),
    )

    expect(repairedSnapshot.metrics.cacheHitRate).toBeGreaterThan(
      rollbackSnapshot.metrics.cacheHitRate,
    )
    expect(repairedSnapshot.metrics.dbConnections).toBeLessThan(
      rollbackSnapshot.metrics.dbConnections,
    )
    expect(repairedSnapshot.health).toBeGreaterThan(rollbackSnapshot.health)
  })
})

describe('applyChoice', () => {
  it('is immutable and clamps accumulated effects to a safe domain', () => {
    const original = { ...INITIAL_MODIFIERS }
    const optimal = choiceWithVerdict(INCIDENT_DECISIONS[1], 'optimal')
    const once = applyChoice(original, optimal)

    expect(original).toEqual(INITIAL_MODIFIERS)
    expect(once).not.toBe(original)
    expect(once.cache).toBeGreaterThan(original.cache)

    let saturated = once
    for (let index = 0; index < 20; index += 1) {
      saturated = applyChoice(saturated, optimal)
    }
    for (const value of Object.values(saturated)) {
      expect(value).toBeGreaterThanOrEqual(-100)
      expect(value).toBeLessThanOrEqual(100)
    }
    expect(saturated.cache).toBe(100)
  })
})

describe('buildResult', () => {
  it('reaches all three endings through meaningfully different response paths', () => {
    const sovereignRun = playChoices(() => 'optimal')
    const containedRun = playChoices((_decision, index) =>
      index === INCIDENT_DECISIONS.length - 1 ? 'dangerous' : 'optimal',
    )
    const cascadeRun = playChoices(() => 'dangerous')

    const sovereign = buildResult(
      computeSnapshot(TOTAL_SECONDS, sovereignRun.modifiers),
      sovereignRun.records,
    )
    const contained = buildResult(
      computeSnapshot(TOTAL_SECONDS, containedRun.modifiers),
      containedRun.records,
    )
    const cascade = buildResult(
      computeSnapshot(TOTAL_SECONDS, cascadeRun.modifiers),
      cascadeRun.records,
    )

    expect(sovereign.ending).toBe('sovereign')
    expect(sovereign.grade).toBe('S')
    expect(sovereign.accuracy).toBe(100)
    expect(contained.ending).toBe('contained')
    expect(cascade.ending).toBe('cascade')
    expect(cascade.mttrSeconds).toBe(TOTAL_SECONDS)
    expect(sovereign.score).toBeGreaterThan(contained.score)
    expect(contained.score).toBeGreaterThan(cascade.score)
    expect(sovereign.revenueLost).toBeLessThan(cascade.revenueLost)
    expect(sovereign.revenueProtected).toBeGreaterThan(0)
  })

  it('uses canonical scenario values instead of trusting a tampered UI record', () => {
    const decision = INCIDENT_DECISIONS[0]
    const dangerous = choiceWithVerdict(decision, 'dangerous')
    const record = {
      ...recordChoice(decision, dangerous),
      verdict: 'optimal' as const,
      scoreDelta: 10_000,
    }
    const snapshot = computeSnapshot(TOTAL_SECONDS, INITIAL_MODIFIERS)

    const result = buildResult(snapshot, [record])

    expect(result.accuracy).toBe(0)
    expect(result.score).toBeLessThan(50)
  })
})
