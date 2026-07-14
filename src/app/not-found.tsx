import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-16"
    >
      <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
      <section className="relative w-full max-w-2xl text-center" aria-labelledby="not-found-title">
        <p className="font-mono text-xs font-semibold tracking-[0.22em] text-primary">404 / THREAD NOT FOUND</p>
        <h1 id="not-found-title" className="mt-5 text-balance text-4xl font-medium tracking-[-0.05em] sm:text-6xl">
          This signal has no known source.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-muted sm:text-base">
          The route may have moved, or the evidence link is incomplete. Return to the command center to pick up the operational story.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/command"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Open command center
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong px-5 text-sm font-medium hover:bg-white/[0.035]"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
