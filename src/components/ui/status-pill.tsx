import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "signal" | "inference" | "primary";

const tones: Record<Tone, string> = {
  neutral: "border-border bg-white/[0.035] text-muted",
  success: "border-success/20 bg-success/[0.07] text-success",
  warning: "border-warning/20 bg-warning/[0.07] text-warning",
  danger: "border-danger/20 bg-danger/[0.07] text-danger",
  signal: "border-signal/20 bg-signal/[0.07] text-signal",
  inference: "border-inference/20 bg-inference/[0.07] text-inference",
  primary: "border-primary/20 bg-primary/[0.07] text-primary",
};

export function StatusPill({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-medium tracking-[0.02em]",
        tones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
