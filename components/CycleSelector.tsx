'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronLeft, ChevronRight, Calendar, History, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CycleOption {
  offset: number;
  label: string;
  startDateStr: string;
  endDateStr: string;
  isHistorical?: boolean;
}

interface CycleSelectorProps {
  cycles: CycleOption[];
  currentOffset: number;
  salaryDate: number;
  isStudentMode: boolean;
  onSelectOffset?: (offset: number) => void;
}

export function CycleSelector({
  cycles,
  currentOffset,
  salaryDate,
  isStudentMode,
  onSelectOffset,
}: CycleSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const activeCycle = cycles.find(c => c.offset === currentOffset) || cycles[0];
  const minOffset = cycles.length > 0 ? cycles[cycles.length - 1].offset : -11;
  const canGoPrev = currentOffset > minOffset;
  const canGoNext = currentOffset < 0;
  const isHistorical = currentOffset < 0;

  function navigateToOffset(newOffset: number) {
    if (onSelectOffset) {
      onSelectOffset(newOffset);
      return;
    }
    startTransition(() => {
      const searchStr = typeof window !== 'undefined' ? window.location.search : '';
      const params = new URLSearchParams(searchStr);
      if (newOffset === 0) {
        params.delete('cycle');
      } else {
        params.set('cycle', String(newOffset));
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function getRelativeTitle(offset: number) {
    if (offset === 0) return 'Siklus Aktif Saat Ini';
    if (offset === -1) return '1 Siklus Lalu (Bulan Kemarin)';
    return `${Math.abs(offset)} Siklus Lalu`;
  }

  return (
    <div
      className={cn(
        'rounded-2xl border p-3 sm:p-4 transition-all shadow-xs',
        isHistorical
          ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80'
          : 'bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              isHistorical
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
            )}
          >
            {isHistorical ? <History className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">
                {getRelativeTitle(currentOffset)}
              </span>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                  isHistorical
                    ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                )}
              >
                {isStudentMode ? 'Bulan Kalender' : `Siklus Tgl ${salaryDate}`}
              </span>
              {isPending && (
                <span className="text-[10px] font-medium text-zinc-400 animate-pulse">
                  Memuat siklus...
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              Rentang Tanggal: <strong className="text-zinc-800 dark:text-zinc-200">{activeCycle?.label}</strong>
            </p>
          </div>
        </div>

        {/* Right navigation controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            disabled={!canGoPrev || isPending}
            onClick={() => navigateToOffset(currentOffset - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-40 transition-all active:scale-95 touch-manipulation"
            title="Lihat siklus bulan sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Siklus Lalu</span>
          </button>

          <select
            value={currentOffset}
            disabled={isPending}
            onChange={e => navigateToOffset(parseInt(e.target.value, 10))}
            aria-label="Pilih Siklus Gajian"
            className="flex-1 sm:flex-initial min-w-[195px] px-3 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-stone-200/80 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white cursor-pointer touch-manipulation"
          >
            {cycles.map(c => (
              <option key={c.offset} value={c.offset}>
                {c.offset === 0
                  ? `🟢 Siklus Ini (${c.label})`
                  : c.offset === -1
                  ? `⏪ Bulan Lalu (${c.label})`
                  : `${Math.abs(c.offset)}bln Lalu (${c.label})`}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!canGoNext || isPending}
            onClick={() => navigateToOffset(currentOffset + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-40 transition-all active:scale-95 touch-manipulation"
            title="Lihat siklus berikutnya"
          >
            <span className="hidden md:inline">Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {isHistorical && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => navigateToOffset(0)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-xs transition-all active:scale-95 touch-manipulation"
              title="Kembali ke siklus berjalan saat ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Siklus Ini</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
