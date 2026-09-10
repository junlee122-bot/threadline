"use client";

import { ArrowDownRight, ArrowRight, BookOpen, Check, ChevronDown, GitCompareArrows, ScanSearch, ShieldCheck, TrendingUp } from "lucide-react";
import { useId, useState } from "react";
import { StatusPill } from "@/components/ui/status-pill";
import { LAB_DECISIONS, LAB_RECOVERY_HOLD_SECONDS, LAB_TOTAL_SECONDS, formatLabTime } from "@/lib/crisis-lab";
import { cn } from "@/lib/utils";
import type { LabAssessment, LabCompetencyId, LabIncidentResult } from "@/types/crisis-lab";

const DOMAIN_PRESENTATION = {
  diagnosis: { icon: ScanSearch, color: "text-signal", fill: "bg-signal", active: "border-signal/40 bg-signal/[0.04]" },
  containment: { icon: ShieldCheck, color: "text-primary", fill: "bg-primary", active: "border-primary/40 bg-primary/[0.04]" },
  recovery: { icon: TrendingUp, color: "text-inference", fill: "bg-inference", active: "border-inference/40 bg-inference/[0.04]" },
} as const;

export function LabLearningReview({ assessment }: { assessment: LabAssessment }) {
  const [selectedId, setSelectedId] = useState<LabCompetencyId>(() => [...assessment.competencies].sort((a, b) => a.score - b.score)[0].id);
  const selected = assessment.competencies.find((competency) => competency.id === selectedId) ?? assessment.competencies[0];
  return (
    <section aria-labelledby="learning-title" className="panel panel-luminous mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <div><p className="eyebrow text-inference">Learn from the decision, not only the outcome</p><h2 id="learning-title" className="mt-2 text-sm font-medium">Response competency review</h2></div>
        <StatusPill tone="signal" className="sm:ms-auto">{assessment.completed}/{assessment.total} gates assessed</StatusPill>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5" role="group" aria-label="Review a competency">
        {assessment.competencies.map((competency) => {
          const presentation = DOMAIN_PRESENTATION[competency.id];
          const Icon = presentation.icon;
          return (
            <button key={competency.id} type="button" onClick={() => setSelectedId(competency.id)} aria-pressed={selectedId === competency.id} aria-controls="competency-evidence" className={cn("rounded-lg border border-border p-4 text-start transition-colors hover:bg-white/[0.025] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary", selectedId === competency.id && presentation.active)}>
              <span className="flex items-center justify-between gap-3"><Icon aria-hidden="true" className={cn("size-4", presentation.color)} /><span className="font-mono text-[9px] text-muted">{competency.completed}/{competency.total} gates</span></span>
              <span className="mt-4 flex items-end justify-between gap-3"><span className="text-xs font-medium">{competency.label}</span><span className={cn("font-mono text-2xl tabular", presentation.color)}>{competency.completed ? competency.score : "—"}<span className="ms-1 text-[9px] text-muted">/100</span></span></span>
              <span aria-hidden="true" className="mt-3 block h-1 overflow-hidden rounded-full bg-white/[0.06]"><span className={cn("block h-full rounded-full", presentation.fill)} style={{ width: `${competency.score}%` }} /></span>
              <span className="mt-3 block text-[10px] leading-5 text-muted">{competency.description}</span>
            </button>
          );
        })}
      </div>
      <div id="competency-evidence" className="border-t border-border bg-background/35 px-4 py-5 sm:px-5" aria-live="polite">
        <div className="mb-4 flex flex-wrap items-center gap-2"><h3 className="text-xs font-medium">{selected.label} · decision evidence</h3><span className="text-[10px] text-muted">Select a dimension above to inspect its gates.</span></div>
        <div className="grid gap-3">
          {selected.decisions.map((decision) => (
            <article key={decision.decisionId} className="grid gap-4 rounded-lg border border-border bg-panel p-4 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
              <div><div className="flex items-center justify-between gap-3"><h4 className="text-[11px] font-medium">{decision.title}</h4><StatusPill tone={decision.score === 100 ? "success" : decision.score === null ? "neutral" : decision.score === 0 ? "danger" : "warning"}>{decision.score === null ? "Unattempted" : `${decision.score}/100`}</StatusPill></div><p className="mt-3 text-[10px] leading-5 text-muted"><span className="text-foreground">Your decision:</span> {decision.selectedLabel ?? "No choice recorded"}</p><p className="mt-2 text-[10px] leading-5 text-muted">{decision.rationale}</p></div>
              <div className="rounded-md border border-primary/10 bg-primary/[0.025] p-3"><p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-primary">{decision.score === 100 ? <Check aria-hidden="true" className="size-3" /> : <BookOpen aria-hidden="true" className="size-3" />}{decision.score === 100 ? "Reference choice matched" : "Practice this next"}</p><p className="mt-2 text-[11px] font-medium">{decision.recommendedLabel}</p><p className="mt-2 text-[10px] leading-5 text-muted">{decision.exercise}</p><code className="mt-3 block break-all border-t border-primary/10 pt-3 font-mono text-[8px] leading-4 text-signal">{decision.recommendedCommand}</code></div>
            </article>
          ))}
        </div>
      </div>
      <details className="group border-t border-border">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-[11px] font-medium focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary">How these scores are calculated<span className="ms-auto font-mono text-[8px] text-muted">RUBRIC {assessment.rubricVersion}</span><ChevronDown aria-hidden="true" className="size-3.5 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary>
        <div className="space-y-4 px-5 pb-5 text-[10px] leading-6 text-muted">
          <p>Each gate uses the authored scenario points: <span className="text-foreground">100 × (chosen points − lowest points) ÷ (highest points − lowest points)</span>. Dimensions average their named gates. Each gate has equal weight in overall decision quality; an unattempted gate contributes zero and stays marked unattempted.</p>
          <div className="overflow-x-auto rounded-md border border-border"><table className="w-full min-w-[420px] text-start"><caption className="sr-only">Scenario point ranges used to normalize each decision gate</caption><thead className="bg-panel-soft"><tr><th scope="col" className="px-3 py-2 text-start font-medium text-foreground">Decision gate</th><th scope="col" className="px-3 py-2 text-end font-medium text-foreground">Lowest</th><th scope="col" className="px-3 py-2 text-end font-medium text-foreground">Highest</th></tr></thead><tbody>{LAB_DECISIONS.map((decision) => <tr key={decision.id} className="border-t border-border"><th scope="row" className="px-3 py-2 text-start font-normal">{decision.title}</th><td className="px-3 py-2 text-end font-mono">{Math.min(...decision.choices.map((choice) => choice.scoreDelta))}</td><td className="px-3 py-2 text-end font-mono">{Math.max(...decision.choices.map((choice) => choice.scoreDelta))}</td></tr>)}</tbody></table></div>
          <p>Command score = <span className="text-foreground">50% final modeled health + 30% exact reference-choice match + 20% mean gate quality</span>. The first valid choice at each gate is used; labels, verdicts, and points are re-read from this rubric.</p>
          <p>Grade thresholds: S ≥ 90, A ≥ 78, B ≥ 64, C ≥ 48, otherwise D. A sovereign strategy additionally requires all six decisions and a sustained traffic guard. Grades describe scenario performance, not complete service recovery.</p>
          <p>This educational exercise measures choices in one synthetic scenario. It does not measure wall-clock decision speed, certify professional ability, or rank you against other responders.</p>
        </div>
      </details>
    </section>
  );
}

