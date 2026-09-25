'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className="space-y-4">
      {/* Mobile Fintech Hero Wallet Card */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white p-5 sm:p-6 shadow-[0_12px_32px_rgba(37,99,235,0.28)]">
        {/* Glow & Decorative accents */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-100">Saldo Dompet Anda</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAmount(!showAmount)}
            className="flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full transition-colors active:scale-95"
          >
            {showAmount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showAmount ? 'Sembunyikan' : 'Tampilkan'}</span>
          </button>
        </div>

        {/* Big Balance */}
        <div className="relative z-10 mb-5">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {display(balance, balance < 0)}
          </p>
          <p className="text-xs text-blue-200/80 mt-1">
            {balance >= 0 ? 'Kondisi finansial aman' : 'Pengeluaran melebihi pemasukan'}
          </p>
        </div>

        {/* Income & Expense Glass Pills */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 pt-3 border-t border-white/15">
          {/* Income pill */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold mb-1">
              <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <TrendingUp className="w-2.5 h-2.5" />
              </div>
              <span>Pemasukan</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-white truncate">
              {display(totalIncome)}
            </p>
            {effectiveIncome > 0 && effectiveIncome !== totalIncome && (
              <p className="text-[10px] text-blue-200 truncate mt-0.5">
                Est. {display(effectiveIncome)}
              </p>
            )}
          </div>

          {/* Expense pill */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold mb-1">
              <div className="w-4 h-4 rounded-full bg-rose-400/20 flex items-center justify-center">
                <TrendingDown className="w-2.5 h-2.5" />
              </div>
              <span>Pengeluaran</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-white truncate">
              {display(totalExpense)}
            </p>
            <p className="text-[10px] text-blue-200 truncate mt-0.5">Bulan ini</p>
          </div>
        </div>

        {/* Tabungan & Saving Rate mini status */}
        <div className="relative z-10 mt-3 flex items-center justify-between text-xs text-blue-100 bg-black/15 backdrop-blur-sm rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5 truncate">
            <PiggyBank className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
            <span className="truncate">Tabungan: <strong className="text-white">{display(totalSavings)}</strong></span>
          </div>
          {savingRate > 0 && (
            <span className="bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold text-[11px] flex-shrink-0">
              {savingRate}% Saving Rate
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
