'use client';

import { formatCurrency } from '@/lib/currency';
import { Utensils, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  // Daily target is total food budget divided by cycle duration (e.g. Rp900,000 / 30 = Rp30,000/day)
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
    <div className="bg-white rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-zinc-200/90 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 leading-tight">Budget Makan Harian</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-zinc-400" />
              Siklus {label}
            </p>
          </div>
        </div>

        <div className="bg-zinc-100 border border-zinc-200/80 text-zinc-700 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium">
          Gajian tgl {salaryDate}
        </div>
      </div>

      {/* Daily Pacing Hero Box */}
      <div className="bg-zinc-900 text-white rounded-2xl p-4 border border-zinc-800 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
            Jatah Aman Hari Ini
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-zinc-50">
              {formatCurrency(dailyAllowance)}
            </span>
            <span className="text-xs text-zinc-400 font-mono">/hari</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Target ideal: {formatCurrency(dailyTarget)}/hari ({totalDays} hari siklus)
          </p>
        </div>

        <div className="text-right">
          <div className="inline-block bg-zinc-800/80 border border-zinc-700/60 px-3 py-2 rounded-xl text-center">
            <span className="text-[10px] text-zinc-400 font-mono block">Sisa Waktu</span>
            <span className="text-base font-bold text-zinc-100 font-mono">{daysRemaining} Hari</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Sub-metrics */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-zinc-500">
            Terpakai: <strong className="text-zinc-800 tabular-nums">{formatCurrency(foodSpent)}</strong>
          </span>
          <span className="text-zinc-500">
            Sisa: <strong className={budgetRemaining >= 0 ? 'text-emerald-600 tabular-nums' : 'text-rose-600 tabular-nums'}>
              {formatCurrency(budgetRemaining)}
            </strong>
          </span>
        </div>

        {/* Hairline Calibrated Track */}
        <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-200/60">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentageSpent > 90 ? 'bg-rose-500' : percentageSpent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400">
          <span>{percentageSpent}% dari budget {formatCurrency(foodBudgetTotal)}</span>
          <span className={`px-2 py-0.2 rounded-full font-bold ${isOverBudget ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>
            {isOverBudget ? 'Perlu Rem' : 'On Track'}
          </span>
        </div>
      </div>

      {/* Status Notice */}
      <div className={`flex items-start gap-2.5 p-3 rounded-xl text-xs border ${
        isOverBudget ? 'bg-amber-50/80 border-amber-200/70 text-amber-900' : 'bg-zinc-50 border-zinc-200/80 text-zinc-700'
      }`}>
        {isOverBudget ? (
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        )}
        <p className="leading-relaxed">
          {isOverBudget
            ? `Rata-rata pengeluaran makan saat ini ${formatCurrency(dailyActual)}/hari, sedikit di atas target ideal. Batasi sisa belanja agar anggaran cukup hingga gajian tanggal ${salaryDate}.`
            : `Ritme makan aman dalam target ${formatCurrency(dailyTarget)}/hari. Masih ada ${daysRemaining} hari hingga gajian tanggal ${salaryDate}.`
          }
        </p>
      </div>
    </div>
  );
}
