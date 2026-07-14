import {
  DEMO_NOW,
  causalNodes,
  evidence,
  services,
} from "@/lib/demo-data";
import type {
  AgentMission,
  AgentRun,
  AgentRunStatus,
  CausalNode,
  Change,
  ChangeStatus,
  Evidence,
  HealthStatus,
  RiskLevel,
  Service,
  Severity,
  TimelineEvent,
  TimelineEventKind,
} from "@/types/threadline";

export type DateInput = string | number | Date;

export interface ServiceFilter {
  readonly query?: string;
  readonly health?: HealthStatus | readonly HealthStatus[];
  readonly owner?: string;
  readonly tags?: readonly string[];
}

export interface ChangeFilter {
  readonly query?: string;
  readonly status?: ChangeStatus | readonly ChangeStatus[];
  readonly serviceId?: string;
  readonly minRisk?: number;
  readonly maxRisk?: number;
}

export interface TimelineEventFilter {
  readonly query?: string;
  readonly kinds?: readonly TimelineEventKind[];
  readonly severities?: readonly Severity[];
  readonly serviceId?: string;
  readonly from?: DateInput;
  readonly to?: DateInput;
}

export interface AgentRunFilter {
  readonly query?: string;
  readonly status?: AgentRunStatus | readonly AgentRunStatus[];
  readonly mission?: AgentMission | readonly AgentMission[];
  readonly serviceId?: string;
}

