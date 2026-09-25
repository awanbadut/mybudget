'use client';

import { formatCurrency } from '@/lib/currency';
import { Utensils, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 leading-none">
              Pacing Makan Harian
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Siklus Gaji: {label}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-stone-50 border-stone-200/70 text-zinc-600">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>Gajian tgl {salaryDate} ({daysRemaining} hari lagi)</span>
        </div>
      </div>

      {/* Main Focus: Jatah Makan Hari Ini */}
      <div className="bg-stone-50/70 rounded-xl p-4 sm:p-5 border border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-zinc-500 block mb-1">
            Jatah Aman Konsumsi Hari Ini
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-3xl sm:text-4xl text-zinc-900 tabular-nums">
              {formatCurrency(dailyAllowance)}
            </span>
            <span className="text-xs text-zinc-500 font-medium">/ hari</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Target ideal: <strong className="text-zinc-800 font-semibold">{formatCurrency(dailyTarget)}/hari</strong> untuk {totalDays} hari penuh.
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/50">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              isOverBudget
                ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
            }`}
          >
            {isOverBudget ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Perlu Rem Belanja</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pacing Terkendali</span>
              </>
            )}
          </span>
          <span className="text-xs text-zinc-500">
            Sisa waktu: <strong className="text-zinc-900 font-semibold">{daysRemaining} hari</strong>
          </span>
        </div>
      </div>

      {/* Progress & Breakdown Strip */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-zinc-500">
            Terpakai: <strong className="text-zinc-900 tabular-nums">{formatCurrency(foodSpent)}</strong> ({percentageSpent}%)
          </span>
          <span className="text-zinc-500">
            Sisa Budget: <strong className={budgetRemaining >= 0 ? 'text-emerald-600 tabular-nums' : 'text-rose-600 tabular-nums'}>
              {formatCurrency(budgetRemaining)}
            </strong>
          </span>
        </div>

        {/* Smooth modern progress bar */}
        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-0.5">
          <span>Pagu Total: {formatCurrency(foodBudgetTotal)}</span>
          <span>Rata-rata Terpakai: {formatCurrency(dailyActual)}/hari</span>
        </div>
      </div>
    </div>
  );
}
