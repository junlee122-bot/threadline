/**
 * Shared domain model for the deterministic Meridian Market demo.
 *
 * Timestamps are ISO-8601 UTC strings and durations are milliseconds unless a
 * field explicitly declares a different unit. IDs are stable fixture keys,
 * suitable for URLs and React keys.
 */

export type Timestamp = string;
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type HealthStatus = "healthy" | "degraded" | "critical" | "unknown";
export type TrendDirection = "up" | "down" | "flat";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ServiceKind =
  | "frontend"
  | "gateway"
  | "service"
  | "worker"
  | "datastore";

export interface ServicePosition {
  readonly x: number;
  readonly y: number;
}

export interface SloTarget {
  readonly availability: number;
  readonly latencyP95Ms: number;
  readonly windowDays: number;
}

export interface Service {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly kind: ServiceKind;
  readonly owner: string;
  readonly description: string;
  readonly runtime: string;
  readonly repository: string;
  readonly health: HealthStatus;
  readonly version: string;
  readonly slo: SloTarget;
  readonly tags: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly position: ServicePosition;
}

export interface IncidentSummary {
  readonly id: string;
  readonly title: string;
  readonly severity: "SEV-1" | "SEV-2" | "SEV-3";
  readonly status: "investigating" | "identified" | "monitoring" | "resolved";
  readonly startedAt: Timestamp;
  readonly resolvedAt: Timestamp | null;
  readonly commander: string;
  readonly serviceIds: readonly string[];
  readonly customerImpact: string;
  readonly rootCause: string;
}

export type CausalNodeKind =
  | "incident"
  | "change"
  | "deployment"
  | "service"
  | "metric"
  | "trace"
  | "alert"
  | "customer-impact"
  | "remediation";

export interface CausalNode {
  readonly id: string;
  readonly kind: CausalNodeKind;
  readonly title: string;
  readonly subtitle: string;
  readonly timestamp: Timestamp;
  readonly severity: Severity;
  readonly serviceId?: string;
  readonly evidenceIds: readonly string[];
  readonly position: ServicePosition;
  readonly metadata: Readonly<Record<string, string | number | boolean>>;
}

export type CausalRelation =
  | "introduced"
  | "deployed-as"
  | "affected"
  | "triggered"
  | "correlated-with"
  | "propagated-to"
  | "confirmed-by"
  | "mitigated-by"
  | "resolved";

export interface CausalEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly relation: CausalRelation;
  readonly label: string;
  /** Confidence is normalized to the inclusive 0..1 range. */
  readonly confidence: number;
  readonly evidenceIds: readonly string[];
}

export type TimelineEventKind =
  | "change"
  | "deployment"
  | "metric"
  | "alert"
  | "incident"
  | "agent"
  | "decision"
  | "remediation"
  | "recovery";

export interface TimelineEvent {
  readonly id: string;
  readonly timestamp: Timestamp;
  readonly kind: TimelineEventKind;
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
  readonly serviceIds: readonly string[];
  readonly actor: string;
  readonly evidenceIds: readonly string[];
}

export type MetricUnit = "ms" | "percent" | "rpm" | "count";

export interface MetricPoint {
  readonly timestamp: Timestamp;
  readonly value: number;
}

export interface MetricSeries {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly serviceId: string;
  readonly unit: MetricUnit;
  readonly color: string;
  readonly baseline: number;
  readonly threshold?: number;
  readonly higherIsWorse: boolean;
  readonly points: readonly MetricPoint[];
}

export type ChangeKind =
  | "feature"
  | "fix"
  | "refactor"
  | "dependency"
  | "configuration"
  | "observability";

export type ChangeStatus =
  | "deployed"
  | "rolling-out"
  | "ready"
  | "blocked"
  | "rolled-back";

export interface ChangeRisk {
  readonly score: number;
  readonly level: RiskLevel;
  readonly factors: readonly string[];
}

export interface Change {
  readonly id: string;
  readonly title: string;
  readonly kind: ChangeKind;
  readonly status: ChangeStatus;
  readonly repository: string;
  readonly branch: string;
  readonly commitSha: string;
  readonly pullRequest: number;
  readonly author: string;
  readonly mergedAt: Timestamp;
  readonly deployedAt: Timestamp | null;
  readonly serviceIds: readonly string[];
  readonly linesAdded: number;
  readonly linesDeleted: number;
  readonly filesChanged: number;
  readonly risk: ChangeRisk;
  readonly evidenceIds: readonly string[];
}

export type AgentRunStatus =
  | "queued"
  | "running"
  | "awaiting-approval"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentMission =
  | "incident-investigation"
  | "change-review"
  | "release-readiness"
  | "postmortem"
  | "slo-guard";

export type AgentStepStatus = "pending" | "running" | "completed" | "blocked";

export interface AgentStep {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly status: AgentStepStatus;
  readonly startedAt: Timestamp | null;
  readonly finishedAt: Timestamp | null;
}

export interface AgentRun {
  readonly id: string;
  readonly title: string;
  readonly mission: AgentMission;
  readonly status: AgentRunStatus;
  readonly objective: string;
  readonly trigger: string;
  readonly startedAt: Timestamp;
  readonly finishedAt: Timestamp | null;
  /** Progress and confidence are normalized to the inclusive 0..1 range. */
  readonly progress: number;
  readonly confidence: number;
  readonly steps: readonly AgentStep[];
  readonly serviceIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly summary: string;
}

export type EvidenceKind =
  | "pull-request"
  | "deployment"
  | "metric"
  | "trace"
  | "log"
  | "session"
  | "runbook";

export interface Evidence {
  readonly id: string;
  readonly kind: EvidenceKind;
  readonly title: string;
  readonly source: string;
  readonly timestamp: Timestamp;
  readonly summary: string;
  readonly serviceIds: readonly string[];
  readonly externalUrl: string;
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
}

export type DoraMetricId =
  | "deployment-frequency"
  | "change-lead-time"
  | "failed-deployment-recovery-time"
  | "change-fail-rate"
  | "deployment-rework-rate";

export interface DoraMetric {
  readonly id: DoraMetricId;
  readonly label: string;
  readonly value: number;
  readonly displayValue: string;
  readonly unit: "per-day" | "minutes" | "percent";
  readonly trend: TrendDirection;
  readonly delta: number;
  readonly deltaLabel: string;
  readonly status: "excellent" | "good" | "needs-attention";
}

export interface SloReport {
  readonly id: string;
  readonly name: string;
  readonly serviceId: string;
  readonly target: number;
  readonly current: number;
  readonly errorBudgetRemaining: number;
  readonly burnRate: number;
  readonly windowDays: number;
  readonly status: "healthy" | "warning" | "breached";
}

export interface ReportMetrics {
  readonly window: {
    readonly label: string;
    readonly from: Timestamp;
    readonly to: Timestamp;
  };
  readonly generatedAt: Timestamp;
  readonly dora: readonly DoraMetric[];
  readonly slos: readonly SloReport[];
  readonly incident: {
    readonly count: number;
    readonly customerImpactMinutes: number;
    readonly medianAcknowledgeMinutes: number;
    readonly medianResolveMinutes: number;
  };
}

export interface AttentionItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
  readonly category: "incident" | "change" | "slo" | "security" | "agent";
  readonly serviceId?: string;
  readonly href: string;
  readonly dueAt: Timestamp | null;
}

export interface PulseMetric {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly displayValue: string;
  readonly detail: string;
  readonly trend: TrendDirection;
  readonly tone: "positive" | "neutral" | "warning" | "negative";
}