function epoch(value: DateInput): number {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function selection<T extends string>(value: T | readonly T[] | undefined): ReadonlySet<T> | null {
  if (value === undefined) return null;
  if (typeof value === "string") return new Set<T>([value as T]);
  return new Set<T>(value);
}

function includesQuery(query: string | undefined, values: readonly string[]): boolean {
  const needle = query?.trim().toLocaleLowerCase("en-US");
  if (!needle) return true;
  return values.some((value) => value.toLocaleLowerCase("en-US").includes(needle));
}

export function minutesBetween(from: DateInput, to: DateInput): number {
  return Math.round(((epoch(to) - epoch(from)) / 60_000) * 10) / 10;
}

export function formatRelativeTime(value: DateInput, now: DateInput = DEMO_NOW): string {
  const seconds = Math.round((epoch(value) - epoch(now)) / 1_000);
  const absolute = Math.abs(seconds);

  if (absolute < 45) return seconds > 0 ? "in a moment" : "just now";

  const units: ReadonlyArray<readonly [limit: number, divisor: number, suffix: string]> = [
    [3_600, 60, "m"],
    [86_400, 3_600, "h"],
    [604_800, 86_400, "d"],
    [2_629_800, 604_800, "w"],
    [31_557_600, 2_629_800, "mo"],
    [Number.POSITIVE_INFINITY, 31_557_600, "y"],
  ];

  const [, divisor, suffix] = units.find(([limit]) => absolute < limit) ?? units[units.length - 1];
  const amount = Math.max(1, Math.round(absolute / divisor));
  return seconds > 0 ? `in ${amount}${suffix}` : `${amount}${suffix} ago`;
}

export function formatDuration(durationMs: number): string {
  const safeMs = Math.max(0, Math.round(durationMs));
  if (safeMs < 1_000) return `${safeMs} ms`;

  const totalSeconds = Math.round(safeMs / 1_000);
  if (totalSeconds < 60) return `${totalSeconds} s`;

  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (totalMinutes < 60) return seconds === 0 ? `${totalMinutes} min` : `${totalMinutes} min ${seconds} s`;

  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (totalHours < 24) return minutes === 0 ? `${totalHours} h` : `${totalHours} h ${minutes} min`;

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours === 0 ? `${days} d` : `${days} d ${hours} h`;
}

export function riskScore(change: Pick<Change, "risk">): number {
  return Math.round(Math.min(100, Math.max(0, change.risk.score)));
}

export function riskBand(score: number): RiskLevel {
  const normalized = Math.min(100, Math.max(0, score));
  if (normalized >= 85) return "critical";
  if (normalized >= 60) return "high";
  if (normalized >= 30) return "medium";
  return "low";
}

export function filterServices(
  items: readonly Service[],
  filter: ServiceFilter = {},
): Service[] {
  const health = selection(filter.health);
  const owner = filter.owner?.trim().toLocaleLowerCase("en-US");

  return items.filter((service) => {
    const matchesQuery = includesQuery(filter.query, [
      service.id,
      service.name,
      service.owner,
      service.description,
      service.repository,
      ...service.tags,
    ]);
    const matchesHealth = health === null || health.has(service.health);
    const matchesOwner = !owner || service.owner.toLocaleLowerCase("en-US") === owner;
    const matchesTags =
      !filter.tags?.length || filter.tags.every((tag) => service.tags.includes(tag));
    return matchesQuery && matchesHealth && matchesOwner && matchesTags;
  });
}

export function filterChanges(
  items: readonly Change[],
  filter: ChangeFilter = {},
): Change[] {
  const statuses = selection(filter.status);
  const minRisk = filter.minRisk ?? 0;
  const maxRisk = filter.maxRisk ?? 100;

  return items.filter((change) => {
    const matchesQuery = includesQuery(filter.query, [
      change.id,
      change.title,
      change.repository,
      change.branch,
      change.commitSha,
      change.author,
      String(change.pullRequest),
    ]);
    const matchesStatus = statuses === null || statuses.has(change.status);
    const matchesService = !filter.serviceId || change.serviceIds.includes(filter.serviceId);
    const score = riskScore(change);
    return matchesQuery && matchesStatus && matchesService && score >= minRisk && score <= maxRisk;
  });
}

export function filterTimelineEvents(
  items: readonly TimelineEvent[],
  filter: TimelineEventFilter = {},
): TimelineEvent[] {
  const kinds = filter.kinds ? new Set(filter.kinds) : null;
  const severities = filter.severities ? new Set(filter.severities) : null;
  const from = filter.from === undefined ? Number.NEGATIVE_INFINITY : epoch(filter.from);
  const to = filter.to === undefined ? Number.POSITIVE_INFINITY : epoch(filter.to);

  return items.filter((event) => {
    const timestamp = epoch(event.timestamp);
    return (
      includesQuery(filter.query, [event.title, event.description, event.actor]) &&
      (kinds === null || kinds.has(event.kind)) &&
      (severities === null || severities.has(event.severity)) &&
      (!filter.serviceId || event.serviceIds.includes(filter.serviceId)) &&
      timestamp >= from &&
      timestamp <= to
    );
  });
}

export function filterAgentRuns(
  items: readonly AgentRun[],
  filter: AgentRunFilter = {},
): AgentRun[] {
  const statuses = selection(filter.status);
  const missions = selection(filter.mission);

  return items.filter((run) =>
    includesQuery(filter.query, [run.id, run.title, run.objective, run.summary, run.trigger]) &&
    (statuses === null || statuses.has(run.status)) &&
    (missions === null || missions.has(run.mission)) &&
    (!filter.serviceId || run.serviceIds.includes(filter.serviceId)),
  );
}

export function getServiceById(
  id: string,
  allServices: readonly Service[] = services,
): Service | undefined {
  return allServices.find((service) => service.id === id);
}

export function getEvidenceForNode(
  nodeId: string,
  allNodes: readonly CausalNode[] = causalNodes,
  allEvidence: readonly Evidence[] = evidence,
): Evidence[] {
  const evidenceIds = new Set(
    allNodes.find((node) => node.id === nodeId)?.evidenceIds ?? [],
  );
  return allEvidence.filter((item) => evidenceIds.has(item.id));
}

/** Returns every transitive dependency, nearest first, without mutating fixtures. */
export function getDownstreamServices(
  serviceId: string,
  allServices: readonly Service[] = services,
): Service[] {
  const byId = new Map(allServices.map((service) => [service.id, service]));
  const seen = new Set<string>([serviceId]);
  const queue = [...(byId.get(serviceId)?.dependencyIds ?? [])];
  const result: Service[] = [];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const service = byId.get(id);
    if (!service) continue;
    result.push(service);
    queue.push(...service.dependencyIds);
  }

  return result;
}

/** Returns every transitive caller, nearest first, without mutating fixtures. */
export function getUpstreamServices(
  serviceId: string,
  allServices: readonly Service[] = services,
): Service[] {
  const seen = new Set<string>([serviceId]);
  const queue = [serviceId];
  const result: Service[] = [];

  while (queue.length > 0) {
    const dependencyId = queue.shift();
    if (!dependencyId) continue;
    const directCallers = allServices.filter((service) =>
      service.dependencyIds.includes(dependencyId),
    );
    for (const service of directCallers) {
      if (seen.has(service.id)) continue;
      seen.add(service.id);
      result.push(service);
      queue.push(service.id);
    }
  }

  return result;
}
