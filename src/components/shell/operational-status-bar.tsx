import Link from "next/link";
import { Activity, ArrowUpRight, Database, Flag, GitBranch, Radio, ShoppingCart } from "lucide-react";

const sources = [
  { label: "GitHub", freshness: "8s", icon: GitBranch, tone: "text-foreground" },
  { label: "Telemetry", freshness: "live", icon: Activity, tone: "text-signal" },
  { label: "Flags", freshness: "12s", icon: Flag, tone: "text-warning" },
  { label: "Commerce", freshness: "2m", icon: ShoppingCart, tone: "text-inference" },
] as const;

export function OperationalStatusBar() {
  return (
    <section
      aria-label="Operational data status"
      className="data-stream relative hidden min-h-9 items-center gap-4 overflow-hidden border-b border-border bg-[#0a0f11]/88 px-4 text-[9px] backdrop-blur-xl sm:flex sm:px-6"
    >
      <div className="flex shrink-0 items-center gap-2">
        <span className="live-dot size-1.5 rounded-full bg-success text-success" aria-hidden="true" />
        <span className="font-medium text-foreground">Evidence plane healthy</span>
        <span className="font-mono text-success">99.98%</span>
      </div>

      <span className="hidden h-3 w-px bg-border lg:block" aria-hidden="true" />

      <ul className="hidden min-w-0 items-center gap-4 lg:flex" aria-label="Connected source freshness">
        {sources.map(({ label, freshness, icon: Icon, tone }) => (
          <li key={label} className="flex items-center gap-1.5 whitespace-nowrap text-muted">
            <Icon aria-hidden="true" className={`size-3 ${tone}`} strokeWidth={1.7} />
            <span>{label}</span>
            <span className="font-mono text-[8px] text-foreground/70">{freshness}</span>
          </li>
        ))}
      </ul>

      <div className="ms-auto flex shrink-0 items-center gap-3">
        <span className="hidden items-center gap-1.5 font-mono text-[8px] text-muted xl:flex">
          <Database aria-hidden="true" className="size-3" />
          snapshot 09:32:18 KST
        </span>
        <Link
          href="/incidents/inc-2471"
          className="group inline-flex min-h-6 items-center gap-2 rounded-full border border-danger/20 bg-danger/[0.055] px-2.5 font-mono text-[8px] text-danger transition-colors hover:border-danger/35 hover:bg-danger/[0.09]"
        >
          <Radio aria-hidden="true" className="size-3" />
          <span className="hidden md:inline">INC-2471 · bridge open</span>
          <span className="md:hidden">SEV-2 · 24m</span>
          <ArrowUpRight aria-hidden="true" className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
