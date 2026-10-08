'use client';

import { useMemo, useState } from 'react';
import { Pulse, ShieldCheck, Warning, CaretDown, CaretUp, Sparkle, TrendUp } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface BudgetStatus {
  amount: number;
  spent: number;
  percentage: number;
  category?: { name: string } | null;
}

interface FinancialHealthScoreProps {
  savingRate: number;
  totalIncome: number;
  totalExpense: number;
  monthlyDebtAmount: number;
  budgets: BudgetStatus[];
  balance: number;
  daysRemaining: number;
}

export function FinancialHealthScore({
  savingRate,
  totalIncome,
  totalExpense,
  monthlyDebtAmount,
  budgets,
  balance,
  daysRemaining,
}: FinancialHealthScoreProps) {
  const [expanded, setExpanded] = useState(false);

  const evaluation = useMemo(() => {
    // 1. Saving Rate (max 25)
    let savingScore = 0;
    let savingStatus = 'Rendah';
    if (savingRate >= 20) { savingScore = 25; savingStatus = 'Optimal (≥20%)'; }
    else if (savingRate >= 10) { savingScore = 18; savingStatus = 'Cukup (10–19%)'; }
    else if (savingRate > 0) { savingScore = 10; savingStatus = 'Minimal (<10%)'; }
    else { savingScore = 0; savingStatus = 'Defisit / 0%'; }

    // 2. Budget Adherence (max 25)
    const activeBudgets = budgets.filter(b => b.amount > 0);
    const overBudgets = activeBudgets.filter(b => b.spent > b.amount);
    let budgetScore = 25;
    let budgetStatus = 'Terkendali';
    if (activeBudgets.length > 0) {
      if (overBudgets.length === 0) { budgetScore = 25; budgetStatus = 'Semua sesuai rencana'; }
      else if (overBudgets.length === 1) { budgetScore = 15; budgetStatus = `1 pos melebihi (${overBudgets[0].category?.name || 'Pos Belanja'})`; }
      else { budgetScore = 5; budgetStatus = `${overBudgets.length} pos melebihi batas`; }
    }

    // 3. Debt Ratio (max 25)
    const incomeBase = totalIncome > 0 ? totalIncome : 1;
    const debtRatio = Math.round((monthlyDebtAmount / incomeBase) * 100);
    let debtScore = 25;
    let debtStatus = 'Ringan';
    if (monthlyDebtAmount === 0) { debtScore = 25; debtStatus = 'Bebas cicilan'; }
    else if (debtRatio <= 20) { debtScore = 25; debtStatus = `Aman (${debtRatio}%)`; }
    else if (debtRatio <= 35) { debtScore = 15; debtStatus = `Moderat (${debtRatio}%)`; }
    else { debtScore = 5; debtStatus = `Tinggi (${debtRatio}%)`; }

    // 4. Cashflow (max 25)
    let cashflowScore = 25;
    let cashflowStatus = 'Stabil';
    if (balance <= 0) { cashflowScore = 0; cashflowStatus = 'Defisit kas'; }
    else {
      const dailyRemaining = daysRemaining > 0 ? Math.round(balance / daysRemaining) : balance;
      if (dailyRemaining < 20000 && daysRemaining > 5) { cashflowScore = 12; cashflowStatus = 'Kas menipis'; }
      else { cashflowScore = 25; cashflowStatus = 'Kas aman'; }
    }

    const totalScore = Math.min(100, Math.max(0, savingScore + budgetScore + debtScore + cashflowScore));

    let grade = 'A';
    let gradeLabel = 'Sangat Prima';
    let gradeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60';
    let barColor = 'bg-emerald-500';

    if (totalScore >= 85) {
      grade = 'A'; gradeLabel = 'Sangat Prima'; gradeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'; barColor = 'bg-emerald-500';
    } else if (totalScore >= 70) {
      grade = 'B'; gradeLabel = 'Sehat'; gradeColor = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'; barColor = 'bg-blue-500';
    } else if (totalScore >= 50) {
      grade = 'C'; gradeLabel = 'Perlu Perhatian'; gradeColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'; barColor = 'bg-amber-500';
    } else {
      grade = 'D'; gradeLabel = 'Perlu Perbaikan'; gradeColor = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'; barColor = 'bg-rose-500';
    }

    const tips: string[] = [];
    if (savingScore < 20) tips.push('Sisihkan minimal 10–20% setelah gajian tiba sebelum belanja pos lain.');
    if (overBudgets.length > 0) tips.push(`Kurangi pengeluaran ${overBudgets.map(b => b.category?.name).join(', ')} bulan depan.`);
    if (debtRatio > 30) tips.push('Prioritaskan pelunasan cicilan bunga tinggi untuk menurunkan beban utang.');
    if (balance > 0 && tips.length === 0) tips.push('Pola pengeluaran konsisten. Pertahankan dan tingkatkan target tabungan.');

    return {
      totalScore, grade, gradeLabel, gradeColor, barColor,
      pillars: [
        { label: 'Porsi Tabungan', score: savingScore, max: 25, status: savingStatus },
        { label: 'Disiplin Anggaran', score: budgetScore, max: 25, status: budgetStatus },
        { label: 'Beban Cicilan', score: debtScore, max: 25, status: debtStatus },
        { label: 'Kondisi Kas', score: cashflowScore, max: 25, status: cashflowStatus },
      ],
      tips,
    };
  }, [savingRate, totalIncome, monthlyDebtAmount, budgets, balance, daysRemaining]);

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.20)] p-4 sm:p-5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Pulse size={15} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-[13.5px] sm:text-[14.5px] text-zinc-900 dark:text-white leading-none">
                Skor Finansial
              </h3>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md border', evaluation.gradeColor)}>
                {evaluation.grade}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              {evaluation.gradeLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="font-bold text-xl sm:text-2xl text-zinc-900 dark:text-white tabular-nums leading-none">
              {evaluation.totalScore}
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">/100</span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            {expanded ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-3.5 w-full bg-zinc-100 dark:bg-zinc-800 h-[4px] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', evaluation.barColor)}
          style={{ width: `${evaluation.totalScore}%` }}
        />
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {evaluation.pillars.map(p => (
              <div
                key={p.label}
                className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/60 space-y-1.5"
              >
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">{p.label}</span>
                  <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{p.score}/{p.max}</span>
                </div>
                <div className="w-full bg-zinc-200/80 dark:bg-zinc-700 h-[3px] rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all" style={{ width: `${(p.score / p.max) * 100}%` }} />
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{p.status}</p>
              </div>
            ))}
          </div>

          {evaluation.tips.length > 0 && (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-start gap-2.5">
              <Sparkle size={14} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Saran:</span>
                {evaluation.tips.map((tip, idx) => (
                  <p key={idx} className="leading-relaxed">• {tip}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
