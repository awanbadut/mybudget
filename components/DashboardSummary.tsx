'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeSlash,
  PiggyBank,
  TrendUp,
} from '@phosphor-icons/react';

interface DashboardSummaryProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  savingRate: number;
  effectiveIncome: number;
  cycleLabel?: string;
}

export function DashboardSummary({
  balance,
  totalIncome,
  totalExpense,
  totalSavings,
  savingRate,
  effectiveIncome,
  cycleLabel,
}: DashboardSummaryProps) {
  const [showAmount, setShowAmount] = useState(true);

  const mask = '••••••';
  const display = (val: number) => {
    if (!showAmount) return mask;
    return formatCurrency(Math.abs(val));
  };

  const isPositive = balance >= 0;

  return (
    /* ── Double-Bezel outer shell ── */
    <div className="p-1.5 rounded-[1.6rem] bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.70)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] w-full min-w-0">
      {/* ── Inner core ── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1a1a1c] rounded-[calc(1.6rem-0.375rem)] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.32),inset_0_1px_1px_rgba(255,255,255,0.06)] p-5 sm:p-6 w-full min-w-0 transition-colors">
        {/* Inset top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/10 pointer-events-none" aria-hidden />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-zinc-400 dark:text-zinc-500 select-none">
            Saldo Tersedia
          </span>
          <button
            type="button"
            onClick={() => setShowAmount(!showAmount)}
            className="flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 px-2.5 py-1 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
            aria-label={showAmount ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
          >
            {showAmount
              ? <EyeSlash size={14} weight="regular" />
              : <Eye size={14} weight="regular" className="text-emerald-500" />}
            <span className="hidden sm:inline">{showAmount ? 'Sembunyikan' : 'Tampilkan'}</span>
          </button>
        </div>

        {/* Balance block */}
        <div className="mb-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 min-w-0">
            <p className="font-bold text-[clamp(2.2rem,6.5vw,3.8rem)] text-zinc-900 dark:text-white tracking-[-0.04em] tabular-nums leading-none break-all min-w-0">
              {balance < 0 && showAmount && <span className="text-rose-500">-</span>}
              {display(balance)}
            </p>
            <span className={`self-start sm:self-auto mb-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/60'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {isPositive ? 'Kas Sehat' : 'Defisit'}
            </span>
          </div>
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-2 leading-snug">
            {isPositive ? 'Total kas bersih yang tersedia' : 'Pengeluaran melebihi pemasukan tercatat'}
          </p>
        </div>

        {/* 4-metric strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-100 dark:bg-zinc-800/60 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800/60">
          <MetricCell
            label="Pemasukan"
            value={display(totalIncome)}
            sub={effectiveIncome > 0 && effectiveIncome !== totalIncome ? `Est. ${display(effectiveIncome)}` : (cycleLabel ?? 'Siklus ini')}
            icon={<ArrowDown size={13} weight="bold" className="text-emerald-600 dark:text-emerald-400" />}
            accent="emerald"
          />
          <MetricCell
            label="Pengeluaran"
            value={display(totalExpense)}
            sub={cycleLabel ?? 'Siklus ini'}
            icon={<ArrowUp size={13} weight="bold" className="text-rose-600 dark:text-rose-400" />}
            accent="rose"
          />
          <MetricCell
            label="Tabungan"
            value={display(totalSavings)}
            sub="Total terkumpul"
            icon={<PiggyBank size={13} weight="fill" className="text-indigo-600 dark:text-indigo-400" />}
            accent="indigo"
          />
          <MetricCell
            label="Porsi Simpanan"
            value={showAmount ? `${savingRate}%` : mask}
            sub="Target ≥ 20%"
            icon={<TrendUp size={13} weight="bold" className="text-amber-600 dark:text-amber-400" />}
            accent="amber"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'rose' | 'indigo' | 'amber';
}) {
  const dotColors: Record<string, string> = {
    emerald: 'bg-emerald-400/30 dark:bg-emerald-500/20',
    rose:    'bg-rose-400/30 dark:bg-rose-500/20',
    indigo:  'bg-indigo-400/30 dark:bg-indigo-500/20',
    amber:   'bg-amber-400/30 dark:bg-amber-500/20',
  };

  return (
    <div className="bg-white dark:bg-[#1c1c1e] px-3.5 py-3 space-y-1.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <div className={`w-[22px] h-[22px] rounded-md ${dotColors[accent]} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate">{label}</span>
      </div>
      <p className="font-bold text-[14px] sm:text-[15px] text-zinc-900 dark:text-white tabular-nums truncate leading-none">{value}</p>
      <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500 truncate leading-none">{sub}</p>
    </div>
  );
}
