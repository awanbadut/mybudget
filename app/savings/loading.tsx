export default function SavingsLoading() {
  return (
    <div className="space-y-4 font-sans animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-stone-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-3.5 w-60 bg-stone-100 dark:bg-zinc-850 rounded" />
        </div>
        <div className="h-9 w-32 bg-stone-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      <div className="h-20 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40 p-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="h-44 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-5 space-y-3" />
        ))}
      </div>
    </div>
  );
}
