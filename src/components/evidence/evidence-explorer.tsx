"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Database, FileSearch, Fingerprint, Search, X } from "lucide-react";
import { evidence } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocale } from "@/components/i18n/locale-provider";

export function EvidenceExplorer({ label = "Explore evidence", initialId = "ev-trace-tax-7f91", compact = false }: { label?: string; initialId?: string; compact?: boolean }) {
  const { t } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = evidence.find((item) => item.id === selectedId) ?? evidence[0];
  const matches = evidence.filter((item) => `${item.title} ${item.source} ${item.summary} ${t(item.title)} ${t(item.summary)}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <>
    <button type="button" onClick={() => { setSelectedId(initialId); dialog.current?.showModal(); }} className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-panel-soft px-3.5 text-xs text-foreground transition-colors hover:border-signal/35 hover:bg-signal/[0.05]", compact && "min-h-7 rounded-md border-0 bg-transparent px-1 text-[10px]")}>
      <FileSearch aria-hidden="true" className="size-3.5 text-signal" />{t(label)}{compact && <ArrowUpRight aria-hidden="true" className="size-3" />}
    </button>
    <dialog ref={dialog} aria-label={t("Evidence library")} className="m-auto max-h-[88dvh] w-[min(960px,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-border-strong bg-panel p-0 text-foreground shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-md">
      <header className="flex items-center gap-3 border-b border-border p-5 sm:px-6">
        <span className="grid size-10 place-items-center rounded-xl border border-signal/20 bg-signal/[0.06] text-signal"><Database aria-hidden="true" className="size-5" /></span>
        <div><p className="eyebrow text-signal">{t("Evidence library")} · INC-2471</p><h2 className="mt-1 text-lg font-medium tracking-tight">{t("Inspect the source behind the signal.")}</h2></div>
        <button type="button" onClick={() => dialog.current?.close()} aria-label={t("Close evidence library")} className="ms-auto grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-white/5"><X aria-hidden="true" className="size-4" /></button>
      </header>
      <div className="grid md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="border-b border-border bg-background/40 md:border-e md:border-b-0">
          <label className="m-4 flex items-center gap-2 rounded-lg border border-border bg-panel px-3"><Search aria-hidden="true" className="size-3.5 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 min-w-0 w-full bg-transparent text-xs outline-none" placeholder={t("Filter sources or signals…")} aria-label={t("Filter evidence")} /></label>
          <div className="max-h-[220px] space-y-1 overflow-y-auto px-3 pb-4 md:max-h-[480px]" aria-label={t("Evidence objects")}>
            {matches.map((item, index) => <button key={item.id} type="button" aria-pressed={item.id === selectedId} onClick={() => setSelectedId(item.id)} className={cn("flex w-full gap-3 rounded-lg border border-transparent p-3 text-start transition-colors hover:bg-white/[0.035]", item.id === selectedId && "border-signal/20 bg-signal/[0.055]")}><span className="mt-0.5 font-mono text-[9px] text-muted">{String(index + 1).padStart(2, "0")}</span><span><span className="block font-mono text-[8px] uppercase tracking-wider text-signal">{item.source}</span><span className="mt-1 block text-xs leading-5">{t(item.title)}</span></span></button>)}
            {matches.length === 0 && <p role="status" className="p-5 text-xs leading-5 text-muted">{t("No evidence matches this filter. Try “trace”, “flag”, or “checkout”.")}</p>}
          </div>
        </div>
        <article className="min-w-0 p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-wrap gap-2"><StatusPill tone="signal">{t("Source record")}</StatusPill><StatusPill>{t("Sample dataset")}</StatusPill><time className="ms-auto self-center font-mono text-[9px] text-muted">{selected.timestamp.slice(11, 19)} UTC</time></div>
          <h3 className="mt-5 text-xl font-medium leading-7 tracking-tight">{t(selected.title)}</h3>
          <p className="mt-3 text-sm leading-6 text-muted">{t(selected.summary)}</p>
          <div className="mt-6 rounded-xl border border-border bg-background/60 p-4"><p className="eyebrow">{t("Recorded attributes")}</p><dl className="mt-3 divide-y divide-border">{Object.entries(selected.attributes).map(([key, value]) => <div key={key} className="flex flex-wrap justify-between gap-2 py-2.5 font-mono text-[10px]"><dt className="break-all text-muted">{key}</dt><dd className="break-all text-end text-foreground">{String(value)}</dd></div>)}</dl></div>
          <div className="mt-5 flex flex-wrap gap-2">{selected.serviceIds.map((id) => <span key={id} className="rounded-md border border-border px-2 py-1 font-mono text-[9px] text-muted">{id}</span>)}</div>
          <p className="mt-5 flex items-start gap-2 font-mono text-[9px] leading-5 text-muted"><Fingerprint aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-inference" /><span className="break-all">{selected.id}<span className="block font-sans text-[11px]">{t("This is an inspectable sample record. No external production source is connected.")}</span></span></p>
        </article>
      </div>
      <footer className="flex flex-wrap justify-between gap-2 border-t border-border bg-panel-soft px-6 py-3 font-mono text-[9px] text-muted"><span>{t("{count} source records · 14 Jul 2026", { count: evidence.length })}</span><span>{t("UTC timestamps · observed records ≠ proven causation")}</span></footer>
    </dialog>
  </>;
}
