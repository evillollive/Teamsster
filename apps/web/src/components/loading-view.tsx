export function LoadingView({ label }: { label: string }) {
  return (
    <div className="grid gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/80 p-6 shadow-sm">
      <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
      <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
      <p className="text-sm text-slate-500">Loading {label.toLowerCase()}…</p>
    </div>
  );
}
