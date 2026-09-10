import { describe, expect, it } from "vitest";
import { createIncidentCommsDraft, createIncidentReplayState, getIncidentSnapshot, INCIDENT_REPLAY_FRAMES, incidentReplayReducer, parseIncidentStep } from "@/lib/incident-replay";

describe("Incident replay temporal contracts", () => {
  it("never exposes future metrics or resolution before the verification event", () => {
    for (let step = 0; step < INCIDENT_REPLAY_FRAMES.length; step += 1) {
      const snapshot = getIncidentSnapshot(step);
      expect(snapshot.history).toHaveLength(step + 1);
      expect(snapshot.history.at(-1)).toBe(snapshot.frame);
      expect(snapshot.resolved).toBe(step === 9);
      expect(snapshot.actionReady).toBe(step === 7);
    }
    expect(getIncidentSnapshot(8).frame.latency).toBeGreaterThan(0.8);
    expect(getIncidentSnapshot(8).frame.errors).toBeGreaterThan(1);
    expect(getIncidentSnapshot(8).recoveryWindow).toHaveLength(0);
    const recovery = getIncidentSnapshot(9).recoveryWindow;
    expect(recovery).toHaveLength(6);
    expect(recovery.every((sample) => sample.latency < 0.8 && sample.errors < 1)).toBe(true);
    expect(recovery.at(-1)?.latency).toBe(getIncidentSnapshot(9).frame.latency);
    expect(recovery.at(-1)?.errors).toBe(getIncidentSnapshot(9).frame.errors);
  });

  it("calculates deltas from the selected snapshot instead of retaining the peak", () => {
    const investigation = getIncidentSnapshot(7);
    expect(investigation.frame.latency).toBe(1.48);
    expect(investigation.latencyDelta).toBeCloseTo(117.647);
    expect(investigation.conversionDelta).toBeCloseTo(-4.824);
    expect(investigation.elapsedMinutes).toBe(1);
    const recovered = getIncidentSnapshot(9);
    expect(recovered.latencyDelta).toBeCloseTo(2.941);
    expect(recovered.conversionDelta).toBeCloseTo(-0.439);
    expect(recovered.frame.revenue).toBe(0);
  });

  it("permits approval only when a reviewable proposal exists", () => {
    for (const step of [0, 3, 6, 8, 9]) {
      const state = createIncidentReplayState(step);
      expect(incidentReplayReducer(state, { type: "approve" })).toBe(state);
    }
    const executing = incidentReplayReducer(createIncidentReplayState(7), { type: "approve" });
    expect(executing.action).toBe("executing");
    expect(incidentReplayReducer(executing, { type: "approve" })).toBe(executing);
    const completion = { type: "advance-action", runId: executing.runId, expected: "executing" } as const;
    const verifying = incidentReplayReducer(executing, completion);
    expect(verifying).toMatchObject({ step: 8, action: "verifying" });
    expect(incidentReplayReducer(verifying, completion)).toBe(verifying);
    expect(incidentReplayReducer(verifying, { type: "advance-action", runId: verifying.runId, expected: "verifying" })).toMatchObject({ step: 9, action: "completed" });
  });

  it("invalidates pending action callbacks when resetting or seeking", () => {
    const executing = incidentReplayReducer(createIncidentReplayState(), { type: "approve" });
    const reset = incidentReplayReducer(executing, { type: "seek", step: 0 });
    expect(incidentReplayReducer(reset, { type: "advance-action", runId: executing.runId, expected: "executing" })).toBe(reset);
    const nextRun = incidentReplayReducer(incidentReplayReducer(reset, { type: "seek", step: 7 }), { type: "approve" });
    expect(incidentReplayReducer(nextRun, { type: "advance-action", runId: executing.runId, expected: "executing" })).toBe(nextRun);
  });

  it("validates deep-link input and clamps unsafe cursor values", () => {
    expect(parseIncidentStep(null)).toBe(7);
    expect(parseIncidentStep("NaN")).toBe(7);
    expect(parseIncidentStep("4.5")).toBe(7);
    expect(parseIncidentStep("9")).toBe(9);
    expect(parseIncidentStep("999")).toBe(9);
    expect(getIncidentSnapshot(-3).step).toBe(0);
    expect(getIncidentSnapshot(Number.NaN).step).toBe(7);
  });

  it("produces a local communications draft without claiming publication or early recovery", () => {
    const investigation = createIncidentCommsDraft(7);
    expect(investigation).toContain("09:25 UTC");
    expect(investigation).toContain("Maya Chen");
    expect(investigation).not.toContain("has recovered");
    expect(createIncidentCommsDraft(8)).toContain("not yet complete");
    expect(createIncidentCommsDraft(9)).toContain("has recovered");
    expect(createIncidentCommsDraft(9)).toContain("Nothing has been published");
  });
});
