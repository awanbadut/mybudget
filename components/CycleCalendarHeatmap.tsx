'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { Calendar, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
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

function AnimatedStreakFlame({ active, isSuper }: { active: boolean; isSuper: boolean }) {
  if (!active) {
    return (
      <svg viewBox="0 0 28 32" className="w-5 h-5 flex-shrink-0 opacity-50">
        <path
          d="M14 3C14 3 6 11.5 6 19.5C6 24.2 9.6 28 14 28C18.4 28 22 24.2 22 19.5C22 11.5 14 3 14 3Z"
          fill="#9ca3af"
        />
      </svg>
    );
  }

  return (
    <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0 select-none">
      {/* Ambient radial fire glow */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-[5px] animate-flame-glow pointer-events-none',
          isSuper ? 'bg-amber-400/70' : 'bg-orange-500/60'
        )}
      />

      <svg
        viewBox="0 0 32 36"
        className="w-6 h-6 relative z-10 overflow-visible drop-shadow-[0_2px_6px_rgba(249,115,22,0.55)]"
      >
        <defs>
          <linearGradient id="flameOuterGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={isSuper ? '#f59e0b' : '#fb923c'} />
            <stop offset="55%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="flameMidGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="65%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="flameCoreGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor={isSuper ? '#38bdf8' : '#fef08a'} />
          </linearGradient>
        </defs>

        {/* Rising Ember Sparks */}
        <circle cx="10" cy="12" r="1.4" fill="#fde047" className="animate-ember-1" />
        <circle cx="22" cy="10" r="1.2" fill="#fb923c" className="animate-ember-2" />
        {isSuper && (
          <circle cx="16" cy="6" r="1.5" fill="#fef08a" className="animate-ember-1" />
        )}

        {/* Outer Flame Layer */}
        <g className="animate-flame-outer">
          <path
            d="M16 2C16 2 25.5 11.2 25.5 20.5C25.5 26.6 21.2 31.5 16 31.5C10.8 31.5 6.5 26.6 6.5 20.5C6.5 15.8 9.2 11.4 11.5 8.5C11.5 8.5 10.8 13.2 13.2 14.5C12.2 9.8 16 2 16 2Z"
            fill="url(#flameOuterGrad)"
          />
        </g>

        {/* Middle Flame Layer */}
        <g className="animate-flame-mid">
          <path
            d="M16 9.5C16 9.5 22 15.8 22 21.8C22 26.1 19.3 29.5 16 29.5C12.7 29.5 10 26.1 10 21.8C10 18.2 12.2 14.8 14 12.6C14 12.6 13.7 15.6 15.2 16.5C14.6 13.2 16 9.5 16 9.5Z"
            fill="url(#flameMidGrad)"
          />
        </g>

        {/* Inner Hot Core */}
        <g className="animate-flame-core">
          <path
            d="M16 17.5C16 17.5 19.2 21 19.2 24.5C19.2 26.9 17.8 28.8 16 28.8C14.2 28.8 12.8 26.9 12.8 24.5C12.8 21 16 17.5 16 17.5Z"
            fill="url(#flameCoreGrad)"
          />
        </g>
      </svg>
    </div>
  );
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

  const threshold = dailyIdealBudget > 0 ? dailyIdealBudget : 75000;
  const elapsedDays = daysList.filter(d => !d.isFuture);
  const onTargetDaysCount = elapsedDays.filter(d => d.expense <= threshold).length;

  // Hitung streak beruntun (consecutive days sesuai target sampai hari terakhir yang berjalan)
  const { currentStreak, bestStreak } = useMemo(() => {
    let cur = 0;
    let best = 0;
    let running = 0;

    for (const d of elapsedDays) {
      if (d.expense <= threshold) {
        running++;
        if (running > best) best = running;
      } else {
        running = 0;
      }
    }

    for (let i = elapsedDays.length - 1; i >= 0; i--) {
      if (elapsedDays[i].expense <= threshold) {
        cur++;
      } else {
        break;
      }
    }

    return { currentStreak: cur, bestStreak: best };
  }, [elapsedDays, threshold]);

  const streakDisplayCount = currentStreak > 0 ? currentStreak : onTargetDaysCount;
  const isFlameActive = streakDisplayCount > 0;
  const isSuperStreak = streakDisplayCount >= 7;

  const activeDayObj = daysList.find(d => d.dateStr === selectedDate) || null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
      {/* Header & Animated Fire Streak Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
              Kalender Disiplin Harian ({cycleLabel})
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Target harian ideal: <strong className="text-zinc-700 dark:text-zinc-200">&le; {formatCurrency(threshold)}/hari</strong>
            </p>
          </div>
        </div>

        {/* Animated Streak Pill */}
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-extrabold self-start sm:self-auto transition-all',
            isFlameActive
              ? 'bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-emerald-500/10 dark:from-orange-950/70 dark:via-amber-950/60 dark:to-emerald-950/40 border-orange-300/80 dark:border-orange-700/70 text-orange-950 dark:text-amber-200 shadow-2xs'
              : 'bg-stone-100 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
          )}
        >
          <AnimatedStreakFlame active={isFlameActive} isSuper={isSuperStreak} />
          <div className="leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-[13px] font-black tracking-tight text-orange-600 dark:text-amber-300">
                {currentStreak > 0
                  ? `${currentStreak} Hari Streak Sesuai Target!`
                  : `${onTargetDaysCount} Hari Sesuai Target`}
              </span>
            </div>
            <span className="block text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
              {onTargetDaysCount} dari {elapsedDays.length} hari terkendali (&le; {formatCurrency(threshold)})
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[10.5px] text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Sesuai Target (&le; {formatCurrency(threshold)})
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
          <span>Melebihi Target (&gt; {formatCurrency(threshold)})</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-stone-200 dark:bg-zinc-700 inline-block" />
          <span>Belum Tiba</span>
        </span>
      </div>

      {/* 7-Column Compact Date Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {daysList.map(d => {
          const isSelected = selectedDate === d.dateStr;
          const isOnTarget = !d.isFuture && d.expense <= threshold;
          const isOverTarget = !d.isFuture && d.expense > threshold;

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
                  : isOnTarget
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200'
                  : isOverTarget
                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
                  : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700'
              )}
            >
              <span className="text-[11px] font-extrabold leading-none">
                {d.dayNum}
              </span>
              <span className="text-[8.5px] opacity-80 leading-tight mt-0.5 font-semibold">
                {d.dayNum === 1 || d.dateStr === startDateStr
                  ? d.monthShort
                  : d.isFuture
                  ? '-'
                  : d.expense === 0
                  ? '✓ Hemat'
                  : `${Math.round(d.expense / 1000)}k`}
              </span>
              {d.isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute top-1 right-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Detail Drawer */}
      {activeDayObj && (
        <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/70 dark:border-zinc-700/70 space-y-2 text-xs animate-in fade-in-50">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold text-zinc-900 dark:text-white">
              Tanggal {activeDayObj.dayNum} {activeDayObj.monthShort} ({activeDayObj.dateStr})
            </span>
            <span
              className={cn(
                'font-bold tabular-nums inline-flex items-center gap-1',
                activeDayObj.expense <= threshold
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {activeDayObj.expense <= threshold ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Sesuai Target ({formatCurrency(activeDayObj.expense)} / {formatCurrency(threshold)})
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>
                    Lewat Target: {formatCurrency(activeDayObj.expense)} (+{formatCurrency(activeDayObj.expense - threshold)})
                  </span>
                </>
              )}
            </span>
          </div>

          {activeDayObj.items.length === 0 ? (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tidak ada pengeluaran pada tanggal ini — hemat maksimal sesuai target!</span>
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
                    {it.type === 'income' ? '+' : it.type === 'transfer' ? '⇄ ' : '-'}
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
