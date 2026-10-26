export default function BudgetLoading() {
  return (
    <div className="space-y-4 font-sans animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-stone-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-3.5 w-60 bg-stone-100 dark:bg-zinc-850 rounded" />
        </div>
        <div className="h-9 w-28 bg-stone-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      <div className="h-28 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 space-y-3" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 space-y-3" />
        ))}
      </div>
    </div>
  );
}
