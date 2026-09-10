import { describe, expect, it } from "vitest";
import {
  applyLabChoice,
  assessLabDecisions,
  buildLabResult,
  canonicalizeLabRecords,
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
    expect(report).toContain("COMPETENCY REVIEW");
    expect(report).toContain("SAME-SCENARIO COMPARISON");
    expect(report).toContain("not a professional certification");
  });

  it("scores named competency gates independently of record order", () => {
    const run = play("mixed");
    const assessment = assessLabDecisions([...run.records].reverse());
    expect(assessment).toEqual(assessLabDecisions(run.records));
    expect(assessment.competencies.map((competency) => competency.id)).toEqual(["diagnosis", "containment", "recovery"]);
    expect(assessment.competencies[0].score).toBe(50);
    expect(assessment.competencies[1].decisions.map((decision) => decision.decisionId)).toEqual(["cache-stampede", "pool-exhaustion", "blast-radius"]);
    expect(assessment.competencies[1].decisions[0].score).toBe(45.5);
    expect(assessment.practice).toHaveLength(6);
    expect(assessment.practice[0].recommendedCommand).toContain("singleflight");
  });

  it("rejects unknown IDs and gives no assessment credit for unattempted gates", () => {
    const unknown = { ...play("optimal").records[0], decisionId: "unknown", choiceId: "unknown" };
    const mismatched = { ...play("optimal").records[0], choiceId: "single-flight" };
    const assessment = assessLabDecisions([unknown, mismatched]);
    expect(assessment.completed).toBe(0);
    expect(assessment.decisionQuality).toBe(0);
    expect(assessment.referenceMatches).toBe(0);
    expect(assessment.competencies.every((competency) => competency.score === 0 && competency.completed === 0)).toBe(true);
    expect(assessment.practice.every((practice) => practice.score === null && practice.selectedLabel === null)).toBe(true);
    const partial = assessLabDecisions(play("optimal").records.slice(0, 1));
    expect(partial.decisionQuality).toBe(16.7);
    expect(partial.competencies[2].completed).toBe(0);
    expect(partial.practice).toHaveLength(5);
  });

  it("uses the first valid choice once when duplicate or conflicting gate records arrive", () => {
    const dangerous = play("dangerous").records;
    const optimal = play("optimal").records;
    const duplicates = [...dangerous, ...optimal, ...optimal];
    expect(canonicalizeLabRecords(duplicates)).toEqual(dangerous);
    expect(assessLabDecisions(duplicates)).toEqual(assessLabDecisions(dangerous));
    const snapshot = computeLabSnapshot(LAB_TOTAL_SECONDS, LAB_INITIAL_MODIFIERS);
    expect(buildLabResult(snapshot, duplicates)).toEqual(buildLabResult(snapshot, dangerous));
  });

  it("rebuilds scores, consequences, and report display from canonical choices", () => {
    const run = play("dangerous");
    const forged = run.records.map((record) => ({ ...record, verdict: "optimal" as const, scoreDelta: 1_000_000, command: "forged command", choiceLabel: "forged label", rationale: "forged rationale", title: "forged title" }));
    const snapshot = computeLabSnapshot(LAB_TOTAL_SECONDS, run.modifiers);
    const result = buildLabResult({ ...snapshot, health: 100, affectedUsers: 0, totalRevenueLost: 0 }, forged);
    expect(result).toEqual(buildLabResult(snapshot, run.records));
    expect(result.assessment.referenceMatches).toBe(0);
    expect(result.assessment.competencies.every((competency) => competency.score === 0)).toBe(true);
    expect(createLabReport(result, forged)).not.toContain("forged");
    expect(createLabReport(result, forged)).toContain("deploy rollback release-24.7.13");
  });

  it("replays intervention timing and compares the same synthetic incident", () => {
    const run = play("optimal");
    const snapshot = computeLabSnapshot(LAB_TOTAL_SECONDS, run.modifiers);
    const early = buildLabResult(snapshot, run.records);
    const delayed = buildLabResult(snapshot, run.records.map((record) => ({ ...record, chosenAt: LAB_TOTAL_SECONDS })));
    const baseline = buildLabResult(snapshot, []);
    expect(early.revenueLost).toBeLessThan(delayed.revenueLost);
    expect(delayed.revenueLost).toBe(baseline.revenueLost);
    expect(delayed.recovered).toBe(false);
    expect(delayed.ending).toBe("contained");
    expect(early.trafficGuardMet).toBe(true);
    expect(early.trafficGuardSeconds).toBe(395);
    expect(early.errorObjectiveMet).toBe(false);
    expect(early.recovered).toBe(false);
    expect(early.comparison.run.errorRate).toBeGreaterThan(1);
    expect(early.peakAffectedUsers).toBeLessThan(early.comparison.baseline.peakAffectedUsers);
    expect(early.revenueProtected).toBe(early.comparison.baseline.revenueLost - early.comparison.run.revenueLost);
    expect(early.comparison.timeline).toHaveLength(49);
    expect(early.comparison.timeline[0]).toEqual({ elapsed: 0, baselineHealth: 100, runHealth: 100 });
  });

  it("clamps invalid and non-causal times without applying future choices to partial runs", () => {
    const records = play("optimal").records.map((record, index) => ({ ...record, chosenAt: index === 0 ? Number.NaN : -100 }));
    expect(canonicalizeLabRecords(records).map((record) => record.chosenAt)).toEqual(LAB_DECISIONS.map((decision) => decision.triggerAt));
    const result = buildLabResult(computeLabSnapshot(100, LAB_INITIAL_MODIFIERS), records);
    expect(result.assessment.completed).toBe(1);
    expect(result.recovered).toBe(false);
    expect(result.ending).not.toBe("sovereign");
    const fractional = buildLabResult(computeLabSnapshot(LAB_TOTAL_SECONDS, LAB_INITIAL_MODIFIERS), play("optimal").records.map((record) => ({ ...record, chosenAt: record.chosenAt + 0.5 })));
    expect(fractional.comparison.timeline).toHaveLength(49);
    expect(Number.isFinite(fractional.revenueLost)).toBe(true);
  });
});
