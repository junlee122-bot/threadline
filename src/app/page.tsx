import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  Gamepad2,
  GitCommitHorizontal,
  Github,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { HeroThread } from "@/components/marketing/hero-thread";

export const metadata: Metadata = {
  title: "Every signal, traced to source",
  description:
    "Threadline connects software operations with an evidence-backed command center and a playable incident training lab.",
};

const features = [
  {
    icon: Waypoints,
    label: "Causal thread",
    title: "See change as a connected story",
    copy: "Move from pull request to customer impact without stitching together six disconnected tools.",
  },
  {
    icon: Sparkles,
    label: "Evidence-native AI",
    title: "Every conclusion shows its work",
    copy: "Observed, inferred, and proposed signals stay distinct—with freshness, conflicts, and source links.",
  },
  {
    icon: ShieldCheck,
    label: "Safe operations",
    title: "Preview, approve, then verify",
    copy: "Agent actions expose target, blast radius, rollback plan, approver, and success criteria before they run.",
  },
  {
    icon: Gamepad2,
    label: "Crisis Lab",
    title: "Practice the failure before it is real",
    copy: "Command a deterministic eight-minute incident with six decisions, live system dynamics, and a scored after-action review.",
  },
];

const steps = [
  { time: "09:12", title: "Change ships", detail: "checkout-api@2.18.0 reaches production", icon: GitCommitHorizontal },
  { time: "09:21", title: "Runtime shifts", detail: "p95 latency rises from 680 ms to 1.84 s", icon: Activity },
  { time: "09:23", title: "Customers feel it", detail: "checkout conversion falls 7.3%", icon: RadioTower },
  { time: "09:31", title: "Team acts safely", detail: "flag rollback begins with human approval", icon: Bot },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden="true" className="technical-grid pointer-events-none absolute inset-x-0 top-0 h-[760px] opacity-70" />
      <div aria-hidden="true" className="pointer-events-none absolute start-1/2 top-[-28rem] size-[70rem] -translate-x-1/2 rounded-full border border-primary/[0.045]" />

      <header className="relative z-20 mx-auto flex h-20 max-w-[1240px] items-center px-5 sm:px-8">
        <Wordmark />
        <nav aria-label="Marketing navigation" className="ms-auto hidden items-center gap-7 text-xs text-muted md:flex">
          <a href="#product" className="transition-colors hover:text-foreground">Product</a>
          <a href="#principles" className="transition-colors hover:text-foreground">Principles</a>
          <a href="#story" className="transition-colors hover:text-foreground">Live story</a>
          <Link href="/lab" className="transition-colors hover:text-foreground">Crisis Lab</Link>
          <a href="https://github.com/junlee122-bot/something" className="transition-colors hover:text-foreground">GitHub</a>
        </nav>
        <Link
          href="/command"
          className="ms-auto inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 md:ms-8"
        >
          Enter live demo
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </header>

      <main id="main-content" className="relative z-10">
        <section className="mx-auto max-w-[1240px] px-5 pb-20 pt-20 sm:px-8 sm:pt-28 lg:pb-28 lg:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="fade-up mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-panel/70 px-3 py-1.5 font-mono text-[10px] text-muted backdrop-blur">
              <span className="live-dot size-1.5 rounded-full bg-primary text-primary" />
              Evidence-native software intelligence
              <span className="text-border-strong">/</span>
              Interactive concept
            </div>
            <h1 className="fade-up fade-up-delay-1 text-balance text-[clamp(3.25rem,8vw,7.2rem)] font-medium leading-[0.92] tracking-[-0.065em]">
              Every signal,
              <br />
              <span className="text-primary">traced to source.</span>
            </h1>
            <p className="fade-up fade-up-delay-2 mx-auto mt-8 max-w-2xl text-balance text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Code, deployments, telemetry, and customer impact—connected into one calm, evidence-backed command center.
            </p>
            <div className="fade-up fade-up-delay-3 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/incidents/inc-2471"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Replay the incident
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/command"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-panel/60 px-5 text-sm font-medium transition-colors hover:bg-panel-elevated sm:w-auto"
              >
                Open command center
              </Link>
              <Link
                href="/lab"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-danger/25 bg-danger/[0.045] px-5 text-sm font-medium text-danger transition-colors hover:bg-danger/[0.075] sm:w-auto"
              >
                Run Crisis Lab
                <Gamepad2 aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-[1120px] sm:mt-24">
            <div aria-hidden="true" className="absolute inset-x-[15%] -top-10 h-32 rounded-full bg-primary/[0.06] blur-3xl" />
            <HeroThread />
          </div>

          <div className="mx-auto mt-8 grid max-w-[1120px] grid-cols-2 border-y border-border py-5 sm:grid-cols-4">
            {[
              ["8", "services in context"],
              ["7", "corroborating signals"],
              ["34s", "to leading hypothesis"],
              ["5m", "verified recovery"],
            ].map(([value, label], index) => (
              <div key={label} className={`px-4 py-3 text-center ${index % 2 ? "border-s border-border" : ""} sm:border-s sm:first:border-s-0`}>
                <p className="font-mono text-xl font-medium tracking-tight text-foreground">{value}</p>
                <p className="mt-1 text-[10px] text-muted">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="product" className="border-t border-border bg-[#0a0e10] px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1120px]">
            <div className="max-w-2xl">
              <p className="eyebrow text-primary">One operating picture</p>
              <h2 className="mt-4 text-balance text-3xl font-medium tracking-[-0.035em] sm:text-5xl">
                Stop reconstructing incidents from browser tabs.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base">
                Threadline keeps source evidence and AI interpretation separate, then places both on the same time-aware graph.
              </p>
            </div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="min-h-[280px] bg-panel p-7 sm:p-8">
                    <div className="grid size-10 place-items-center rounded-lg border border-border bg-panel-elevated text-primary">
                      <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
                    </div>
                    <p className="eyebrow mt-10">{feature.label}</p>
                    <h3 className="mt-3 text-xl font-medium tracking-[-0.025em]">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{feature.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="story" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto grid max-w-[1120px] gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow text-primary">A complete incident story</p>
              <h2 className="mt-4 text-balance text-3xl font-medium tracking-[-0.035em] sm:text-5xl">
                From a single commit to verified recovery.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted sm:text-base">
                The demo replays a realistic checkout regression across source, deployment, tracing, SLO, and business data—with no API keys required.
              </p>
              <Link href="/incidents/inc-2471" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                Open Incident Room
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <ol className="relative border-s border-border ps-7 sm:ps-10">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.time} className="relative pb-12 last:pb-0">
                    <span className="absolute -start-[2.55rem] grid size-8 place-items-center rounded-full border border-border-strong bg-background text-primary sm:-start-[3.55rem]">
                      <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                    </span>
                    <div className="panel p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-mono text-[10px] text-primary">{step.time} KST</p>
                        <p className="font-mono text-[9px] text-muted">0{index + 1} / 04</p>
                      </div>
                      <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
                      <p className="mt-1 text-sm text-muted">{step.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section id="principles" className="border-y border-border bg-panel px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-[1120px]">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="eyebrow text-primary">Designed for trust</p>
                <h2 className="mt-4 text-3xl font-medium tracking-[-0.035em] sm:text-4xl">AI that never hides the evidence.</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {[
                  ["Observed stays observed", "Source events are immutable and never rewritten as model output."],
                  ["Inference stays labeled", "Confidence includes supporting and conflicting evidence."],
                  ["Actions stay reversible", "Every proposal carries a preview, owner, and rollback plan."],
                  ["Humans stay in control", "Production changes require explicit, attributable approval."],
                ].map(([title, copy]) => (
                  <div key={title} className="border-t border-border pt-5">
                    <p className="flex items-center gap-2 text-sm font-medium"><Check aria-hidden="true" className="size-4 text-primary" />{title}</p>
                    <p className="mt-2 text-xs leading-6 text-muted">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-2xl border border-primary/15 bg-panel p-8 sm:p-14 lg:p-20">
            <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(90deg,transparent,black)]" />
            <div className="relative max-w-2xl">
              <p className="eyebrow text-primary">Meridian Market · Demo workspace</p>
              <h2 className="mt-4 text-balance text-3xl font-medium tracking-[-0.04em] sm:text-5xl">Follow every signal. Challenge every conclusion.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted">Explore the full product story with deterministic demo data. No account, integration, or production system required.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/command" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
                  Enter Threadline <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link href="/lab" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-danger/25 px-5 text-sm font-medium text-danger hover:bg-danger/[0.04]">
                  <Gamepad2 aria-hidden="true" className="size-4" /> Run Crisis Lab
                </Link>
                <a href="https://github.com/junlee122-bot/something" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border-strong px-5 text-sm font-medium hover:bg-white/[0.035]">
                  <Github aria-hidden="true" className="size-4" /> View source
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 text-xs text-muted sm:flex-row sm:items-center">
          <Wordmark />
          <p className="sm:ms-auto">Concept product · Deterministic demo data · Built for the portfolio</p>
          <a href="https://github.com/junlee122-bot/something" className="text-foreground hover:text-primary">Source</a>
        </div>
      </footer>
    </div>
  );
}
