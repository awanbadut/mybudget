'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { ArrowUpRight, ArrowDownLeft, Eye, EyeOff, Wallet, PiggyBank, Sparkles } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
          Saldo Tersedia
        </span>

        <button
          type="button"
          onClick={() => setShowAmount(!showAmount)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 bg-stone-100/80 hover:bg-stone-200/70 px-2.5 py-1 rounded-lg transition-colors font-medium"
          aria-label={showAmount ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
        >
          {showAmount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
          <span>{showAmount ? 'Sembunyikan' : 'Tampilkan'}</span>
        </button>
      </div>

      {/* Main Balance Display */}
      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="font-sans font-bold text-3xl sm:text-4xl lg:text-5xl text-zinc-900 tracking-tight tabular-nums">
            {display(balance, balance < 0)}
          </p>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                : 'bg-rose-50 text-rose-700 border-rose-200/70'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPositive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {isPositive ? 'Arus Kas Aman' : 'Defisit Pengeluaran'}
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          {isPositive
            ? 'Kondisi kas terkendali. Surplus operasional siap dialokasikan ke tabungan.'
            : 'Perhatian: Total pengeluaran melebihi pemasukan yang tercatat bulan ini.'}
        </p>
      </div>

      {/* 4 Financial Sub-Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
        {/* Pemasukan */}
        <div className="bg-stone-50/60 rounded-xl p-3.5 border border-stone-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Pemasukan</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="font-sans font-semibold text-base sm:text-lg text-zinc-900 tabular-nums truncate">
            {display(totalIncome)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
            {effectiveIncome > 0 && effectiveIncome !== totalIncome
              ? `Est. Gaji: ${display(effectiveIncome)}`
              : 'Bulan ini'}
          </p>
        </div>

        {/* Pengeluaran */}
        <div className="bg-stone-50/60 rounded-xl p-3.5 border border-stone-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Pengeluaran</span>
            <div className="w-6 h-6 rounded-lg bg-rose-100/70 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="font-sans font-semibold text-base sm:text-lg text-zinc-900 tabular-nums truncate">
            {display(totalExpense)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Bulan ini
          </p>
        </div>

        {/* Tabungan */}
        <div className="bg-stone-50/60 rounded-xl p-3.5 border border-stone-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Tabungan</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center">
              <PiggyBank className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="font-sans font-semibold text-base sm:text-lg text-zinc-900 tabular-nums truncate">
            {display(totalSavings)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Total terkumpul
          </p>
        </div>

        {/* Saving Rate */}
        <div className="bg-stone-50/60 rounded-xl p-3.5 border border-stone-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Rasio Simpan</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="font-sans font-semibold text-base sm:text-lg text-zinc-900 tabular-nums truncate">
            {savingRate}%
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Target ideal 20%
          </p>
        </div>
      </div>
    </div>
  );
}