export function LabOutcomeReview({ result }: { result: LabIncidentResult }) {
  const gradientId = useId();
  const { baseline, run, timeline } = result.comparison;
  const plot = { left: 36, top: 14, width: 724, height: 164 };
  const point = (elapsed: number, health: number) => `${(plot.left + elapsed / LAB_TOTAL_SECONDS * plot.width).toFixed(1)},${(plot.top + (100 - health) / 100 * plot.height).toFixed(1)}`;
  const runPath = timeline.map((value) => point(value.elapsed, value.runHealth)).join(" ");
  const baselinePath = timeline.map((value) => point(value.elapsed, value.baselineHealth)).join(" ");
  const last = timeline[timeline.length - 1];
  const comparisonRows = [
    { label: "Modeled revenue lost", before: `$${baseline.revenueLost.toLocaleString("en-US")}`, after: `$${run.revenueLost.toLocaleString("en-US")}`, improved: run.revenueLost < baseline.revenueLost },
    { label: "Peak affected users", before: baseline.peakAffectedUsers.toLocaleString("en-US"), after: run.peakAffectedUsers.toLocaleString("en-US"), improved: run.peakAffectedUsers < baseline.peakAffectedUsers },
    { label: "Final p95 latency", before: `${baseline.latency.toLocaleString("en-US")} ms`, after: `${run.latency.toLocaleString("en-US")} ms`, improved: run.latency < baseline.latency },
  ];
  return (
    <section className="panel mt-4 overflow-hidden" aria-labelledby="outcome-title">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4"><span className="grid size-8 place-items-center rounded-md border border-signal/20 bg-signal/[0.04] text-signal"><GitCompareArrows aria-hidden="true" className="size-4" /></span><div><h2 id="outcome-title" className="text-xs font-medium">What your interventions changed</h2><p className="mt-1 text-[10px] text-muted">Same incident, same demand. Compare this run with no intervention.</p></div></div>
      <figure className="px-3 pb-3 pt-5 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center gap-4 font-mono text-[8px]"><span className="text-muted">SYSTEM HEALTH / 100</span><span className="ms-auto flex items-center gap-2 text-primary"><span aria-hidden="true" className="h-0.5 w-4 bg-primary" />Your run</span><span className="flex items-center gap-2 text-muted"><span aria-hidden="true" className="w-4 border-t border-dashed border-muted" />No intervention</span></div>
        <svg viewBox="0 0 786 209" role="img" aria-label={`Health comparison: your run ends at ${run.finalHealth} out of 100; no intervention ends at ${baseline.finalHealth} out of 100.`} className="h-auto w-full overflow-visible">
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity=".15" /><stop offset="100%" stopColor="var(--primary)" stopOpacity="0" /></linearGradient></defs>
          {[0, 25, 50, 75, 100].map((value) => <g key={value}><line x1={plot.left} x2={plot.left + plot.width} y1={plot.top + (100 - value) / 100 * plot.height} y2={plot.top + (100 - value) / 100 * plot.height} stroke="currentColor" className="text-border" /><text x="25" y={plot.top + (100 - value) / 100 * plot.height + 3} textAnchor="end" fontSize="8" fill="currentColor" className="text-muted">{value}</text></g>)}
          {LAB_DECISIONS.map((decision, index) => <g key={decision.id}><line x1={plot.left + decision.triggerAt / LAB_TOTAL_SECONDS * plot.width} x2={plot.left + decision.triggerAt / LAB_TOTAL_SECONDS * plot.width} y1={plot.top} y2={plot.top + plot.height} stroke="currentColor" strokeDasharray="2 5" className="text-white/10" /><text x={plot.left + decision.triggerAt / LAB_TOTAL_SECONDS * plot.width} y="198" textAnchor="middle" fontSize="8" fill="currentColor" className="text-muted">{String(index + 1).padStart(2, "0")}</text></g>)}
          <polygon points={`${point(0, 0)} ${runPath} ${point(last?.elapsed ?? LAB_TOTAL_SECONDS, 0)}`} fill={`url(#${gradientId})`} />
          <polyline points={baselinePath} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" className="text-muted/70" />
          <polyline points={runPath} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" className="text-primary" />
          {last && <circle cx={plot.left + last.elapsed / LAB_TOTAL_SECONDS * plot.width} cy={plot.top + (100 - last.runHealth) / 100 * plot.height} r="3.5" fill="currentColor" className="text-primary" />}
        </svg>
        <figcaption className="flex flex-wrap justify-between gap-2 font-mono text-[8px] leading-5 text-muted"><span>01–06 mark the scheduled decision gates.</span><span>T+00:00 → T+{formatLabTime(last?.elapsed ?? LAB_TOTAL_SECONDS)}</span></figcaption>
      </figure>
      <div className="grid gap-px border-y border-border bg-border sm:grid-cols-3">{comparisonRows.map((row) => <div key={row.label} className="bg-panel p-5"><p className="font-mono text-[8px] text-muted">{row.label}</p><div className="mt-3 flex items-center gap-3"><span className="font-mono text-[11px] text-muted">{row.before}</span>{row.improved ? <ArrowDownRight aria-hidden="true" className="size-4 shrink-0 text-primary" /> : <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-warning" />}<span className={cn("font-mono text-lg tabular", row.improved ? "text-primary" : "text-warning")}>{row.after}</span></div><p className="mt-2 text-[9px] text-muted">No intervention → your run</p></div>)}</div>
      <div className="grid gap-4 bg-panel-soft/40 p-5 sm:grid-cols-2"><div><p className="text-[10px] font-medium">{result.trafficGuardMet ? `Traffic guard held for ${LAB_RECOVERY_HOLD_SECONDS}+ modeled seconds` : "Traffic guard was not sustained"}</p><p className="mt-2 text-[10px] leading-5 text-muted">p95 ≤ 800ms · pool ≤ 1,260 · cache hits ≥ 90%. All six gates must be completed. Confirmation follows a 30-second hold.</p><p className={cn("mt-3 rounded-md border px-3 py-2 font-mono text-[9px] leading-5", result.errorObjectiveMet ? "border-success/20 bg-success/[0.04] text-success" : "border-warning/20 bg-warning/[0.04] text-warning")}>Residual errors: {run.errorRate}% / 1% objective<br />{result.errorObjectiveMet ? "Error objective met" : "Error objective not met · keep recovery open"}</p></div><p className="text-[10px] leading-5 text-muted">Both paths replay the same deterministic scenario at one-second intervals. Revenue and affected-user estimates are synthetic. The traffic guard and residual errors are assessed separately: a high decision score does not imply complete customer recovery.</p></div>
    </section>
  );
}
