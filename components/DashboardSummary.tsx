'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { ArrowUpRight, ArrowDownLeft, Eye, EyeOff, ShieldCheck, Landmark } from 'lucide-react';

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
    <div className="space-y-3">
      {/* Architectural Obsidian Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-5 sm:p-6 border border-zinc-800/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        {/* Subtle, restrained top sheen (not loud purple AI glow) */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-zinc-800/40 via-zinc-900/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Top bar with Card identifier & Privacy Toggle */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Landmark className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
              Main Balance
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAmount(!showAmount)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full transition-all active:scale-95"
            aria-label={showAmount ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
          >
            {showAmount ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span className="font-mono">{showAmount ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {/* Dominant Net Balance */}
        <div className="relative z-10 mb-6">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-zinc-50">
              {display(balance, balance < 0)}
            </p>
          </div>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${balance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {balance >= 0 ? 'Saldo bersih operasional bulan ini' : 'Pengeluaran melebihi total pemasukan'}
          </p>
        </div>

        {/* Structured Financial Division Strip */}
        <div className="relative z-10 grid grid-cols-2 gap-2 pt-3 border-t border-zinc-850 border-zinc-800/80">
          {/* Income Sub-panel */}
          <div className="bg-zinc-900/60 rounded-2xl p-3 border border-zinc-800/70">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span className="text-[11px] tracking-wide uppercase font-mono text-zinc-400">Pemasukan</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-zinc-100 tabular-nums truncate">
              {display(totalIncome)}
            </p>
            {effectiveIncome > 0 && effectiveIncome !== totalIncome && (
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                Estimasi gaji: {display(effectiveIncome)}
              </p>
            )}
          </div>

          {/* Expense Sub-panel */}
          <div className="bg-zinc-900/60 rounded-2xl p-3 border border-zinc-800/70">
            <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-semibold mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[11px] tracking-wide uppercase font-mono text-zinc-400">Pengeluaran</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-zinc-100 tabular-nums truncate">
              {display(totalExpense)}
            </p>
            <p className="text-[10px] text-zinc-400 truncate mt-0.5">Bulan berjalan</p>
          </div>
        </div>

        {/* Tabungan & Saving Rate mini status footer */}
        <div className="relative z-10 mt-2.5 flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/40 rounded-xl px-3 py-2 border border-zinc-850 border-zinc-800/50">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-zinc-500 font-mono text-[11px]">Tabungan:</span>
            <span className="font-semibold text-zinc-200 tabular-nums truncate">{display(totalSavings)}</span>
          </div>
          {savingRate > 0 && (
            <span className="font-mono text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              {savingRate}% Saving Rate
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
