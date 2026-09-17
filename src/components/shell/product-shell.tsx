import Link from "next/link";
import { Bell, CircleHelp, Radio } from "lucide-react";
import { AppNav } from "@/components/shell/app-nav";
import { CommandMenu } from "@/components/shell/command-menu";

export function ProductShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="min-h-screen md:ps-[232px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/88 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden text-xs font-medium lg:inline">Meridian Market</span>
            <span className="hidden text-muted lg:inline">/</span>
            <span className="flex h-8 items-center gap-2 rounded-md border border-border bg-panel-soft px-2.5 font-mono text-[10px] text-muted">
              <span className="size-1.5 rounded-full bg-success" />
              Production
            </span>
            <span className="hidden items-center gap-1.5 font-mono text-[10px] text-success xl:flex">
              <Radio aria-hidden="true" className="size-3" />
              Live
            </span>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <CommandMenu />
            <Link href="https://github.com/junlee122-bot/threadline#readme" className="hidden size-9 place-items-center rounded-md text-muted hover:bg-white/[0.04] hover:text-foreground sm:grid" aria-label="Open Threadline documentation">
              <CircleHelp aria-hidden="true" className="size-4" />
            </Link>
            <span className="relative grid size-9 place-items-center rounded-md text-muted" aria-label="Notifications, 2 unread" role="img">
              <Bell aria-hidden="true" className="size-4" />
              <span className="absolute end-2 top-2 size-1.5 rounded-full bg-danger" />
            </span>
            <span className="grid size-8 place-items-center rounded-full border border-primary/20 bg-primary/10 font-mono text-[9px] font-semibold text-primary" aria-label="Demo profile: Jun Lee" role="img">
              JL
            </span>
          </div>
        </header>
        <main id="main-content" className="min-h-[calc(100vh-3.5rem)] pb-24 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
