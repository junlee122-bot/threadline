"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, Bell, CheckCheck, GitPullRequest, ShieldAlert, X } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";

const items = [
  { id: "incident", icon: ShieldAlert, title: "Checkout needs an incident commander", description: "Review the 09:25 investigation snapshot and the proposed flag mitigation.", href: "/incidents/inc-2471", time: "09:25 UTC", tone: "text-danger" },
  { id: "review", icon: GitPullRequest, title: "A risky change is waiting for review", description: "Inspect the change queue, test coverage, and downstream dependencies.", href: "/changes", time: "09:24 UTC", tone: "text-warning" },
];

export function ActivityInbox() {
  const { t } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [read, setRead] = useState<string[]>([]);
  const unread = items.filter((item) => !read.includes(item.id)).length;
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} className="relative grid size-10 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-foreground" aria-label={t("Activity inbox, {count} unread", { count: unread })}><Bell aria-hidden="true" className="size-4" />{unread > 0 && <span className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-danger" />}</button>
    <dialog ref={dialog} aria-labelledby="activity-title" className="m-auto max-h-[85dvh] w-[min(520px,calc(100%-2rem))] overflow-auto rounded-2xl border border-border-strong bg-panel p-0 text-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-md">
      <header className="flex items-center gap-3 border-b border-border p-5"><Bell aria-hidden="true" className="size-5 text-primary" /><div><h2 id="activity-title" className="font-medium">{t("Workspace inbox")}</h2><p className="mt-1 text-[11px] text-muted">{t("Sample activity · {count} unread", { count: unread })}</p></div><button type="button" aria-label={t("Close activity inbox")} onClick={() => dialog.current?.close()} className="ms-auto grid size-10 place-items-center rounded-lg hover:bg-white/5"><X aria-hidden="true" className="size-4" /></button></header>
      <div className="divide-y divide-border">{items.map(({ icon: Icon, ...item }) => <Link key={item.id} href={item.href} onClick={() => { setRead((current) => [...new Set([...current, item.id])]); dialog.current?.close(); }} className="group flex gap-4 p-5 hover:bg-white/[0.025]"><span className={`mt-0.5 ${item.tone}`}><Icon aria-hidden="true" className="size-5" /></span><span><span className="flex items-center gap-2 text-sm font-medium">{t(item.title)}{!read.includes(item.id) && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}</span><span className="mt-2 block text-xs leading-5 text-muted">{t(item.description)}</span><span className="mt-3 block font-mono text-[9px] text-muted">{item.time}</span></span><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted group-hover:text-primary" /></Link>)}</div>
      <footer className="border-t border-border p-3"><button type="button" disabled={unread === 0} onClick={() => setRead(items.map((item) => item.id))} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-xs text-primary hover:bg-primary/5 disabled:text-muted"><CheckCheck aria-hidden="true" className="size-4" />{unread === 0 ? t("You're all caught up") : t("Mark all as read")}</button></footer>
    </dialog>
  </>;
}
