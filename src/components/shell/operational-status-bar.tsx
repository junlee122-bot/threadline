"use client";

import { Activity, Flag, GitBranch } from "lucide-react";
import { EvidenceExplorer } from "@/components/evidence/evidence-explorer";
import { useLocale } from "@/components/i18n/locale-provider";

export function OperationalStatusBar() {
  const { t } = useLocale();
  return <section aria-label={t("Operational data context")} className="flex min-h-10 flex-wrap items-center gap-x-5 gap-y-1 border-b border-border bg-panel/60 px-4 py-1.5 sm:px-6">
    <span className="flex items-center gap-2 font-mono text-[9px] text-muted"><span className="size-1.5 rounded-full bg-inference" aria-hidden="true" /><span className="text-foreground">{t("Meridian sample dataset")}</span><span className="hidden sm:inline">14 JUL 2026 · UTC</span></span>
    <div className="hidden items-center gap-4 text-[10px] text-muted xl:flex"><span className="flex items-center gap-1.5"><GitBranch aria-hidden="true" className="size-3" />{t("Code")}</span><span className="flex items-center gap-1.5"><Flag aria-hidden="true" className="size-3 text-warning" />{t("Rollouts")}</span><span className="flex items-center gap-1.5"><Activity aria-hidden="true" className="size-3 text-signal" />{t("Telemetry")}</span></div>
    <div className="ms-auto"><EvidenceExplorer label="7 source records" compact /></div>
  </section>;
}
