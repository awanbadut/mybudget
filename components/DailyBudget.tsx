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
    <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 sm:p-6 shadow-[3px_3px_0px_#24201D] space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24201D]/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#D9381E] tracking-wider uppercase">
            PLANK 02
          </span>
          <span className="text-[#24201D]/30">/</span>
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#706860] uppercase">
            <Utensils className="w-3.5 h-3.5 text-[#24201D]" />
            <span>Pacing Makan Harian (Siklus 25-25)</span>
          </div>
        </div>

        <div className="bg-[#EDE6DC] border border-[#24201D]/30 text-[#24201D] px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider">
          TGL GAJIAN: {salaryDate} · {daysRemaining} HARI LAGI
        </div>
      </div>

      {/* Main Focus: Jatah Makan Hari Ini */}
      <div className="bg-[#EDE6DC] border-2 border-[#24201D] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] font-bold text-[#706860] uppercase tracking-widest block mb-1">
            Jatah Aman Konsumsi Hari Ini
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#24201D] tabular-nums">
              {formatCurrency(dailyAllowance)}
            </span>
            <span className="font-mono text-xs text-[#706860]">/ hari</span>
          </div>
          <p className="font-sans text-xs text-[#3D3834] mt-1.5">
            Target standar ideal: <strong className="font-mono">{formatCurrency(dailyTarget)}/hari</strong> untuk siklus {label} ({totalDays} hari penuh).
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 border-[#24201D]/20 pt-3 sm:pt-0">
          <div className="bg-[#FAF7F2] border border-[#24201D] px-3 py-1.5 text-center">
            <span className="font-mono text-[10px] text-[#706860] uppercase block">Sisa Hari Siklus</span>
            <span className="font-display font-bold text-xl text-[#24201D] tabular-nums">{daysRemaining} Hari</span>
          </div>
          <span className={`font-mono text-[11px] font-bold px-2 py-0.5 border uppercase ${
            isOverBudget
              ? 'bg-[#FBEBE8] border-[#D9381E] text-[#D9381E]'
              : 'bg-[#EAF4F5] border-[#2A7B88] text-[#2A7B88]'
          }`}>
            {isOverBudget ? 'PERLU REM' : 'PACING AMAN'}
          </span>
        </div>
      </div>

      {/* Progress & Breakdown Strip */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#706860]">
            Terpakai: <strong className="text-[#24201D] tabular-nums">{formatCurrency(foodSpent)}</strong> ({percentageSpent}%)
          </span>
          <span className="text-[#706860]">
            Sisa Budget: <strong className={budgetRemaining >= 0 ? 'text-[#2A7B88] tabular-nums' : 'text-[#D9381E] tabular-nums'}>
              {formatCurrency(budgetRemaining)}
            </strong>
          </span>
        </div>

        {/* Letterpress Pacing Ruler Bar */}
        <div className="w-full bg-[#E2D7C7] h-3 border border-[#24201D] p-[1px] relative overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOverBudget ? 'bg-[#D9381E]' : 'bg-[#2A7B88]'
            }`}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono text-[#706860]">
          <span>Total Alokasi: {formatCurrency(foodBudgetTotal)}</span>
          <span>Rerata Tercatat: {formatCurrency(dailyActual)}/hari</span>
        </div>
      </div>
    </div>
  );
}
