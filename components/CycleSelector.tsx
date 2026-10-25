'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  History,
  RotateCcw,
  Check,
} from 'lucide-react';
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
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCycle = cycles.find(c => c.offset === currentOffset) || cycles[0];
  const minOffset = cycles.length > 0 ? cycles[cycles.length - 1].offset : -11;
  const canGoPrev = currentOffset > minOffset;
  const canGoNext = currentOffset < 0;
  const isHistorical = currentOffset < 0;

  function navigateToOffset(newOffset: number) {
    setSheetOpen(false);
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

  function getRelativeName(offset: number) {
    if (offset === 0) return 'Siklus Aktif';
    if (offset === -1) return 'Bulan Kemarin';
    return `${Math.abs(offset)} Siklus Lalu`;
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-1.5 p-1.5 rounded-2xl border transition-all shadow-xs',
          isHistorical
            ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300/90 dark:border-amber-800/80'
            : 'bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800'
        )}
      >
        {/* Previous Cycle Button */}
        <button
          type="button"
          disabled={!canGoPrev || isPending}
          onClick={() => navigateToOffset(currentOffset - 1)}
          aria-label="Siklus sebelumnya"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-35 transition-all active:scale-95 flex-shrink-0 touch-manipulation"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Center Trigger Pill -> Opens Mobile Bottom Sheet */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          disabled={isPending}
          className="flex-1 min-w-0 flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-xl hover:bg-stone-100/80 dark:hover:bg-zinc-800/70 transition-all active:scale-[0.99] touch-manipulation"
        >
          <span
            className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0',
              isHistorical
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
            )}
          >
            {isHistorical ? <History className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
          </span>

          <div className="min-w-0 text-left sm:text-center flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-[13px] text-zinc-900 dark:text-white truncate">
                {activeCycle?.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            </div>
            <span
              className={cn(
                'text-[10px] font-semibold px-1.5 py-0.2 rounded-md w-fit leading-tight',
                isHistorical
                  ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              )}
            >
              {isPending ? 'Memuat...' : getRelativeName(currentOffset)}
            </span>
          </div>
        </button>

        {/* Right Controls: Next Cycle + Reset to Active */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isHistorical && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => navigateToOffset(0)}
              className="h-9 px-2.5 rounded-xl inline-flex items-center gap-1 text-[11px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs active:scale-95 transition-all touch-manipulation"
              title="Kembali ke siklus saat ini"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden xs:inline sm:inline">Kini</span>
            </button>
          )}

          <button
            type="button"
            disabled={!canGoNext || isPending}
            onClick={() => navigateToOffset(currentOffset + 1)}
            aria-label="Siklus berikutnya"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-35 transition-all active:scale-95 flex-shrink-0 touch-manipulation"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Sheet Cycle Picker */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 p-0 overflow-hidden flex flex-col max-h-[82vh]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-stone-100 dark:border-zinc-800">
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              Pilih Siklus Keuangan
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isStudentMode
                ? 'Rentang siklus bulanan (1 s/d akhir bulan)'
                : `Rentang siklus gajian tanggal ${salaryDate} ke ${salaryDate - 1 || 30}`}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {cycles.map(c => {
              const isSelected = c.offset === currentOffset;
              const isCurrent = c.offset === 0;
              return (
                <button
                  key={c.offset}
                  type="button"
                  onClick={() => navigateToOffset(c.offset)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-[0.99] touch-manipulation border',
                    isSelected
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm'
                      : 'bg-stone-50/70 dark:bg-zinc-800/50 hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border-stone-200/60 dark:border-zinc-800'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-white/15 dark:bg-zinc-900/10 text-white dark:text-zinc-900'
                          : isCurrent
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-stone-200/70 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                      )}
                    >
                      {isCurrent ? <Calendar className="w-4 h-4" /> : <History className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm truncate">
                          {c.label}
                        </span>
                        {isCurrent && (
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full',
                              isSelected
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            )}
                          >
                            Aktif
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-[11px] mt-0.5',
                          isSelected
                            ? 'text-zinc-300 dark:text-zinc-600'
                            : 'text-zinc-500 dark:text-zinc-400'
                        )}
                      >
                        {c.offset === 0
                          ? 'Siklus berjalan saat ini'
                          : c.offset === -1
                          ? '1 siklus sebelumnya (Bulan kemarin)'
                          : `${Math.abs(c.offset)} siklus yang lalu`}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
