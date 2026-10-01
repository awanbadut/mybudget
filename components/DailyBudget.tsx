'use client';

import { formatCurrency } from '@/lib/currency';
import { Utensils, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getPayrollCycle } from '@/lib/dates';

interface DailyBudgetProps {
  foodBudgetTotal: number;
  foodSpent: number;
  salaryDate?: number;
}

export function DailyBudget({
  foodBudgetTotal,
  foodSpent,
  salaryDate = 25,
}: DailyBudgetProps) {
  const cycle = getPayrollCycle(salaryDate, new Date());
  const { totalDays, elapsedDays, daysRemaining, label } = cycle;

  const budgetRemaining = foodBudgetTotal - foodSpent;
  // Daily target is total food budget divided by cycle duration
  const dailyTarget = foodBudgetTotal > 0 ? Math.round(foodBudgetTotal / totalDays) : 0;

  // Safe allowance per remaining day
  const dailyAllowance = daysRemaining > 0
    ? Math.max(0, Math.round(budgetRemaining / daysRemaining))
    : 0;

  // Percentage spent
  const percentageSpent = foodBudgetTotal > 0
    ? Math.min(100, Math.round((foodSpent / foodBudgetTotal) * 100))
    : 0;

  // Actual daily average spent so far
  const dailyActual = elapsedDays > 0 ? Math.round(foodSpent / elapsedDays) : 0;
  const isOverBudget = (dailyActual > dailyTarget && dailyTarget > 0) || budgetRemaining < 0;

  if (foodBudgetTotal === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 sm:space-y-5 w-full min-w-0 transition-colors">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40 flex-shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white leading-tight">
              Jatah Makan Harian
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              Periode: {label}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border bg-stone-50 dark:bg-zinc-800 border-stone-200/70 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
          <span>Gajian tgl {salaryDate} ({daysRemaining} hari lagi)</span>
        </div>
      </div>

      {/* Main Focus: Jatah Makan Hari Ini */}
      <div className="bg-stone-50/70 dark:bg-zinc-800/40 rounded-xl p-3.5 sm:p-5 border border-stone-200/60 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0">
          <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            Jatah Belanja Makan Hari Ini
          </span>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl text-zinc-900 dark:text-white tabular-nums break-words">
              {formatCurrency(dailyAllowance)}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">/ hari</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Target ideal: <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{formatCurrency(dailyTarget)}/hari</strong> ({totalDays} hari periode).
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/50 dark:border-zinc-700/50">
          <span
            className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium px-2.5 py-0.5 sm:py-1 rounded-full border ${
              isOverBudget
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800'
            }`}
          >
            {isOverBudget ? (
              <>
                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span>Perlu Dihemat</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span>Pengeluaran Aman</span>
              </>
            )}
          </span>
          <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
            Sisa waktu: <strong className="text-zinc-900 dark:text-white font-semibold">{daysRemaining} hari</strong>
          </span>
        </div>
      </div>

      {/* Progress & Breakdown Strip */}
      <div className="space-y-2 min-w-0">
        <div className="flex justify-between text-xs font-medium gap-2">
          <span className="text-zinc-500 dark:text-zinc-400 truncate">
            Terpakai: <strong className="text-zinc-900 dark:text-white tabular-nums">{formatCurrency(foodSpent)}</strong> ({percentageSpent}%)
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 flex-shrink-0">
            Sisa: <strong className={budgetRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400 tabular-nums' : 'text-rose-600 dark:text-rose-400 tabular-nums'}>
              {formatCurrency(budgetRemaining)}
            </strong>
          </span>
        </div>

        {/* Smooth modern progress bar */}
        <div className="w-full bg-stone-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5 gap-2">
          <span className="truncate">Total Anggaran: {formatCurrency(foodBudgetTotal)}</span>
          <span className="flex-shrink-0">Rata-rata: {formatCurrency(dailyActual)}/hari</span>
        </div>
      </div>
    </div>
  );
}
