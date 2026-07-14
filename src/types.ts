export type ServiceId =
  | 'edge'
  | 'gateway'
  | 'checkout'
  | 'payments'
  | 'cache'
  | 'database'

export type SystemStatus = 'nominal' | 'degraded' | 'critical' | 'recovering'

export type MetricKey =
  | 'latency'
  | 'errorRate'
  | 'throughput'
  | 'dbConnections'
  | 'cacheHitRate'

export interface ServiceNode {
  id: ServiceId
  label: string
  code: string
  status: SystemStatus
  metricLabel: string
  metricValue: string
  load: number
}

export interface ServiceLink {
  from: ServiceId
  to: ServiceId
  status: SystemStatus
  traffic: number
}

export interface TelemetryPoint {
  tick: number
  timeLabel: string
  latency: number
  errorRate: number
  throughput: number
  dbConnections: number
  cacheHitRate: number
  revenueLoss: number
}

export interface DecisionEffects {
  stability: number
  load: number
  cache: number
  database: number
  observability: number
  revenue: number
}

export interface DecisionChoice {
  id: string
  label: string
  command: string
  description: string
  rationale: string
  verdict: 'optimal' | 'mixed' | 'dangerous'
  scoreDelta: number
  effects: DecisionEffects
}

export interface IncidentDecision {
  id: string
  triggerAt: number
  index: string
  title: string
  situation: string
  signal: string
  choices: DecisionChoice[]
}

export interface DecisionRecord {
  decisionId: string
  choiceId: string
  title: string
  choiceLabel: string
  command: string
  verdict: DecisionChoice['verdict']
  scoreDelta: number
  rationale: string
  chosenAt: number
}

export interface SimulationModifiers {
  stability: number
  load: number
  cache: number
  database: number
  observability: number
  revenue: number
}

export interface SimulationSnapshot {
  elapsed: number
  remaining: number
  health: number
  affectedUsers: number
  revenueLossRate: number
  totalRevenueLost: number
  metrics: TelemetryPoint
  services: ServiceNode[]
  links: ServiceLink[]
  status: SystemStatus
}

export type EndingId = 'sovereign' | 'contained' | 'cascade'

export interface IncidentResult {
  ending: EndingId
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  score: number
  mttrSeconds: number
  peakAffectedUsers: number
  revenueProtected: number
  revenueLost: number
  finalHealth: number
  accuracy: number
}
