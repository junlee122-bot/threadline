"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  return <div className={cn("inline-flex h-9 items-center rounded-md border border-border bg-panel-soft p-0.5", className)} role="group" aria-label={t("Language selection")}>
    <Languages aria-hidden="true" className="ms-2 size-3.5 text-muted" />
    <button type="button" lang="en" aria-pressed={locale === "en"} onClick={() => setLocale("en")} className={cn("ms-1 h-7 rounded px-2 font-mono text-[9px] transition-colors", locale === "en" ? "bg-panel-elevated text-foreground shadow-sm" : "text-muted hover:text-foreground")}>EN</button>
    <button type="button" lang="ko" aria-pressed={locale === "ko"} onClick={() => setLocale("ko")} className={cn("h-7 rounded px-2 text-[10px] transition-colors", locale === "ko" ? "bg-panel-elevated text-foreground shadow-sm" : "text-muted hover:text-foreground")}>한</button>
  </div>;
}
