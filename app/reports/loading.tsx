export default function ReportsLoading() {
  return (
    <div className="space-y-4 font-sans animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-stone-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-3.5 w-60 bg-stone-100 dark:bg-zinc-850 rounded" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3 space-y-2" />
        ))}
      </div>

      <div className="h-64 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4" />
    </div>
  );
}
