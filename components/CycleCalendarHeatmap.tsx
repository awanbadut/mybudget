'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { Calendar, Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface HeatmapTx {
  id?: string;
  name: string;
  amount: number;
  type: string;
  transactionDate: string;
}

interface CycleCalendarHeatmapProps {
  startDateStr: string;
  endDateStr: string;
  cycleLabel: string;
  transactions: HeatmapTx[];
  dailyIdealBudget?: number;
}

export function CycleCalendarHeatmap({
  startDateStr,
  endDateStr,
  cycleLabel,
  transactions,
  dailyIdealBudget = 100000,
}: CycleCalendarHeatmapProps) {
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysList = useMemo(() => {
    const map: Record<string, { expense: number; income: number; items: HeatmapTx[] }> = {};
    transactions.forEach(t => {
      if (!map[t.transactionDate]) {
        map[t.transactionDate] = { expense: 0, income: 0, items: [] };
      }
      if (t.type === 'expense') map[t.transactionDate].expense += t.amount;
      if (t.type === 'income') map[t.transactionDate].income += t.amount;
      map[t.transactionDate].items.push(t);
    });

    const [sy, sm, sd] = startDateStr.split('-').map(Number);
    const [ey, em, ed] = endDateStr.split('-').map(Number);
    const cur = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    const result: Array<{
      dateStr: string;
      dayNum: number;
      monthShort: string;
      expense: number;
      income: number;
      items: HeatmapTx[];
      isFuture: boolean;
      isToday: boolean;
    }> = [];

    let guard = 0;
    while (cur <= end && guard < 45) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;
      const info = map[dStr] || { expense: 0, income: 0, items: [] };

      result.push({
        dateStr: dStr,
        dayNum: cur.getDate(),
        monthShort: SHORT_MONTHS[cur.getMonth()],
        expense: info.expense,
        income: info.income,
        items: info.items,
        isFuture: dStr > todayStr,
        isToday: dStr === todayStr,
      });

      cur.setDate(cur.getDate() + 1);
      guard++;
    }

    return result;
  }, [startDateStr, endDateStr, transactions, todayStr]);

  const elapsedDays = daysList.filter(d => !d.isFuture);
  const noSpendDaysCount = elapsedDays.filter(d => d.expense === 0).length;
  const activeDayObj = daysList.find(d => d.dateStr === selectedDate) || null;

  const threshold = dailyIdealBudget > 0 ? dailyIdealBudget : 75000;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
              Kalender Disiplin Harian ({cycleLabel})
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Ketuk tanggal untuk melihat pengeluaran pada hari tersebut
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold self-start sm:self-auto">
          <Flame className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{noSpendDaysCount} Hari Tanpa Belanja (Rp 0)</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[10.5px] text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          <span>Rp 0 (No-Spend)</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
          <span>Hemat (&le; {formatCurrency(threshold)})</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
          <span>Boros (&gt; {formatCurrency(threshold)})</span>
        </span>
      </div>

      {/* 7-Column Compact Date Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {daysList.map(d => {
          const isSelected = selectedDate === d.dateStr;
          const isZero = !d.isFuture && d.expense === 0;
          const isLow = !d.isFuture && d.expense > 0 && d.expense <= threshold;
          const isHigh = !d.isFuture && d.expense > threshold;

          return (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : d.dateStr)}
              className={cn(
                'p-1.5 rounded-xl border text-center transition-all active:scale-95 touch-manipulation flex flex-col items-center justify-center min-h-[46px] relative',
                isSelected && 'ring-2 ring-zinc-900 dark:ring-white',
                d.isFuture
                  ? 'bg-stone-50/50 dark:bg-zinc-800/30 border-stone-100 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600'
                  : isZero
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200'
                  : isLow
                  ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/60 text-blue-800 dark:text-blue-200'
                  : isHigh
                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
                  : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700'
              )}
            >
              <span className="text-[11px] font-extrabold leading-none">
                {d.dayNum}
              </span>
              <span className="text-[8.5px] opacity-75 leading-tight mt-0.5">
                {d.dayNum === 1 || d.dateStr === startDateStr ? d.monthShort : isZero ? 'Rp 0' : d.expense > 0 ? `${Math.round(d.expense / 1000)}k` : '-'}
              </span>
              {d.isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white absolute top-1 right-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Detail Drawer */}
      {activeDayObj && (
        <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/70 dark:border-zinc-700/70 space-y-2 text-xs animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900 dark:text-white">
              Tanggal {activeDayObj.dayNum} {activeDayObj.monthShort} ({activeDayObj.dateStr})
            </span>
            <span
              className={cn(
                'font-bold tabular-nums',
                activeDayObj.expense === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {activeDayObj.expense === 0
                ? 'Hemat Rp 0 Belanja!'
                : `Keluar: -${formatCurrency(activeDayObj.expense)}`}
            </span>
          </div>

          {activeDayObj.items.length === 0 ? (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tidak ada catatan pengeluaran pada tanggal ini.</span>
            </p>
          ) : (
            <div className="divide-y divide-stone-200/60 dark:divide-zinc-700/60">
              {activeDayObj.items.map((it, idx) => (
                <div key={it.id || idx} className="py-1.5 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-zinc-700 dark:text-zinc-200 font-medium truncate">
                    {it.name}
                  </span>
                  <span
                    className={cn(
                      'font-bold tabular-nums flex-shrink-0',
                      it.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : it.type === 'transfer'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-zinc-900 dark:text-white'
                    )}
                  >
                    {it.type === 'income' ? '+' : it.type === 'transfer' ? '' : '-'}
                    {formatCurrency(it.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
