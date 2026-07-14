export type LabServiceId =
  | "edge"
  | "gateway"
  | "checkout"
  | "payments"
  | "cache"
  | "database";

export type LabSystemStatus = "nominal" | "degraded" | "critical" | "recovering";

export type LabMetricKey =
  | "latency"
  | "errorRate"
  | "throughput"
  | "dbConnections"
  | "cacheHitRate";

export interface LabServiceNode {
  id: LabServiceId;
  label: string;
  code: string;
  status: LabSystemStatus;
  metricLabel: string;
  metricValue: string;
  load: number;
}

export interface LabServiceLink {
  from: LabServiceId;
  to: LabServiceId;
  status: LabSystemStatus;
  traffic: number;
}

export interface LabTelemetryPoint {
  tick: number;
  timeLabel: string;
  latency: number;
  errorRate: number;
  throughput: number;
  dbConnections: number;
  cacheHitRate: number;
  revenueLoss: number;
}

export interface LabDecisionEffects {
  stability: number;
  load: number;
  cache: number;
  database: number;
  observability: number;
  revenue: number;
}

export interface LabDecisionChoice {
  id: string;
  label: string;
  command: string;
  description: string;
  rationale: string;
  verdict: "optimal" | "mixed" | "dangerous";
  scoreDelta: number;
  effects: LabDecisionEffects;
}

export interface LabIncidentDecision {
  id: string;
  triggerAt: number;
  index: string;
  title: string;
  situation: string;
  signal: string;
  choices: LabDecisionChoice[];
}

export interface LabDecisionRecord {
  decisionId: string;
  choiceId: string;
  title: string;
  choiceLabel: string;
  command: string;
  verdict: LabDecisionChoice["verdict"];
  scoreDelta: number;
  rationale: string;
  chosenAt: number;
}

export interface LabSimulationModifiers {
  stability: number;
  load: number;
  cache: number;
  database: number;
  observability: number;
  revenue: number;
}

export interface LabSimulationSnapshot {
  elapsed: number;
  remaining: number;
  health: number;
  affectedUsers: number;
  revenueLossRate: number;
  totalRevenueLost: number;
  metrics: LabTelemetryPoint;
  services: LabServiceNode[];
  links: LabServiceLink[];
  status: LabSystemStatus;
}

export type LabEndingId = "sovereign" | "contained" | "cascade";

export interface LabIncidentResult {
  ending: LabEndingId;
  grade: "S" | "A" | "B" | "C" | "D";
  score: number;
  mttrSeconds: number;
  peakAffectedUsers: number;
  revenueProtected: number;
  revenueLost: number;
  finalHealth: number;
  accuracy: number;
}
