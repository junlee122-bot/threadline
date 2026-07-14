"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChartNoAxesCombined,
  GitPullRequest,
  LayoutDashboard,
  Map,
  RadioTower,
  Siren,
} from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Command", href: "/command", icon: LayoutDashboard },
  { label: "System map", href: "/map", icon: Map },
  { label: "Changes", href: "/changes", icon: GitPullRequest },
  { label: "Incidents", href: "/incidents", icon: Siren },
  { label: "Agent runs", href: "/agents", icon: Bot },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[232px] border-e border-border bg-[#090d0f]/96 px-3 py-4 backdrop-blur md:flex md:flex-col">
        <div className="px-2 pb-6">
          <Wordmark href="/command" />
        </div>
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="eyebrow">Workspace</span>
          <span className="size-1.5 rounded-full bg-success" aria-label="Workspace connected" />
        </div>
        <div className="mb-5 flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-panel-soft px-3 text-start text-sm">
          <span className="grid size-7 place-items-center rounded-md bg-primary/10 font-mono text-[10px] font-bold text-primary">
            MM
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">Meridian Market</span>
            <span className="block truncate text-[10px] text-muted">Demo workspace</span>
          </span>
          <span className="font-mono text-[8px] text-success">DEMO</span>
        </div>

        <nav aria-label="Product navigation" className="space-y-1">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== "/command" && pathname.startsWith(item.href.split("/").slice(0, 2).join("/")));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-10 items-center gap-3 rounded-md px-3 text-[13px] text-muted transition-colors hover:bg-white/[0.035] hover:text-foreground",
                  active && "bg-white/[0.055] text-foreground",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("size-4", active ? "text-primary" : "text-muted group-hover:text-foreground")}
                  strokeWidth={1.7}
                />
                {item.label}
                {item.label === "Incidents" && (
                  <span className="ms-auto rounded-full bg-danger/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-danger">
                    1
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-border bg-panel-soft p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium">
            <RadioTower aria-hidden="true" className="size-3.5 text-success" />
            All sources streaming
          </div>
          <div className="flex items-center justify-between font-mono text-[9px] text-muted">
            <span>12 connectors</span>
            <span>updated 18s ago</span>
          </div>
        </div>
      </aside>

      <nav
        aria-label="Mobile product navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[68px] snap-x snap-mandatory items-stretch overflow-x-auto border-t border-border bg-[#090d0f]/96 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
      >
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href.split("/").slice(0, 2).join("/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-[64px] flex-1 snap-start flex-col items-center justify-center gap-1 rounded-md px-1 text-[9px] text-muted outline-none transition-colors focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                active && "text-primary",
              )}
            >
              <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.7} />
              {item.label === "Agent runs" ? "Agents" : item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
