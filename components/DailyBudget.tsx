'use client';

import { formatCurrency } from '@/lib/currency';
import { ForkKnife, Clock, Warning, CheckCircle } from '@phosphor-icons/react';
import { getPayrollCycle } from '@/lib/dates';
import { cn } from '@/lib/utils';

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
  const dailyTarget = foodBudgetTotal > 0 ? Math.round(foodBudgetTotal / totalDays) : 0;
  const dailyAllowance = daysRemaining > 0 ? Math.max(0, Math.round(budgetRemaining / daysRemaining)) : 0;
  const percentageSpent = foodBudgetTotal > 0 ? Math.min(100, Math.round((foodSpent / foodBudgetTotal) * 100)) : 0;
  const dailyActual = elapsedDays > 0 ? Math.round(foodSpent / elapsedDays) : 0;
  const isOverBudget = (dailyActual > dailyTarget && dailyTarget > 0) || budgetRemaining < 0;

  if (foodBudgetTotal === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.20)] p-4 sm:p-5 space-y-4 w-full min-w-0 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[10px] bg-amber-100/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <ForkKnife size={15} weight="fill" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[13.5px] sm:text-[14.5px] text-zinc-900 dark:text-white leading-none">
              Jatah Makan Harian
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 truncate">{label}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 flex-shrink-0">
          <Clock size={11} weight="regular" />
          <span>{daysRemaining}h lagi</span>
        </div>
      </div>

      {/* Main allowance block */}
      <div className="bg-zinc-50/80 dark:bg-zinc-800/40 rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 block mb-1">Jatah hari ini</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-[1.9rem] sm:text-[2.2rem] text-zinc-900 dark:text-white tabular-nums leading-none">
              {formatCurrency(dailyAllowance)}
            </span>
            <span className="text-[12px] text-zinc-400 dark:text-zinc-500 font-medium">/hari</span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
            Target ideal: <strong className="text-zinc-600 dark:text-zinc-300 font-semibold">{formatCurrency(dailyTarget)}/hari</strong>
          </p>
        </div>
        <span className={cn(
          'inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0',
          isOverBudget
            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/50'
            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50'
        )}>
          {isOverBudget
            ? <><Warning size={11} weight="fill" /><span>Hemat</span></>
            : <><CheckCircle size={11} weight="fill" /><span>Aman</span></>}
        </span>
      </div>

      {/* Progress strip */}
      <div className="space-y-2 min-w-0">
        <div className="flex justify-between text-[11.5px] font-medium gap-2">
          <span className="text-zinc-400 dark:text-zinc-500 truncate">
            Terpakai <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{formatCurrency(foodSpent)}</strong> ({percentageSpent}%)
          </span>
          <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0">
            Sisa{' '}
            <strong className={cn('tabular-nums', budgetRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {formatCurrency(budgetRemaining)}
            </strong>
          </span>
        </div>

        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-[4px] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', isOverBudget ? 'bg-rose-500' : 'bg-emerald-500')}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-zinc-400 dark:text-zinc-500 gap-2">
          <span className="truncate">Total: {formatCurrency(foodBudgetTotal)}</span>
          <span className="flex-shrink-0">Rata-rata: {formatCurrency(dailyActual)}/hari</span>
        </div>
      </div>
    </div>
  );
}
