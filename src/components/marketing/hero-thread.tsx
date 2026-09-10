"use client";

import { Activity, Bot, Flag, GitPullRequest, RadioTower } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";

const nodes = [
  { label: "PR #1842", sub: "+ retry policy", icon: GitPullRequest, tone: "text-signal" },
  { label: "deploy 2.18.0", sub: "production", icon: RadioTower, tone: "text-primary" },
  { label: "instant-tax-v2", sub: "50% → 100%", icon: Flag, tone: "text-warning" },
  { label: "checkout-api", sub: "p95 +171%", icon: Activity, tone: "text-danger" },
  { label: "safe rollback", sub: "awaiting approval", icon: Bot, tone: "text-inference" },
];

export function HeroThread() {
  const { t } = useLocale();
  return (
    <div className="relative overflow-hidden rounded-xl border border-border-strong bg-[#0b1013] shadow-[0_40px_120px_rgba(0,0,0,.42)]">
      <div className="flex h-12 items-center border-b border-border px-4 sm:px-5">
        <div className="flex gap-1.5" aria-hidden="true"><span className="size-2 rounded-full bg-danger/70" /><span className="size-2 rounded-full bg-warning/70" /><span className="size-2 rounded-full bg-success/70" /></div>
        <p className="ms-4 font-mono text-[9px] text-muted">threadline / incident / INC-2471</p>
        <div className="ms-auto flex items-center gap-2 font-mono text-[9px] text-success"><span className="live-dot size-1.5 rounded-full bg-success text-success" />{t("DEMO")}</div>
      </div>
      <div className="grid min-h-[480px] lg:grid-cols-[1fr_300px]">
        <div className="relative overflow-hidden border-b border-border p-5 sm:p-8 lg:border-b-0 lg:border-e">
          <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">{t("Leading explanation")}</p>
              <h2 className="mt-2 max-w-xl text-balance text-xl font-medium tracking-[-0.025em] sm:text-2xl">{t("The flag rollout is the strongest shared change.")}</h2>
              <p className="mt-2 text-xs leading-5 text-muted">{t("Code, deployment, trace, and business signals agree. Third-party latency remains plausible.")}</p>
            </div>
            <span className="hidden rounded-full border border-success/20 bg-success/[0.07] px-2.5 py-1 font-mono text-[9px] text-success sm:block">{t("WORKING HYPOTHESIS")}</span>
          </div>
          <div className="relative mt-12 hidden min-h-[210px] items-center justify-between md:flex">
            <svg aria-hidden="true" className="absolute inset-x-8 top-[81px] h-20 w-[calc(100%-4rem)]" viewBox="0 0 800 80" preserveAspectRatio="none">
              <path d="M0 40 C85 40 100 40 175 40 S260 40 350 40 S440 40 530 40 S620 40 800 40" fill="none" stroke="rgba(184,246,106,.45)" strokeWidth="1.5" className="thread-path" />
            </svg>
            {nodes.map((node, index) => {
              const Icon = node.icon;
              return (
                <div key={node.label} className="relative z-10 flex w-[118px] flex-col items-center text-center">
                  <span className={`grid size-11 place-items-center rounded-full border border-border-strong bg-panel-elevated ${node.tone}`}>
                    <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
                  </span>
                  <p className="mt-3 font-mono text-[10px] font-medium text-foreground">{t(node.label)}</p>
                  <p className="mt-1 font-mono text-[8px] text-muted">{t(node.sub)}</p>
                  <span className="mt-3 font-mono text-[8px] text-muted">09:{12 + index * 4}</span>
                </div>
              );
            })}
          </div>
          <ol className="relative mt-8 space-y-3 md:hidden">
            {nodes.map((node, index) => {
              const Icon = node.icon;
              return (
                <li key={node.label} className="flex items-center gap-3 rounded-lg border border-border bg-panel-soft p-3">
                  <span className={`grid size-8 place-items-center rounded-md bg-panel-elevated ${node.tone}`}><Icon aria-hidden="true" className="size-4" /></span>
                  <span><span className="block font-mono text-[10px]">{t(node.label)}</span><span className="block text-[9px] text-muted">{t(node.sub)}</span></span>
                  <span className="ms-auto font-mono text-[8px] text-muted">09:{12 + index * 4}</span>
                </li>
              );
            })}
          </ol>
          <div className="relative mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-4 font-mono text-[8px] text-muted">
            <span className="flex items-center gap-1.5"><span className="h-px w-5 bg-primary" />{t("Observed")}</span>
            <span className="flex items-center gap-1.5"><span className="w-5 border-t border-dashed border-inference" />{t("Inferred")}</span>
            <span className="ms-auto">{t("7 evidence items · recorded sample")}</span>
          </div>
        </div>
        <aside className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><p className="eyebrow">{t("Customer impact")}</p><span className="font-mono text-[9px] text-danger">SEV-2</span></div>
          <p className="mt-5 font-mono text-4xl font-medium tracking-[-0.06em] text-foreground">−7.3%</p>
          <p className="mt-1 text-xs text-muted">{t("checkout conversion")}</p>
          <div className="mt-5 h-20">
            <svg viewBox="0 0 260 80" className="h-full w-full" role="img" aria-label="Conversion falls after 09:18">
              <path d="M0 16 C20 15 28 18 45 17 S78 15 96 19 S128 17 145 23 S166 38 184 45 S215 58 260 65" fill="none" stroke="var(--danger)" strokeWidth="2" />
              <path d="M0 16 C20 15 28 18 45 17 S78 15 96 19 S128 17 145 23 S166 38 184 45 S215 58 260 65 L260 80 L0 80Z" fill="url(#impact-fill)" />
              <defs><linearGradient id="impact-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--danger)" stopOpacity=".18"/><stop offset="1" stopColor="var(--danger)" stopOpacity="0"/></linearGradient></defs>
            </svg>
          </div>
          <div className="mt-5 space-y-3 border-t border-border pt-5">
            {[['p95 latency','1.84 s','+171%'],['Error rate','4.9%','+4.2 pp'],['Revenue impact','−$12.4k','per hour']].map(([label,value,change]) => (
              <div key={label} className="flex items-center justify-between gap-3"><span className="text-[10px] text-muted">{t(label)}</span><span className="ms-auto font-mono text-[10px] text-foreground">{value}</span><span className="w-12 text-end font-mono text-[8px] text-danger">{t(change)}</span></div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-inference/15 bg-inference/[0.045] p-3">
            <p className="flex items-center gap-2 text-[10px] font-medium"><Bot aria-hidden="true" className="size-3.5 text-inference" />{t("Proposed action")}</p>
            <p className="mt-2 text-[10px] leading-5 text-muted">{t("Disable instant-tax-v2, then watch p95 for 5 minutes.")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
