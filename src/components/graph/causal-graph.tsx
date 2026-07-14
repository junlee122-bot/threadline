"use client";

import {
  Activity,
  Bot,
  Box,
  Flag,
  GitCommitHorizontal,
  GitPullRequest,
  LineChart,
  RadioTower,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type GraphNode = {
  id: string;
  label: string;
  detail: string;
  kind: "pull-request" | "commit" | "deployment" | "flag" | "service" | "metric" | "customer" | "agent" | "runtime";
  status?: "neutral" | "healthy" | "warning" | "critical" | "inferred";
  x: number;
  y: number;
  step?: number;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  state: "observed" | "inferred" | "approved";
  step?: number;
};

const icons = {
  "pull-request": GitPullRequest,
  commit: GitCommitHorizontal,
  deployment: RadioTower,
  flag: Flag,
  service: Box,
  metric: LineChart,
  customer: Users,
  agent: Bot,
  runtime: Activity,
};

const statusClasses = {
  neutral: "border-border-strong text-muted",
  healthy: "border-success/30 text-success",
  warning: "border-warning/30 text-warning",
  critical: "border-danger/30 text-danger",
  inferred: "border-inference/30 text-inference",
};

export function CausalGraph({
  nodes,
  edges,
  selectedId,
  onSelect,
  currentStep = Number.POSITIVE_INFINITY,
  className,
}: {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  selectedId?: string;
  onSelect?: (node: GraphNode) => void;
  currentStep?: number;
  className?: string;
}) {
  const visibleNodes = nodes.filter((node) => (node.step ?? 0) <= currentStep);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges.filter(
    (edge) => (edge.step ?? 0) <= currentStep && visibleIds.has(edge.source) && visibleIds.has(edge.target),
  );
  const byId = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div className={cn("relative", className)}>
      <ul className="sr-only" aria-label="Causal relationships">
        {visibleEdges.map((edge) => {
          const source = byId.get(edge.source);
          const target = byId.get(edge.target);
          if (!source || !target) return null;
          return <li key={`accessible-${edge.id}`}>{source.label} to {target.label}: {edge.state} relationship.</li>;
        })}
      </ul>
      <div className="relative hidden h-[360px] overflow-hidden rounded-lg border border-border bg-[#0a0f12] lg:block">
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-50" />
        <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 1000 360" preserveAspectRatio="none">
          {visibleEdges.map((edge) => {
            const source = byId.get(edge.source);
            const target = byId.get(edge.target);
            if (!source || !target) return null;
            const x1 = source.x * 10;
            const y1 = source.y * 3.6;
            const x2 = target.x * 10;
            const y2 = target.y * 3.6;
            const curve = Math.max(40, Math.abs(x2 - x1) * 0.32);
            return (
              <path
                key={edge.id}
                d={`M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={edge.state === "inferred" ? "var(--violet)" : edge.state === "approved" ? "var(--success)" : "var(--primary)"}
                strokeOpacity={edge.state === "inferred" ? 0.62 : 0.46}
                strokeWidth={edge.state === "approved" ? 2.5 : 1.5}
                strokeDasharray={edge.state === "inferred" ? "7 6" : undefined}
                className={edge.state !== "approved" ? "thread-path" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {visibleNodes.map((node) => {
          const Icon = icons[node.kind];
          const active = selectedId === node.id;
          return (
            <button
              type="button"
              key={node.id}
              onClick={() => onSelect?.(node)}
              className={cn(
                "group absolute z-10 w-[126px] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-panel px-2.5 py-2.5 text-start shadow-lg transition-all hover:-translate-y-[54%] hover:border-border-strong focus:-translate-y-[54%]",
                statusClasses[node.status ?? "neutral"],
                active && "border-primary bg-panel-elevated ring-1 ring-primary/25",
              )}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              aria-pressed={active}
            >
              <span className="flex items-center gap-2">
                <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.8} />
                <span className="truncate font-mono text-[9px] font-medium text-foreground">{node.label}</span>
              </span>
              <span className="mt-1.5 block truncate font-mono text-[8px] text-muted">{node.detail}</span>
            </button>
          );
        })}
        <div className="absolute bottom-3 start-3 flex items-center gap-4 rounded-md border border-border bg-background/80 px-3 py-2 font-mono text-[8px] text-muted backdrop-blur">
          <span className="flex items-center gap-1.5"><span className="h-px w-5 bg-primary" />Observed</span>
          <span className="flex items-center gap-1.5"><span className="w-5 border-t border-dashed border-inference" />Inferred</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-success" />Approved</span>
        </div>
      </div>

      <ol className="space-y-2 lg:hidden" aria-label="Causal thread in chronological order">
        {visibleNodes.map((node, index) => {
          const Icon = icons[node.kind];
          const active = selectedId === node.id;
          return (
            <li key={node.id} className="relative ps-8">
              {index < visibleNodes.length - 1 && <span aria-hidden="true" className="absolute bottom-[-10px] start-[13px] top-8 w-px bg-border-strong" />}
              <span className="absolute start-[9px] top-4 size-2 rounded-full border border-primary bg-background" />
              <button
                type="button"
                onClick={() => onSelect?.(node)}
                aria-pressed={active}
                className={cn("flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-panel-soft p-3 text-start", active && "border-primary/40 bg-primary/[0.04]")}
              >
                <Icon aria-hidden="true" className={cn("size-4", statusClasses[node.status ?? "neutral"].split(" ")[1])} />
                <span className="min-w-0"><span className="block truncate font-mono text-[10px]">{node.label}</span><span className="block truncate text-[9px] text-muted">{node.detail}</span></span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
