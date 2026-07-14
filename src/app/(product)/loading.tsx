export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-[1320px] animate-pulse px-4 py-8 sm:px-6" aria-label="Loading workspace">
      <div className="h-3 w-28 rounded bg-white/[0.06]" />
      <div className="mt-4 h-8 w-72 max-w-full rounded bg-white/[0.075]" />
      <div className="mt-3 h-3 w-[480px] max-w-full rounded bg-white/[0.05]" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-xl border border-border bg-panel" />)}
      </div>
      <div className="mt-4 h-[420px] rounded-xl border border-border bg-panel" />
    </div>
  );
}
