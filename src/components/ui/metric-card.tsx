import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";

export function MetricCard({
  label,
  value,
  change,
  direction = "flat",
  detail,
  points,
  tone = "primary",
}: {
  label: string;
  value: string;
  change: string;
  direction?: "up" | "down" | "flat";
  detail?: string;
  points?: readonly (number | { value: number })[];
  tone?: "primary" | "danger" | "warning" | "success" | "signal" | "inference";
}) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const changeTone = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-muted";
  return (
    <article className="panel min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] text-muted sm:text-[11px]">{label}</p>
        <span className={`flex items-center gap-1 font-mono text-[8px] ${changeTone}`}>
          <Icon aria-hidden="true" className="size-3" />
          {change}
        </span>
      </div>
      <p className="mt-4 font-mono text-2xl font-medium tracking-[-0.045em] tabular sm:text-[1.7rem]">{value}</p>
      {points ? (
        <Sparkline points={points} label={`${label} trend`} tone={tone} className="mt-3" />
      ) : (
        <div className="mt-4 h-8" />
      )}
      {detail && <p className="mt-1 truncate font-mono text-[8px] text-muted">{detail}</p>}
    </article>
  );
}
