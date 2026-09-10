"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChartNoAxesCombined,
  Gamepad2,
  GitPullRequest,
  LayoutDashboard,
  Map,
  RadioTower,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

type NavigationItem = { label: string; href: string; icon: LucideIcon };

export function AppNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const navigationGroups: ReadonlyArray<{ label: string; items: readonly NavigationItem[] }> = [
    { label: t("Operate"), items: [{ label: t("Command"), href: "/command", icon: LayoutDashboard }, { label: t("System map"), href: "/map", icon: Map }, { label: t("Changes"), href: "/changes", icon: GitPullRequest }, { label: t("Incidents"), href: "/incidents", icon: Siren }] },
    { label: t("Improve"), items: [{ label: t("Crisis Lab"), href: "/lab", icon: Gamepad2 }, { label: t("Agent runs"), href: "/agents", icon: Bot }, { label: t("Reports"), href: "/reports", icon: ChartNoAxesCombined }] },
  ];
  const navigation = navigationGroups.flatMap((group) => group.items);

  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[232px] border-e border-border bg-[#090d0f]/96 px-3 py-4 backdrop-blur md:flex md:flex-col">
        <div className="px-2 pb-6">
          <Wordmark href="/command" />
        </div>
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="eyebrow">{t("Workspace")}</span>
          <span className="size-1.5 rounded-full bg-inference" aria-label={t("Sample workspace available")} />
        </div>
        <div className="mb-5 flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-panel-soft px-3 text-start text-sm">
          <span className="grid size-7 place-items-center rounded-md bg-primary/10 font-mono text-[10px] font-bold text-primary">
            MM
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">Meridian Market</span>
            <span className="block truncate text-[10px] text-muted">{t("Demo workspace")}</span>
          </span>
          <span className="font-mono text-[8px] text-success">DEMO</span>
        </div>

        <nav aria-label={t("Product navigation")} className="space-y-5">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 font-mono text-[8px] font-medium uppercase tracking-[0.16em] text-muted/65">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/command" && pathname.startsWith(item.href.split("/").slice(0, 2).join("/")));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex min-h-10 items-center gap-3 rounded-md px-3 text-[13px] text-muted transition-colors hover:bg-white/[0.035] hover:text-foreground",
                        active && "bg-white/[0.055] text-foreground before:absolute before:inset-y-2 before:start-0 before:w-px before:rounded-full before:bg-primary before:shadow-[0_0_12px_rgba(184,246,106,.65)]",
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn("size-4", active ? "text-primary" : "text-muted group-hover:text-foreground")}
                        strokeWidth={1.7}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto overflow-hidden rounded-lg border border-border bg-panel-soft">
          <div className="grid grid-cols-4 gap-px border-b border-border bg-border" aria-label={t("Sample source categories")}>
            {["GH", "OT", "FF", "CX"].map((source, index) => (
              <span key={source} className="flex h-7 items-center justify-center gap-1 bg-panel-soft font-mono text-[7px] text-muted">
                <span className={cn("size-1 rounded-full", index === 3 ? "bg-inference" : "bg-success")} />{source}
              </span>
            ))}
          </div>
          <div className="p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium">
            <RadioTower aria-hidden="true" className="size-3.5 text-success" />
            {t("Evidence, ready to inspect")}
          </div>
          <div className="flex items-center justify-between font-mono text-[9px] text-muted">
            <span>{t("7 sample records")}</span><span className="text-inference">DEMO</span>
          </div>
          </div>
        </div>
      </aside>

      <nav
        aria-label={t("Mobile product navigation")}
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
              {item.href === "/agents" ? t("Agents") : item.href === "/lab" ? t("Lab") : item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
