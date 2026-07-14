"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  ChartNoAxesCombined,
  GitPullRequest,
  LayoutDashboard,
  Map,
  Search,
  Siren,
} from "lucide-react";

const commands = [
  { label: "Open Command Center", detail: "Workspace overview", href: "/command", icon: LayoutDashboard, keywords: "home pulse" },
  { label: "Inspect system map", detail: "8 services · 12 dependencies", href: "/map", icon: Map, keywords: "topology service" },
  { label: "Review risky changes", detail: "3 need attention", href: "/changes", icon: GitPullRequest, keywords: "pull request deploy" },
  { label: "Open INC-2471", detail: "Checkout latency elevated", href: "/incidents/inc-2471", icon: Siren, keywords: "incident sev2 checkout" },
  { label: "View agent mission control", detail: "2 active runs", href: "/agents", icon: Bot, keywords: "ai runs approval" },
  { label: "Open weekly report", detail: "Reliability & delivery", href: "/reports", icon: ChartNoAxesCombined, keywords: "dora slo" },
];

export function CommandMenu() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
    setQuery("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches("input, textarea, select, [contenteditable='true']");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) close(); else open();
      } else if (event.key === "/" && !isTyping) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.detail} ${command.keywords}`.toLowerCase().includes(needle),
    );
  }, [query]);

  const navigate = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="group flex h-9 min-w-0 items-center gap-2 rounded-md border border-border bg-panel-soft px-3 text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground sm:w-[260px]"
        aria-label="Open command menu"
      >
        <Search aria-hidden="true" className="size-3.5" />
        <span className="hidden truncate sm:inline">Search or ask Threadline…</span>
        <kbd className="ms-auto hidden rounded border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted sm:inline">
          ⌘ K
        </kbd>
      </button>
      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        onClose={() => setQuery("")}
        className="m-auto w-[min(620px,calc(100%-2rem))] overflow-hidden rounded-xl border border-border-strong bg-[#0d1215] p-0 text-foreground shadow-[0_32px_120px_rgba(0,0,0,.65)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        aria-label="Command menu"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search aria-hidden="true" className="size-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => results.length ? (index + 1) % results.length : 0);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => results.length ? (index - 1 + results.length) % results.length : 0);
              } else if (event.key === "Enter" && results[activeIndex]) {
                event.preventDefault();
                navigate(results[activeIndex].href);
              }
            }}
            className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            placeholder="Search services, incidents, commits—or ask a question…"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={results[activeIndex] ? `command-${activeIndex}` : undefined}
          />
          <button
            type="button"
            onClick={close}
            className="rounded border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted hover:text-foreground"
          >
            ESC
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          <p className="eyebrow px-2 pb-2 pt-1">Navigate</p>
          <div id="command-results" role={results.length ? "listbox" : undefined} aria-label={results.length ? "Command results" : undefined}>
          {results.length ? (
            results.map((command, index) => {
              const Icon = command.icon;
              return (
                <button
                  type="button"
                  key={command.href}
                  id={`command-${index}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={activeIndex === index}
                  onClick={() => navigate(command.href)}
                  onPointerMove={() => setActiveIndex(index)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-start transition-colors hover:bg-white/[0.055] focus:bg-white/[0.055] ${activeIndex === index ? "bg-white/[0.055]" : ""}`}
                >
                  <span className="grid size-8 place-items-center rounded-md border border-border bg-panel-elevated">
                    <Icon aria-hidden="true" className="size-4 text-primary" strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{command.label}</span>
                    <span className="block truncate text-[11px] text-muted">{command.detail}</span>
                  </span>
                  <span aria-hidden="true" className="font-mono text-xs text-muted">↵</span>
                </button>
              );
            })
          ) : (
            <div role="status" className="px-3 py-12 text-center">
              <p className="text-sm font-medium">No matching entities</p>
              <p className="mt-1 text-xs text-muted">Try a service name, commit SHA, or a wider phrase.</p>
            </div>
          )}
          </div>
        </div>
        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 font-mono text-[9px] text-muted">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>esc close</span>
          <span className="ms-auto text-primary">12 workspace sources</span>
        </div>
      </dialog>
    </>
  );
}
