"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep the boundary observable without exposing error details in the interface.
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="grid min-h-[70vh] place-items-center px-5 py-16">
      <section
        className="panel w-full max-w-xl p-7 sm:p-10"
        role="alert"
        aria-labelledby="error-title"
      >
        <p className="eyebrow text-danger">Unexpected interruption</p>
        <h1 id="error-title" className="mt-4 text-3xl font-medium tracking-[-0.04em]">
          We lost this part of the thread.
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          The demo could not render this view. Retry the request, or return to a stable starting point.
        </p>
        {error.digest ? (
          <p className="mt-4 font-mono text-[10px] text-muted">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
          <Link
            href="/command"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong px-5 text-sm font-medium hover:bg-white/[0.035]"
          >
            Open command center
          </Link>
        </div>
      </section>
    </main>
  );
}
