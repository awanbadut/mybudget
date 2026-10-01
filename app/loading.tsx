import Image from 'next/image';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full min-w-0 overflow-x-hidden font-sans">
      {/* Brand Loading Animation Banner */}
      <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-2xl bg-emerald-500/20 dark:bg-emerald-400/20 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 p-1.5 shadow-md flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="Memuat My Budget"
              width={48}
              height={48}
              className="w-full h-full object-contain rounded-xl animate-pulse"
              priority
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
          <span className="ml-1 text-[11px] tracking-wide">Memuat data keuangan...</span>
        </div>
      </div>
      {/* Header Skeleton */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-stone-200/80 dark:bg-zinc-800 rounded-full" />
          <div className="h-8 w-56 bg-stone-200/80 dark:bg-zinc-800 rounded-xl" />
          <div className="h-3.5 w-64 bg-stone-200/60 dark:bg-zinc-800/80 rounded" />
        </div>
        <div className="h-10 w-36 bg-stone-200/70 dark:bg-zinc-800 rounded-xl hidden sm:block" />
      </header>

      {/* Saldo Summary Skeleton (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-stone-200/60 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-stone-200/80 dark:bg-zinc-800 rounded" />
              <div className="w-7 h-7 rounded-xl bg-stone-100 dark:bg-zinc-800" />
            </div>
            <div className="h-6 w-28 bg-stone-200 dark:bg-zinc-700 rounded-lg" />
            <div className="h-2.5 w-20 bg-stone-100 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Pacing Makan Harian Skeleton */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/60 dark:border-zinc-800 p-4 sm:p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
        <div className="flex justify-between items-center">
          <div className="h-4 w-36 bg-stone-200 dark:bg-zinc-700 rounded" />
          <div className="h-3 w-20 bg-stone-100 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-3 w-full bg-stone-100 dark:bg-zinc-800 rounded-full" />
        <div className="flex justify-between">
          <div className="h-3 w-28 bg-stone-100 dark:bg-zinc-800 rounded" />
          <div className="h-3 w-28 bg-stone-100 dark:bg-zinc-800 rounded" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-stone-200/60 dark:border-zinc-800 flex flex-col items-center gap-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-zinc-800" />
            <div className="h-2.5 w-12 bg-stone-100 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Budget Progress Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 bg-stone-200 dark:bg-zinc-800 rounded" />
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/60 dark:border-zinc-800 p-4 sm:p-5 space-y-4 transition-colors">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3.5 w-24 bg-stone-200 dark:bg-zinc-700 rounded" />
                <div className="h-3.5 w-20 bg-stone-200 dark:bg-zinc-700 rounded" />
              </div>
              <div className="h-2 w-full bg-stone-100 dark:bg-zinc-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
