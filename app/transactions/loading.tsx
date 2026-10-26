export default function TransactionsLoading() {
  return (
    <div className="space-y-4 font-sans animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-stone-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-3.5 w-60 bg-stone-100 dark:bg-zinc-850 rounded" />
        </div>
        <div className="h-9 w-28 bg-stone-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/60 dark:border-zinc-800 p-3 space-y-1.5" />
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 divide-y divide-stone-100 dark:divide-zinc-800">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-800" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-stone-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-20 bg-stone-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
            <div className="h-5 w-24 bg-stone-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
