"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Point = number | { value: number };
type SparklineTone = "primary" | "danger" | "warning" | "success" | "signal" | "inference";

const colors: Record<SparklineTone, string> = {
  primary: "var(--primary, #b8f66a)",
  danger: "var(--danger, #ff7585)",
  warning: "var(--warning, #efbd62)",
  success: "var(--success, #65d6a4)",
  signal: "var(--cyan, #63d8ee)",
  inference: "var(--violet, #a99af8)",
};

function valuesFrom(points: readonly Point[]) {
  return points.map((point) => (typeof point === "number" ? point : point.value)).filter(Number.isFinite);
}

export function Sparkline({
  points,
  tone = "primary",
  className,
  label,
  fill = true,
}: {
  points: readonly Point[];
  tone?: SparklineTone;
  className?: string;
  label: string;
  fill?: boolean;
}) {
  const gradientId = `spark-${useId().replace(/:/g, "")}`;
  const values = valuesFrom(points);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = values.map((value, index) => {
    const x = values.length === 1 ? 50 : 2 + (index / (values.length - 1)) * 96;
    const y = max === min ? 20 : 36 - ((value - min) / range) * 30;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const area = `${line} L98 40 L2 40 Z`;
  const color = colors[tone];

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      role="img"
      aria-label={values.length ? label : `${label}: no data available`}
      className={cn("h-12 w-full overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {!values.length && <text x="50" y="24" textAnchor="middle" fill="var(--muted)" fontSize="7">No data</text>}
      {fill && values.length > 1 && <path d={area} fill={`url(#${gradientId})`} />}
      {values.length > 1 && <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
      {coords.length > 0 && (
        <circle cx={coords.at(-1)?.[0]} cy={coords.at(-1)?.[1]} r="1.8" fill={color} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}
