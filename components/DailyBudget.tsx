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
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/80 dark:border-zinc-700/50 p-4 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.20)] space-y-4 sm:space-y-5 w-full min-w-0 transition-colors">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-100/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Utensils className="w-4 h-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[14px] sm:text-[15px] text-zinc-900 dark:text-white leading-tight">
              Jatah Makan Harian
            </h3>
            <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
              {label}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-medium border bg-zinc-50 dark:bg-zinc-800 border-zinc-200/70 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 self-start sm:self-auto">
          <Clock className="w-3 h-3 text-zinc-400 flex-shrink-0" strokeWidth={2} />
          <span>{daysRemaining} hari lagi</span>
        </div>
      </div>

      {/* Main Focus: Jatah Makan Hari Ini */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3.5 sm:p-5 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0">
          <span className="text-[11.5px] font-medium text-zinc-400 dark:text-zinc-500 block mb-1.5">
            Jatah Hari Ini
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-[1.8rem] sm:text-[2.1rem] text-zinc-900 dark:text-white tabular-nums break-words leading-none">
              {formatCurrency(dailyAllowance)}
            </span>
            <span className="text-[12px] text-zinc-400 dark:text-zinc-500 font-medium">/ hari</span>
          </div>
          <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-1.5">
            Target ideal: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{formatCurrency(dailyTarget)}/hari</strong>
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/50 dark:border-zinc-700/50">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
              isOverBudget
                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/50'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/50'
            }`}
          >
            {isOverBudget ? (
              <><AlertCircle className="w-3 h-3 flex-shrink-0" strokeWidth={2} /><span>Perlu Hemat</span></>
            ) : (
              <><CheckCircle2 className="w-3 h-3 flex-shrink-0" strokeWidth={2} /><span>Aman</span></>
            )}
          </span>
          <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
            Sisa <strong className="text-zinc-700 dark:text-zinc-300">{daysRemaining} hari</strong>
          </span>
        </div>
      </div>

      {/* Progress strip */}
      <div className="space-y-2 min-w-0">
        <div className="flex justify-between text-[12px] font-medium gap-2">
          <span className="text-zinc-400 dark:text-zinc-500 truncate">
            Terpakai <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{formatCurrency(foodSpent)}</strong> ({percentageSpent}%)
          </span>
          <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0">
            Sisa{' '}
            <strong className={budgetRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400 tabular-nums' : 'text-rose-600 dark:text-rose-400 tabular-nums'}>
              {formatCurrency(budgetRemaining)}
            </strong>
          </span>
        </div>

        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-[3px] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5 gap-2">
          <span className="truncate">Budget: {formatCurrency(foodBudgetTotal)}</span>
          <span className="flex-shrink-0">Rata-rata: {formatCurrency(dailyActual)}/hari</span>
        </div>
      </div>
    </div>
  );
}
