export const INCIDENT_BASELINE = { latency: 0.68, errors: 0.7, conversion: 68.4 } as const;

export const INCIDENT_RECOVERY_WINDOW = [
  { time: "09:35", latency: 0.76, errors: 0.9 },
  { time: "09:36", latency: 0.73, errors: 0.9 },
  { time: "09:37", latency: 0.72, errors: 0.8 },
  { time: "09:38", latency: 0.71, errors: 0.9 },
  { time: "09:39", latency: 0.69, errors: 0.8 },
  { time: "09:40", latency: 0.7, errors: 0.8 },
] as const;

export const INCIDENT_REPLAY_FRAMES = [
  { time: "09:08", minute: 8, title: "PR #1842 merged", detail: "Retry policy for asynchronous tax quote lookup", kind: "change", latency: 0.66, errors: 0.6, conversion: 68.4, revenue: 0 },
  { time: "09:12", minute: 12, title: "checkout-api@2.18.0 deployed", detail: "Production rollout completed across 6 instances", kind: "deploy", latency: 0.69, errors: 0.7, conversion: 68.7, revenue: 0 },
  { time: "09:18", minute: 18, title: "instant-tax-v2 set to 100%", detail: "Feature flag exposure increased from 50%", kind: "flag", latency: 0.68, errors: 0.7, conversion: 68.2, revenue: 0 },
  { time: "09:21", minute: 21, title: "Latency regression detected", detail: "p95 exceeded 1 second while traffic stayed near baseline", kind: "alert", latency: 1.1, errors: 2.2, conversion: 67.2, revenue: 0 },
  { time: "09:22", minute: 22, title: "Pool saturation and SLO burn correlated", detail: "Tax-adapter waits found in 92% of slow trace samples; budget burn 8.4×", kind: "alert", latency: 1.84, errors: 4.9, conversion: 63.5, revenue: 0 },
  { time: "09:23", minute: 23, title: "Customer impact estimate available", detail: "Commerce analytics reports conversion loss with a 2-minute ingest delay", kind: "impact", latency: 1.76, errors: 4.5, conversion: 63.8, revenue: 12.4 },
  { time: "09:24", minute: 24, title: "Incident INC-2471 declared", detail: "SEV-2 · Commerce Core paged; Maya Chen assumes command", kind: "incident", latency: 1.62, errors: 3.8, conversion: 64.2, revenue: 11.8 },
  { time: "09:25", minute: 25, title: "Mitigation proposed for review", detail: "Corroborating changes and traces support disabling instant-tax-v2", kind: "agent", latency: 1.48, errors: 3.1, conversion: 65.1, revenue: 8.2 },
  { time: "09:31", minute: 31, title: "Flag rollback approved", detail: "J. Lee · Production Operator; exposure reduced to 0%; verification begins", kind: "action", latency: 0.9, errors: 1.2, conversion: 67.4, revenue: 2.4 },
  { time: "09:40", minute: 40, title: "Recovery verified", detail: "09:35–09:40: p95 below 800 ms and errors below 1% for five continuous minutes", kind: "success", latency: 0.7, errors: 0.8, conversion: 68.1, revenue: 0 },
] as const;

export type IncidentActionState = "idle" | "executing" | "verifying" | "completed";
export type IncidentReplayState = { step: number; action: IncidentActionState; runId: number };
export type IncidentReplayAction =
  | { type: "seek"; step: number }
  | { type: "approve" }
  | { type: "advance-action"; runId: number; expected: "executing" | "verifying" };

export function clampIncidentStep(step: number): number {
  return Number.isFinite(step) ? Math.max(0, Math.min(INCIDENT_REPLAY_FRAMES.length - 1, Math.floor(step))) : 7;
}

export function parseIncidentStep(value: string | null): number {
  return value !== null && /^\d+$/.test(value) ? clampIncidentStep(Number(value)) : 7;
}

export function createIncidentReplayState(step = 7): IncidentReplayState {
  return { step: clampIncidentStep(step), action: "idle", runId: 0 };
}

export function incidentReplayReducer(state: IncidentReplayState, action: IncidentReplayAction): IncidentReplayState {
  if (action.type === "seek") return { step: clampIncidentStep(action.step), action: "idle", runId: state.runId + 1 };
  if (action.type === "approve") {
    if (state.step !== 7 || state.action !== "idle") return state;
    return { ...state, action: "executing", runId: state.runId + 1 };
  }
  if (action.runId !== state.runId || state.action !== action.expected) return state;
  if (state.action === "executing") return { ...state, step: 8, action: "verifying" };
  if (state.action === "verifying") return { ...state, step: 9, action: "completed" };
  return state;
}

export function getIncidentSnapshot(inputStep: number) {
  const step = clampIncidentStep(inputStep);
  const frame = INCIDENT_REPLAY_FRAMES[step];
  const resolved = step === INCIDENT_REPLAY_FRAMES.length - 1;
  const declared = step >= 6;
  const status = resolved ? "Resolved" : step >= 8 ? "Monitoring" : declared ? "Investigating" : step >= 3 ? "Signal detected" : "Before incident";
  return {
    step, frame, resolved, declared, status,
    elapsedMinutes: declared ? frame.minute - 24 : 0,
    actionReady: step === 7,
    latencyDelta: ((frame.latency - INCIDENT_BASELINE.latency) / INCIDENT_BASELINE.latency) * 100,
    conversionDelta: ((frame.conversion - INCIDENT_BASELINE.conversion) / INCIDENT_BASELINE.conversion) * 100,
    revenueAvailable: step >= 5,
    flagExposure: step >= 8 ? 0 : step >= 2 ? 100 : 50,
    recoveryWindow: resolved ? INCIDENT_RECOVERY_WINDOW : [],
    history: INCIDENT_REPLAY_FRAMES.slice(0, step + 1),
  };
}

export type IncidentSnapshot = ReturnType<typeof getIncidentSnapshot>;

export function createIncidentCommsDraft(inputStep: number): string {
  const snapshot = getIncidentSnapshot(inputStep);
  const { frame } = snapshot;
  const introduction = snapshot.resolved
    ? "Checkout service has recovered. From 09:35 to 09:40 UTC, latency stayed below 800 ms and errors below 1%. We continue to monitor."
    : snapshot.step >= 8
      ? "We have disabled the affected tax-quote feature and are monitoring recovery. The five-minute verification window is not yet complete."
      : snapshot.declared
        ? "We are investigating elevated checkout latency and errors. Some customers may experience delayed or unsuccessful checkouts."
        : snapshot.step >= 3
          ? "Checkout latency is elevated. The team is validating the scope; an incident has not yet been declared."
          : "No checkout incident has been declared at this point in the replay. Baseline monitoring continues.";
  return [
    `[DRAFT · DEMO DATA] INC-2471 · ${snapshot.status} · ${frame.time} UTC`,
    introduction,
    `Current observation: p95 ${frame.latency.toFixed(2)} s; error rate ${frame.errors.toFixed(1)}%.`,
    snapshot.declared ? "Incident commander: Maya Chen · Commerce Core." : "Owner: Commerce Core.",
    snapshot.resolved ? "Follow-up: publish the incident review after evidence reconciliation." : snapshot.declared ? `Next update: ${snapshot.step >= 8 ? "09:41" : "09:34"} UTC, or sooner if conditions change.` : "Next update: after scope and impact are confirmed.",
    "Prepared locally for review. Nothing has been published.",
  ].join("\n\n");
}
