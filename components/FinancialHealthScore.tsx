'use client';

import { useMemo, useState } from 'react';
import { Activity, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, Sparkles, TrendingUp } from 'lucide-react';
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
    // 1. Saving Rate (Max 25 pts)
    let savingScore = 0;
    let savingStatus = 'Rendah';
    if (savingRate >= 20) {
      savingScore = 25;
      savingStatus = 'Optimal (≥20%)';
    } else if (savingRate >= 10) {
      savingScore = 18;
      savingStatus = 'Cukup (10-19%)';
    } else if (savingRate > 0) {
      savingScore = 10;
      savingStatus = 'Minimal (<10%)';
    } else {
      savingScore = 0;
      savingStatus = 'Defisit / 0%';
    }

    // 2. Budget Adherence (Max 25 pts)
    const activeBudgets = budgets.filter(b => b.amount > 0);
    const overBudgets = activeBudgets.filter(b => b.spent > b.amount);
    let budgetScore = 25;
    let budgetStatus = 'Terkendali';
    if (activeBudgets.length > 0) {
      if (overBudgets.length === 0) {
        budgetScore = 25;
        budgetStatus = 'Semua Sesuai Pagu';
      } else if (overBudgets.length === 1) {
        budgetScore = 15;
        budgetStatus = `1 Pos Melebihi (${overBudgets[0].category?.name || 'Pos Belanja'})`;
      } else {
        budgetScore = 5;
        budgetStatus = `${overBudgets.length} Pos Melebihi Target`;
      }
    }

    // 3. Debt Burden Ratio (Max 25 pts)
    const incomeBase = totalIncome > 0 ? totalIncome : 1;
    const debtRatio = Math.round((monthlyDebtAmount / incomeBase) * 100);
    let debtScore = 25;
    let debtStatus = 'Ringan';
    if (monthlyDebtAmount === 0) {
      debtScore = 25;
      debtStatus = 'Bebas Cicilan Utang';
    } else if (debtRatio <= 20) {
      debtScore = 25;
      debtStatus = `Aman (${debtRatio}% dari pemasukan)`;
    } else if (debtRatio <= 35) {
      debtScore = 15;
      debtStatus = `Moderat (${debtRatio}%)`;
    } else {
      debtScore = 5;
      debtStatus = `Tinggi (${debtRatio}% > 35%)`;
    }

    // 4. Cashflow Stability (Max 25 pts)
    let cashflowScore = 25;
    let cashflowStatus = 'Stabil';
    if (balance <= 0) {
      cashflowScore = 0;
      cashflowStatus = 'Defisit Arus Kas';
    } else {
      const dailyRemaining = daysRemaining > 0 ? Math.round(balance / daysRemaining) : balance;
      if (dailyRemaining < 20000 && daysRemaining > 5) {
        cashflowScore = 12;
        cashflowStatus = 'Pacing Kritis';
      } else {
        cashflowScore = 25;
        cashflowStatus = 'Likuiditas Aman';
      }
    }

    const totalScore = Math.min(100, Math.max(0, savingScore + budgetScore + debtScore + cashflowScore));

    let grade = 'A';
    let gradeLabel = 'Sangat Sehat';
    let gradeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';

    if (totalScore >= 85) {
      grade = 'A';
      gradeLabel = 'Sangat Prima';
      gradeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    } else if (totalScore >= 70) {
      grade = 'B';
      gradeLabel = 'Sehat Terkendali';
      gradeColor = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
    } else if (totalScore >= 50) {
      grade = 'C';
      gradeLabel = 'Cukup / Perlu Perhatian';
      gradeColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    } else {
      grade = 'D';
      gradeLabel = 'Perlu Penyesuaian Ketat';
      gradeColor = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
    }

    // Dynamic tips
    const tips: string[] = [];
    if (savingScore < 20) tips.push('Sisihkan minimal 10-20% di awal saat gajian tiba sebelum belanja pos non-primer.');
    if (overBudgets.length > 0) tips.push(`Koreksi pos anggaran ${overBudgets.map(b => b.category?.name).join(', ')} untuk mencegah defisit.`);
    if (debtRatio > 30) tips.push('Alokasikan dana darurat lebih besar dan prioritaskan pelunasan cicilan bunga tinggi.');
    if (balance > 0 && tips.length === 0) tips.push('Pola pengeluaran kamu konsisten. Pertahankan rasio simpanan untuk target tabungan jangka panjang.');

    return {
      totalScore,
      grade,
      gradeLabel,
      gradeColor,
      pillars: [
        { label: 'Rasio Tabungan', score: savingScore, max: 25, status: savingStatus },
        { label: 'Disiplin Pagu Anggaran', score: budgetScore, max: 25, status: budgetStatus },
        { label: 'Rasio Beban Cicilan', score: debtScore, max: 25, status: debtStatus },
        { label: 'Ketahanan Arus Kas', score: cashflowScore, max: 25, status: cashflowStatus },
      ],
      tips,
    };
  }, [savingRate, totalIncome, monthlyDebtAmount, budgets, balance, daysRemaining]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
            <Activity className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white leading-none">
                Skor Kesehatan Finansial
              </h3>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md border', evaluation.gradeColor)}>
                Grade {evaluation.grade}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Evaluasi 4 pilar: tabungan, pagu anggaran, rasio utang & kas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="font-sans font-bold text-xl sm:text-2xl text-zinc-900 dark:text-white tabular-nums leading-none">
              {evaluation.totalScore}
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">/100</span>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Lihat rincian skor"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-stone-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            evaluation.totalScore >= 80 ? 'bg-emerald-500' : evaluation.totalScore >= 60 ? 'bg-blue-500' : 'bg-amber-500'
          )}
          style={{ width: `${evaluation.totalScore}%` }}
        />
      </div>

      {/* Expanded Breakdown */}
      {expanded && (
        <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-zinc-800 space-y-3.5 text-xs animate-in fade-in-50 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {evaluation.pillars.map(p => (
              <div
                key={p.label}
                className="p-2.5 rounded-xl bg-stone-50/70 dark:bg-zinc-800/40 border border-stone-200/50 dark:border-zinc-800 space-y-1"
              >
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{p.label}</span>
                  <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
                    {p.score}/{p.max}
                  </span>
                </div>
                <div className="w-full bg-stone-200/80 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-white rounded-full"
                    style={{ width: `${(p.score / p.max) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{p.status}</p>
              </div>
            ))}
          </div>

          {evaluation.tips.length > 0 && (
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/70 dark:border-zinc-800 flex items-start gap-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Saran Optimalisasi:</span>
                {evaluation.tips.map((tip, idx) => (
                  <p key={idx} className="leading-relaxed">
                    • {tip}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
