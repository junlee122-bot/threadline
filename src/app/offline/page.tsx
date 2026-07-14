import type { Metadata } from "next";

/* eslint-disable @next/next/no-html-link-for-pages -- Offline recovery must trigger a document navigation so the service worker can provide its fallback. */

export const metadata: Metadata = {
  title: "Offline",
  description: "Threadline is waiting for a network connection.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-16"
    >
      <div
        aria-hidden="true"
        className="technical-grid pointer-events-none absolute inset-0 opacity-50"
      />
      <section className="panel relative w-full max-w-xl p-7 sm:p-10" aria-labelledby="offline-title">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-warning/30 bg-warning/10 font-mono text-xs font-bold text-warning">
            00
          </span>
          <div>
            <p className="eyebrow text-warning">Connection interrupted</p>
            <p className="mt-1 font-mono text-[10px] text-muted">LOCAL FALLBACK / READY</p>
          </div>
        </div>

        <h1 id="offline-title" className="text-balance text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          The thread is temporarily offline.
        </h1>
        <p role="status" className="mt-4 max-w-md text-sm leading-7 text-muted">
          Threadline could not reach the network. Your production systems are unaffected; reconnect and retry to resume the demo.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="/command"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Retry connection
          </a>
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong px-5 text-sm font-medium hover:bg-white/[0.035]"
          >
            Return home
          </a>
        </div>

        <p className="mt-8 border-t border-border pt-5 font-mono text-[10px] leading-5 text-muted">
          The offline fallback stores no incident, API, React Server Component, or Next.js build data.
        </p>
      </section>
    </main>
  );
}
