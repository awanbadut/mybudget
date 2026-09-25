'use client';

import { formatCurrency } from '@/lib/currency';
import { Utensils, Calendar, AlertCircle, CheckCircle2, Flame } from 'lucide-react';
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
    <div className="bg-white rounded-[26px] p-5 shadow-sm border border-gray-100 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">Budget Makan Harian</h3>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" />
              Siklus: <span className="font-semibold text-gray-700">{label}</span>
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0">
          Gajian Tgl {salaryDate}
        </div>
      </div>

      {/* Main Daily Allowance Hero Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden flex items-center justify-between">
        <div className="space-y-0.5 relative z-10">
          <p className="text-xs font-medium text-amber-100 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-yellow-200" />
            Jatah Makan Aman Hari Ini
          </p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight">
            {formatCurrency(dailyAllowance)}
            <span className="text-xs font-medium text-amber-100 ml-1">/ hari</span>
          </p>
          <p className="text-[11px] text-amber-100/90">
            Target ideal: {formatCurrency(dailyTarget)}/hari ({totalDays} hari siklus)
          </p>
        </div>

        <div className="relative z-10 text-right">
          <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
            <p className="text-[10px] text-white/90">Sisa Waktu</p>
            <p className="text-base font-extrabold">{daysRemaining} Hari</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 font-medium">Terpakai: <strong className="text-gray-800">{formatCurrency(foodSpent)}</strong></span>
          <span className="text-gray-500 font-medium">Total: <strong className="text-gray-800">{formatCurrency(foodBudgetTotal)}</strong></span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentageSpent > 90 ? 'bg-rose-500' : percentageSpent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-gray-400">
          <span>{percentageSpent}% dari budget</span>
          <span className={budgetRemaining >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
            Sisa: {formatCurrency(budgetRemaining)}
          </span>
        </div>
      </div>

      {/* Dynamic Status Alert */}
      <div className={`flex items-start gap-2.5 p-3 rounded-2xl text-xs ${
        isOverBudget ? 'bg-amber-50 border border-amber-100 text-amber-900' : 'bg-emerald-50 border border-emerald-100 text-emerald-900'
      }`}>
        {isOverBudget ? (
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="space-y-0.5">
          <p className="font-bold">
            {isOverBudget
              ? `Pengeluaran makan rata-rata ${formatCurrency(dailyActual)}/hari (melebihi target ${formatCurrency(dailyTarget)}).`
              : `Pengeluaran makan rata-rata aman dalam target ${formatCurrency(dailyTarget)}/hari.`
            }
          </p>
          <p className="text-gray-600">
            {daysRemaining > 0
              ? `Tersisa ${daysRemaining} hari hingga gajian tanggal ${salaryDate}. Batasi jatah harian agar budget tetap cukup!`
              : `Hari ini adalah tanggal gajian! Silakan setel budget baru untuk siklus berikutnya.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
