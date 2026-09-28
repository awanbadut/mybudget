'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { ArrowUpRight, ArrowDownLeft, Eye, EyeOff, Wallet, PiggyBank } from 'lucide-react';

interface DashboardSummaryProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  savingRate: number;
  effectiveIncome: number;
}

export function DashboardSummary({
  balance,
  totalIncome,
  totalExpense,
  totalSavings,
  savingRate,
  effectiveIncome,
}: DashboardSummaryProps) {
  const [showAmount, setShowAmount] = useState(true);

  const display = (val: number, isNegative = false) => {
    if (!showAmount) return '••••••••';
    const formatted = formatCurrency(Math.abs(val));
    return isNegative ? `-${formatted}` : formatted;
  };

  const isPositive = balance >= 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5 sm:space-y-6 w-full min-w-0 transition-colors">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
          Saldo Tersedia
        </span>

        <button
          type="button"
          onClick={() => setShowAmount(!showAmount)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-stone-100/80 dark:bg-zinc-800 hover:bg-stone-200/70 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-colors font-medium active:scale-95"
          aria-label={showAmount ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
        >
          {showAmount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          <span>{showAmount ? 'Sembunyikan' : 'Tampilkan'}</span>
        </button>
      </div>

      {/* Main Balance Display */}
      <div className="space-y-1.5 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 min-w-0">
          <p className="font-sans font-bold text-2xl sm:text-4xl lg:text-5xl text-zinc-900 dark:text-white tracking-tight tabular-nums break-words leading-none">
            {display(balance, balance < 0)}
          </p>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-0.5 sm:py-1 rounded-full border self-start sm:self-auto ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPositive ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400'
              }`}
            />
            {isPositive ? 'Arus Kas Aman' : 'Defisit Pengeluaran'}
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {isPositive
            ? 'Kondisi kas terkendali. Surplus operasional siap dialokasikan ke tabungan.'
            : 'Perhatian: Total pengeluaran melebihi pemasukan tercatat.'}
        </p>
      </div>

      {/* 4 Financial Sub-Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-2 border-t border-stone-100 dark:border-zinc-800 min-w-0">
        {/* Pemasukan */}
        <div className="bg-stone-50/60 dark:bg-zinc-800/50 rounded-xl p-3 sm:p-3.5 border border-stone-200/60 dark:border-zinc-700/60 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">Pemasukan</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="font-sans font-semibold text-sm sm:text-base lg:text-lg text-zinc-900 dark:text-white tabular-nums truncate">
            {display(totalIncome)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            {effectiveIncome > 0 && effectiveIncome !== totalIncome
              ? `Est. Gaji: ${display(effectiveIncome)}`
              : 'Bulan ini'}
          </p>
        </div>

        {/* Pengeluaran */}
        <div className="bg-stone-50/60 dark:bg-zinc-800/50 rounded-xl p-3 sm:p-3.5 border border-stone-200/60 dark:border-zinc-700/60 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">Pengeluaran</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="font-sans font-semibold text-sm sm:text-base lg:text-lg text-zinc-900 dark:text-white tabular-nums truncate">
            {display(totalExpense)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Bulan ini
          </p>
        </div>

        {/* Tabungan */}
        <div className="bg-stone-50/60 dark:bg-zinc-800/50 rounded-xl p-3 sm:p-3.5 border border-stone-200/60 dark:border-zinc-700/60 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">Tabungan</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <PiggyBank className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="font-sans font-semibold text-sm sm:text-base lg:text-lg text-zinc-900 dark:text-white tabular-nums truncate">
            {display(totalSavings)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Terkumpul
          </p>
        </div>

        {/* Saving Rate */}
        <div className="bg-stone-50/60 dark:bg-zinc-800/50 rounded-xl p-3 sm:p-3.5 border border-stone-200/60 dark:border-zinc-700/60 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">Rasio Simpan</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="font-sans font-semibold text-sm sm:text-base lg:text-lg text-zinc-900 dark:text-white tabular-nums truncate">
            {savingRate}%
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Target 20%
          </p>
        </div>
      </div>
    </div>
  );
}
