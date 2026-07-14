"use client";

import { useState } from "react";
import Link from "next/link";
import { services as demoServices } from "@/lib/demo-data";
import {
  Activity,
  Braces,
  ChevronRight,
  CircleDot,
  Cloud,
  Database,
  GitBranch,
  Maximize2,
  Minus,
  Network,
  Package,
  Plus,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

type ViewMode = "topology" | "risk" | "activity";
type NodeRisk = "healthy" | "watch" | "critical";
type NodeKind = "service" | "package" | "data" | "external";

type MapNode = {
  id: string;
  label: string;
  subtitle: string;
  kind: NodeKind;
  x: number;
  y: number;
  risk: NodeRisk;
  activity: number;
  owner: string;
  version: string;
  coverage: number;
  changeRate: string;
  description: string;
  recent: { label: string; time: string; tone: "good" | "warn" | "neutral" }[];
};

const nodes: MapNode[] = [
  {
    id: "web-storefront",
    label: "Web storefront",
    subtitle: "Next.js edge app",
    kind: "service",
    x: 10,
    y: 47,
    risk: "healthy",
    activity: 68,
    owner: "Shopping Experience",
    version: "2026.07.14.3",
    coverage: 92,
    changeRate: "14 / week",
    description: "Customer-facing application and the primary entry point into the checkout graph.",
    recent: [
      { label: "Deployment verified", time: "8m", tone: "good" },
      { label: "3 routes revalidated", time: "21m", tone: "neutral" },
    ],
  },
  {
    id: "edge-gateway",
    label: "Edge gateway",
    subtitle: "Public API boundary",
    kind: "service",
    x: 31,
    y: 47,
    risk: "watch",
    activity: 91,
    owner: "Core Platform",
    version: "v2.44.1",
    coverage: 87,
    changeRate: "23 / week",
    description: "Routes authenticated traffic and coordinates fan-out to commerce services.",
    recent: [
      { label: "Latency budget at 74%", time: "4m", tone: "warn" },
      { label: "Schema diff approved", time: "36m", tone: "good" },
    ],
  },
  {
    id: "identity",
    label: "Identity",
    subtitle: "Session & policy",
    kind: "service",
    x: 54,
    y: 18,
    risk: "healthy",
    activity: 34,
    owner: "Trust Platform",
    version: "v5.9.2",
    coverage: 96,
    changeRate: "5 / week",
    description: "Issues sessions and evaluates authorization policies for all public traffic.",
    recent: [{ label: "Policy suite passed", time: "1h", tone: "good" }],
  },
  {
    id: "checkout-api",
    label: "Checkout API",
    subtitle: "Checkout orchestration",
    kind: "service",
    x: 55,
    y: 47,
    risk: "critical",
    activity: 97,
    owner: "Checkout Reliability",
    version: "v2.18.0",
    coverage: 78,
    changeRate: "31 / week",
    description: "Orchestrates totals, inventory, payments, and outbound tax quotes on the Tier-0 checkout path.",
    recent: [
      { label: "instant-tax-v2 disabled with human approval", time: "2m", tone: "warn" },
      { label: "Tax-adapter pool recovered", time: "7m", tone: "neutral" },
      { label: "p95 below 800 ms for five minutes", time: "12m", tone: "good" },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    subtitle: "Authorization & settlement",
    kind: "service",
    x: 55,
    y: 78,
    risk: "watch",
    activity: 72,
    owner: "Money Movement",
    version: "v7.12.4",
    coverage: 88,
    changeRate: "11 / week",
    description: "Normalizes payment provider APIs and produces settlement events.",
    recent: [{ label: "Webhook contract changed", time: "19m", tone: "warn" }],
  },
  {
    id: "tax-adapter",
    label: "Tax adapter",
    subtitle: "Jurisdiction quote provider",
    kind: "service",
    x: 77,
    y: 16,
    risk: "healthy",
    activity: 18,
    owner: "Commerce Core",
    version: "v5.7.2",
    coverage: 93,
    changeRate: "4 / week",
    description: "Normalizes third-party tax quotes and exposes the connection-pool pressure seen in INC-2471.",
    recent: [{ label: "Pool wait returned to baseline", time: "7m", tone: "good" }],
  },
  {
    id: "cart",
    label: "Cart",
    subtitle: "Basket & pricing state",
    kind: "service",
    x: 79,
    y: 40,
    risk: "watch",
    activity: 88,
    owner: "Shopping Experience",
    version: "v4.27.3",
    coverage: 81,
    changeRate: "9 / week",
    description: "Persistent basket and price reconciliation for checkout.",
    recent: [
      { label: "Checkout latency guard active", time: "5m", tone: "warn" },
      { label: "Basket reconciliation verified", time: "51m", tone: "good" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    subtitle: "Stock reservations",
    kind: "service",
    x: 78,
    y: 64,
    risk: "healthy",
    activity: 61,
    owner: "Fulfillment Platform",
    version: "v6.4.8",
    coverage: 84,
    changeRate: "4 / week",
    description: "Available-to-promise reads and short-lived stock reservations.",
    recent: [{ label: "Consumer lag cleared", time: "27m", tone: "good" }],
  },
  {
    id: "instant-tax-v2",
    label: "instant-tax-v2",
    subtitle: "Feature flag · 0% exposure",
    kind: "external",
    x: 79,
    y: 86,
    risk: "watch",
    activity: 82,
    owner: "Commerce Core",
    version: "audit rev. 1842",
    coverage: 100,
    changeRate: "controlled",
    description: "Rollout control moved from 50% to 100%, exposing retry amplification before a human-approved disable.",
    recent: [{ label: "100% → 0% approved by J. Lee", time: "now", tone: "good" }],
  },
  {
    id: "telemetry",
    label: "Telemetry",
    subtitle: "Traces, metrics & logs",
    kind: "external",
    x: 93,
    y: 54,
    risk: "healthy",
    activity: 42,
    owner: "Core Platform",
    version: "OTel 1.52",
    coverage: 90,
    changeRate: "8 / week",
    description: "Correlated runtime evidence used to explain changes and incidents.",
    recent: [{ label: "Trace coverage 99.2%", time: "11m", tone: "good" }],
  },
  {
    id: "tax-client",
    label: "tax-client",
    subtitle: "Shared quote SDK",
    kind: "package",
    x: 31,
    y: 80,
    risk: "healthy",
    activity: 27,
    owner: "Commerce Core",
    version: "v2.18.0",
    coverage: 94,
    changeRate: "6 / week",
    description: "Versioned retry and timeout contract between checkout-api and the tax adapter.",
    recent: [{ label: "Retry budget review required", time: "9m", tone: "warn" }],
  },
];

const edges: Array<[string, string]> = [
  ["web-storefront", "edge-gateway"],
  ["edge-gateway", "identity"],
  ["edge-gateway", "cart"],
  ["edge-gateway", "checkout-api"],
  ["cart", "inventory"],
  ["checkout-api", "cart"],
  ["checkout-api", "inventory"],
  ["checkout-api", "payments"],
  ["checkout-api", "instant-tax-v2"],
  ["checkout-api", "tax-client"],
  ["tax-client", "tax-adapter"],
  ["checkout-api", "telemetry"],
];

const kindIcon: Record<NodeKind, LucideIcon> = {
  service: Server,
  package: Package,
  data: Database,
  external: Cloud,
};

const modeOptions: Array<{ id: ViewMode; label: string; icon: LucideIcon }> = [
  { id: "topology", label: "Topology", icon: Network },
  { id: "risk", label: "Risk", icon: ShieldCheck },
  { id: "activity", label: "Activity", icon: Activity },
];

function nodeTone(node: MapNode, mode: ViewMode, selected: boolean) {
  if (selected) return "border-[#b7f34b] bg-[#182215] text-[#e8ffd0] shadow-[0_0_0_1px_rgba(183,243,75,0.28),0_16px_42px_rgba(0,0,0,0.38)]";
  if (mode === "risk") {
    if (node.risk === "critical") return "border-rose-400/60 bg-rose-400/10 text-rose-100";
    if (node.risk === "watch") return "border-amber-300/55 bg-amber-300/10 text-amber-100";
    return "border-emerald-300/30 bg-emerald-300/5 text-emerald-100";
  }
  if (mode === "activity" && node.activity > 80) return "border-cyan-300/60 bg-cyan-300/10 text-cyan-50 shadow-[0_0_28px_rgba(103,232,249,0.12)]";
  return "border-white/15 bg-[#111614]/95 text-white hover:border-white/30 hover:bg-[#161d19]";
}

export function DependencyMap() {
  const [viewMode, setViewMode] = useState<ViewMode>("topology");
  const [selectedId, setSelectedId] = useState("checkout-api");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(100);

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const outgoingDependencies = edges
    .filter(([fromId]) => fromId === selectedNode.id)
    .map(([, toId]) => nodes.find((node) => node.id === toId))
    .filter((node): node is MapNode => Boolean(node));
  const incomingDependents = edges
    .filter(([, toId]) => toId === selectedNode.id)
    .map(([fromId]) => nodes.find((node) => node.id === fromId))
    .filter((node): node is MapNode => Boolean(node));
  const normalizedQuery = query.trim().toLowerCase();
  const matchedIds = new Set(
    nodes
      .filter((node) => `${node.label} ${node.subtitle} ${node.owner}`.toLowerCase().includes(normalizedQuery))
      .map((node) => node.id),
  );

  return (
    <section className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b7f34b]">
            <CircleDot className="size-3.5" aria-hidden="true" />
            Living architecture
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">System map</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Trace ownership, runtime dependencies, and change risk across the entire commerce graph.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:min-w-[390px]">
          {[
            [String(demoServices.length), "services"],
            [String(edges.length), "connections"],
            ["2", "at risk"],
          ].map(([value, label]) => (
            <div key={label} className="bg-[#0c100e] px-4 py-3 text-center">
              <div className="font-mono text-lg font-medium text-white">{value}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">{label}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090d0b] shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a service, owner, package…"
                aria-label="Search system map"
                className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-9 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#b7f34b]/45 focus:ring-2 focus:ring-[#b7f34b]/10"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/55 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <span className="hidden text-xs text-white/50 sm:inline">main / production</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-1" role="group" aria-label="Map view mode">
              {modeOptions.map((option) => {
                const Icon = option.icon;
                const active = viewMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setViewMode(option.id)}
                    className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
                      active ? "bg-white/10 text-white shadow-sm" : "text-white/55 hover:text-white/70"
                    }`}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="hidden items-center overflow-hidden rounded-lg border border-white/10 sm:flex">
              <button type="button" onClick={() => setZoom((value) => Math.max(80, value - 10))} aria-label="Zoom out" className="grid size-8 place-items-center text-white/55 hover:bg-white/5 hover:text-white">
                <Minus className="size-3.5" aria-hidden="true" />
              </button>
              <span className="w-12 text-center font-mono text-[10px] text-white/55">{zoom}%</span>
              <button type="button" onClick={() => setZoom((value) => Math.min(120, value + 10))} aria-label="Zoom in" className="grid size-8 place-items-center text-white/55 hover:bg-white/5 hover:text-white">
                <Plus className="size-3.5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setZoom(100)} aria-label="Reset zoom" className="grid size-8 place-items-center border-l border-white/10 text-white/55 hover:bg-white/5 hover:text-white">
                <Maximize2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="relative min-h-[570px] overflow-x-auto overflow-y-hidden border-b border-white/10 xl:border-b-0 xl:border-r">
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                maskImage: "radial-gradient(circle at 52% 45%, black, transparent 82%)",
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_48%,rgba(183,243,75,0.055),transparent_35%)]" />

            <div
              className="absolute inset-4 min-w-[760px] origin-center transition-transform duration-300 sm:inset-8"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="sr-only">
                <h2>System relationships</h2>
                <ul>
                  {edges.map(([fromId, toId]) => {
                    const from = nodes.find((node) => node.id === fromId);
                    const to = nodes.find((node) => node.id === toId);
                    return from && to ? <li key={`${fromId}-${toId}`}>{from.label} uses {to.label}.</li> : null;
                  })}
                </ul>
              </div>
              <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="edge-gradient" x1="0" x2="1">
                    <stop offset="0" stopColor="#ffffff" stopOpacity=".12" />
                    <stop offset="1" stopColor="#b7f34b" stopOpacity=".38" />
                  </linearGradient>
                </defs>
                {edges.map(([fromId, toId]) => {
                  const from = nodes.find((node) => node.id === fromId)!;
                  const to = nodes.find((node) => node.id === toId)!;
                  const connected = selectedId === fromId || selectedId === toId;
                  return (
                    <line
                      key={`${fromId}-${toId}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={connected ? "url(#edge-gradient)" : "rgba(255,255,255,.11)"}
                      strokeWidth={connected ? 0.34 : 0.2}
                      strokeDasharray={viewMode === "activity" ? "1 1" : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {nodes.map((node) => {
                const Icon = kindIcon[node.kind];
                const isSelected = node.id === selectedId;
                const isMatch = !normalizedQuery || matchedIds.has(node.id);
                return (
                  <button
                    key={node.id}
                    type="button"
                    disabled={!isMatch}
                    tabIndex={isMatch ? 0 : -1}
                    onClick={() => setSelectedId(node.id)}
                    aria-pressed={isSelected}
                    aria-label={`${node.label}, ${node.subtitle}, ${node.risk}`}
                    className={`group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f34b] ${nodeTone(node, viewMode, isSelected)} ${
                      isMatch ? "opacity-100" : "opacity-20 grayscale"
                    }`}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    {viewMode === "activity" && node.activity > 80 ? <span className="absolute -inset-1 -z-10 animate-pulse rounded-2xl border border-cyan-300/15" /> : null}
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${isSelected ? "bg-[#b7f34b] text-[#14200c]" : "bg-white/[0.07] text-white/60"}`}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap text-[12px] font-semibold leading-4">{node.label}</span>
                      <span className={`block whitespace-nowrap text-[9px] leading-4 ${isSelected ? "text-[#d7f5aa]/60" : "text-white/50"}`}>{node.subtitle}</span>
                    </span>
                    {viewMode === "risk" && node.risk !== "healthy" ? <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" /> : null}
                    {viewMode === "activity" ? <span className="font-mono text-[9px] text-white/55">{node.activity}</span> : null}
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#0a0e0c]/90 px-3 py-2 text-[10px] text-white/55 backdrop-blur sm:bottom-5 sm:left-5">
              {viewMode === "risk" ? (
                <>
                  <LegendDot color="bg-emerald-300" label="Healthy" />
                  <LegendDot color="bg-amber-300" label="Watch" />
                  <LegendDot color="bg-rose-400" label="Critical" />
                </>
              ) : viewMode === "activity" ? (
                <><Zap className="size-3 text-cyan-300" aria-hidden="true" /> Node glow reflects 24h change activity</>
              ) : (
                <>
                  <LegendIcon icon={Server} label="Service" />
                  <LegendIcon icon={Database} label="Data" />
                  <LegendIcon icon={Package} label="Package" />
                  <LegendIcon icon={Cloud} label="External" />
                </>
              )}
            </div>
          </div>

          <aside className="bg-[#0c100e]" aria-label="Selected component inspector">
            <div className="border-b border-white/10 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#b7f34b]/10 text-[#b7f34b] ring-1 ring-inset ring-[#b7f34b]/20">
                    {(() => {
                      const Icon = kindIcon[selectedNode.kind];
                      return <Icon className="size-5" aria-hidden="true" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/50">{selectedNode.kind}</p>
                    <h2 className="mt-0.5 font-semibold text-white">{selectedNode.label}</h2>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                  selectedNode.risk === "critical" ? "border-rose-400/25 bg-rose-400/10 text-rose-300" : selectedNode.risk === "watch" ? "border-amber-300/25 bg-amber-300/10 text-amber-200" : "border-emerald-300/20 bg-emerald-300/5 text-emerald-300"
                }`}>
                  {selectedNode.risk}
                </span>
              </div>
              <p className="text-xs leading-5 text-white/60">{selectedNode.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <InspectorMetric label="Owner" value={selectedNode.owner} />
                <InspectorMetric label="Version" value={selectedNode.version} mono />
                <InspectorMetric label="Coverage" value={`${selectedNode.coverage}%`} mono />
                <InspectorMetric label="Change rate" value={selectedNode.changeRate} mono />
              </div>
            </div>

            <div className="border-b border-white/10 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/55">Dependency surface</h3>
                <span className="font-mono text-[10px] text-white/50">{outgoingDependencies.length + incomingDependents.length} edges</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.13em] text-white/50">
                    <span>Outgoing · uses</span>
                    <span className="font-mono">{outgoingDependencies.length}</span>
                  </div>
                  <div className="space-y-2">
                    {outgoingDependencies.length ? outgoingDependencies.map((dependency) => (
                      <button key={dependency.id} type="button" onClick={() => setSelectedId(dependency.id)} className="flex w-full items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-left text-xs text-white/60 hover:border-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f34b]">
                        <GitBranch className="size-3.5 text-[#b7f34b]/55" aria-hidden="true" />
                        <span className="flex-1 truncate">{dependency.label}</span>
                        <span className="text-[9px] uppercase tracking-wider text-white/50">uses</span>
                        <ChevronRight className="size-3" aria-hidden="true" />
                      </button>
                    )) : <p className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-white/50">No outgoing dependencies.</p>}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.13em] text-white/50">
                    <span>Incoming · used by</span>
                    <span className="font-mono">{incomingDependents.length}</span>
                  </div>
                  <div className="space-y-2">
                    {incomingDependents.length ? incomingDependents.map((dependent) => (
                      <button key={dependent.id} type="button" onClick={() => setSelectedId(dependent.id)} className="flex w-full items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-left text-xs text-white/60 hover:border-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f34b]">
                        <GitBranch className="size-3.5 rotate-180 text-cyan-300/55" aria-hidden="true" />
                        <span className="flex-1 truncate">{dependent.label}</span>
                        <span className="text-[9px] uppercase tracking-wider text-white/50">used by</span>
                        <ChevronRight className="size-3" aria-hidden="true" />
                      </button>
                    )) : <p className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-white/50">No incoming dependents.</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-3.5 text-[#b7f34b]" aria-hidden="true" />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/55">Recent signals</h3>
              </div>
              <div className="space-y-3">
                {selectedNode.recent.map((event) => (
                  <div key={`${event.label}-${event.time}`} className="flex gap-3">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${event.tone === "warn" ? "bg-amber-300" : event.tone === "good" ? "bg-emerald-300" : "bg-cyan-300"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-white/65">{event.label}</p>
                      <p className="mt-0.5 font-mono text-[9px] text-white/50">{event.time} ago</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/changes" className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#b7f34b] text-xs font-semibold text-[#13200b] transition hover:bg-[#c7fa70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f34b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c100e]">
                <Braces className="size-3.5" aria-hidden="true" />
                Open architecture brief
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${color}`} />{label}</span>;
}

function LegendIcon({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return <span className="flex items-center gap-1.5"><Icon className="size-3" aria-hidden="true" />{label}</span>;
}

function InspectorMetric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-2.5">
      <p className="text-[9px] uppercase tracking-[0.12em] text-white/50">{label}</p>
      <p className={`mt-1 truncate text-[11px] text-white/65 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
