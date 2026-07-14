import Link from "next/link";
import { cn } from "@/lib/utils";

type WordmarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function Mark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid size-7 shrink-0 place-items-center rounded-[7px] border border-primary/25 bg-primary/[0.06]",
        className,
      )}
    >
      <svg viewBox="0 0 28 28" className="size-full" fill="none">
        <path
          d="M5.5 7.25h5.1c1.9 0 2.8 1.2 3.4 2.75.62 1.57 1.53 2.75 3.42 2.75H22.5"
          stroke="currentColor"
          strokeWidth="1.4"
          className="text-primary"
        />
        <path
          d="M5.5 20.75h5.1c1.9 0 2.8-1.2 3.4-2.75.62-1.57 1.53-2.75 3.42-2.75H22.5"
          stroke="currentColor"
          strokeWidth="1.4"
          className="text-signal"
        />
        <circle cx="5.5" cy="7.25" r="1.65" fill="currentColor" className="text-primary" />
        <circle cx="5.5" cy="20.75" r="1.65" fill="currentColor" className="text-signal" />
        <circle cx="22.5" cy="14" r="2.15" fill="currentColor" className="text-foreground" />
      </svg>
    </span>
  );
}

export function Wordmark({ href = "/", compact = false, className }: WordmarkProps) {
  return (
    <Link
      href={href}
      aria-label="Threadline home"
      className={cn("inline-flex items-center gap-2.5 text-foreground", className)}
    >
      <Mark />
      {!compact && (
        <span className="text-[0.82rem] font-semibold tracking-[0.16em]">THREADLINE</span>
      )}
    </Link>
  );
}
