import { describe, expect, it } from "vitest";
import {
  applyLabChoice,
  buildLabResult,
  computeLabSnapshot,
  createLabReport,
  LAB_DECISIONS,
  LAB_INITIAL_MODIFIERS,
  LAB_TOTAL_SECONDS,
} from "@/lib/crisis-lab";
import type {
  LabDecisionChoice,
  LabDecisionRecord,
  LabIncidentDecision,
  LabSimulationModifiers,
} from "@/types/crisis-lab";

function choiceWithVerdict(decision: LabIncidentDecision, verdict: LabDecisionChoice["verdict"]): LabDecisionChoice {
  const choice = decision.choices.find((candidate) => candidate.verdict === verdict);
  if (!choice) throw new Error(`No ${verdict} choice for ${decision.id}`);
  return choice;
}

function play(verdict: LabDecisionChoice["verdict"]): { modifiers: LabSimulationModifiers; records: LabDecisionRecord[] } {
  let modifiers = { ...LAB_INITIAL_MODIFIERS };
  const records = LAB_DECISIONS.map((decision) => {
    const choice = choiceWithVerdict(decision, verdict);
    modifiers = applyLabChoice(modifiers, choice);
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
    };
  });
  return { modifiers, records };
}

describe("Threadline Crisis Lab", () => {
  it("preserves the complete FAULTLINE scenario", () => {
    expect(LAB_TOTAL_SECONDS).toBe(480);
    expect(LAB_DECISIONS).toHaveLength(6);
    expect(LAB_DECISIONS.flatMap((decision) => decision.choices)).toHaveLength(18);
    expect(LAB_DECISIONS.map((decision) => decision.triggerAt)).toEqual([45, 110, 175, 250, 330, 410]);
    for (const decision of LAB_DECISIONS) {
      expect(decision.choices.map((choice) => choice.verdict).sort()).toEqual(["dangerous", "mixed", "optimal"]);
    }
  });

  it("models cache collapse before database pool exhaustion", () => {
    const healthy = computeLabSnapshot(0, LAB_INITIAL_MODIFIERS);
    const stampede = computeLabSnapshot(125, LAB_INITIAL_MODIFIERS);
    const exhausted = computeLabSnapshot(260, LAB_INITIAL_MODIFIERS);
    expect(stampede.metrics.cacheHitRate).toBeLessThan(healthy.metrics.cacheHitRate - 45);
    expect(exhausted.metrics.dbConnections).toBeGreaterThan(stampede.metrics.dbConnections + 900);
    expect(exhausted.metrics.latency).toBeGreaterThan(stampede.metrics.latency);
  });

  it("is deterministic and clamps unsafe inputs", () => {
    const modifiers = { stability: 17, load: -9, cache: 23, database: 11, observability: 7, revenue: 4 };
    expect(computeLabSnapshot(243.75, modifiers)).toEqual(computeLabSnapshot(243.75, modifiers));
    expect(computeLabSnapshot(-10, modifiers).elapsed).toBe(0);
    expect(computeLabSnapshot(900, modifiers).elapsed).toBe(LAB_TOTAL_SECONDS);
    const extreme = applyLabChoice(
      { stability: 100, load: 100, cache: 100, database: 100, observability: 100, revenue: 100 },
      choiceWithVerdict(LAB_DECISIONS[1], "optimal"),
    );
    expect(Object.values(extreme).every((value) => value <= 100 && value >= -100)).toBe(true);
  });

  it("reaches a sovereign S-grade recovery through optimal commands", () => {
    const run = play("optimal");
    const result = buildLabResult(computeLabSnapshot(LAB_TOTAL_SECONDS, run.modifiers), run.records);
    expect(result.ending).toBe("sovereign");
    expect(result.grade).toBe("S");
    expect(result.accuracy).toBe(100);
    expect(result.revenueProtected).toBeGreaterThan(0);
  });

  it("reaches a cascade through dangerous commands", () => {
    const run = play("dangerous");
    const result = buildLabResult(computeLabSnapshot(LAB_TOTAL_SECONDS, run.modifiers), run.records);
    expect(result.ending).toBe("cascade");
    expect(result.mttrSeconds).toBe(LAB_TOTAL_SECONDS);
    expect(result.score).toBeLessThan(40);
  });

  it("exports a portable after-action report with the command trail", () => {
    const run = play("optimal");
    const result = buildLabResult(computeLabSnapshot(LAB_TOTAL_SECONDS, run.modifiers), run.records);
    const report = createLabReport(result, run.records);
    expect(report).toContain("THREADLINE CRISIS LAB");
    expect(report).toContain("FAULTLINE 047");
    expect(report).toContain("cache singleflight enable");
    expect(report).toContain("ROOT CAUSE");
  });
});
