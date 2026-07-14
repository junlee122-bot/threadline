import { cn } from "@/lib/utils";

type Point = number | { value: number };

function valuesFrom(points: readonly Point[]) {
  return points.map((point) => (typeof point === "number" ? point : point.value));
}

export function Sparkline({
  points,
  tone = "primary",
  className,
  label,
  fill = true,
}: {
  points: readonly Point[];
  tone?: "primary" | "danger" | "warning" | "success" | "signal" | "inference";
  className?: string;
  label: string;
  fill?: boolean;
}) {
  const values = valuesFrom(points);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
    const y = 36 - ((value - min) / range) * 30;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const area = `${line} L100 40 L0 40 Z`;
  const color = `var(--${tone === "primary" ? "primary" : tone})`;
  const gradientId = `spark-${tone}-${values.length}-${Math.round(values[0] ?? 0)}-${Math.round(values.at(-1) ?? 0)}`;

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn("h-12 w-full overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradientId})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {coords.length > 0 && (
        <circle cx={coords.at(-1)?.[0]} cy={coords.at(-1)?.[1]} r="1.8" fill={color} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}
