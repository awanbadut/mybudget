export default function DashboardLoading() {
  return (
    <div className="space-y-5 sm:space-y-7 w-full max-w-full min-w-0 overflow-x-hidden animate-pulse">
      {/* Header Skeleton */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-stone-200/80 rounded-full" />
          <div className="h-8 w-56 bg-stone-200/80 rounded-xl" />
          <div className="h-3.5 w-64 bg-stone-200/60 rounded" />
        </div>
        <div className="h-10 w-36 bg-stone-200/70 rounded-xl hidden sm:block" />
      </header>

      {/* Saldo Summary Skeleton (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-stone-200/80 rounded" />
              <div className="w-7 h-7 rounded-xl bg-stone-100" />
            </div>
            <div className="h-6 w-28 bg-stone-200 rounded-lg" />
            <div className="h-2.5 w-20 bg-stone-100 rounded" />
          </div>
        ))}
      </div>

      {/* Pacing Makan Harian Skeleton */}
      <div className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center">
          <div className="h-4 w-36 bg-stone-200 rounded" />
          <div className="h-3 w-20 bg-stone-100 rounded" />
        </div>
        <div className="h-3 w-full bg-stone-100 rounded-full" />
        <div className="flex justify-between">
          <div className="h-3 w-28 bg-stone-100 rounded" />
          <div className="h-3 w-28 bg-stone-100 rounded" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-3 border border-stone-200/60 flex flex-col items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100" />
            <div className="h-2.5 w-12 bg-stone-100 rounded" />
          </div>
        ))}
      </div>

      {/* Budget Progress Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 bg-stone-200 rounded" />
        <div className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3.5 w-24 bg-stone-200 rounded" />
                <div className="h-3.5 w-20 bg-stone-200 rounded" />
              </div>
              <div className="h-2 w-full bg-stone-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
