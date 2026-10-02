'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { ArrowUpRight, ArrowDownLeft, Eye, EyeOff, PiggyBank, TrendingUp } from 'lucide-react';

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
    <div
      className="
        relative overflow-hidden
        bg-white dark:bg-[#1c1c1e]
        rounded-2xl
        border border-zinc-200/80 dark:border-zinc-700/50
        shadow-[0_1px_2px_rgba(0,0,0,0.04),_0_4px_16px_rgba(0,0,0,0.03)]
        dark:shadow-[0_1px_2px_rgba(0,0,0,0.20),_0_4px_20px_rgba(0,0,0,0.16)]
        p-5 sm:p-7
        space-y-6
        w-full min-w-0
        transition-colors
      "
    >
      {/* Subtle top inset highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10 pointer-events-none"
        aria-hidden
      />

      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-zinc-400 dark:text-zinc-500">
          Saldo Tersedia
        </span>
        <button
          type="button"
          onClick={() => setShowAmount(!showAmount)}
          className="
            flex items-center gap-1.5
            text-[12px] font-medium
            text-zinc-400 dark:text-zinc-500
            hover:text-zinc-700 dark:hover:text-zinc-300
            bg-zinc-100 dark:bg-zinc-800
            hover:bg-zinc-200/70 dark:hover:bg-zinc-700
            px-2.5 py-1 rounded-lg
            transition-colors active:scale-95
          "
          aria-label={showAmount ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
        >
          {showAmount
            ? <EyeOff className="w-3.5 h-3.5" strokeWidth={2} />
            : <Eye className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
          }
          <span className="hidden sm:inline">{showAmount ? 'Sembunyikan' : 'Tampilkan'}</span>
        </button>
      </div>

      {/* Main balance */}
      <div className="space-y-2 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-end gap-2.5 min-w-0">
          <p
            className="
              font-bold text-[clamp(2rem,6vw,3.25rem)]
              text-zinc-900 dark:text-white
              tracking-tight tabular-nums leading-none break-words
            "
          >
            {balance < 0 && showAmount && (
              <span className="text-rose-500">-</span>
            )}
            {display(balance)}
          </p>

          <span
            className={`
              inline-flex items-center gap-1.5 self-start sm:self-auto mb-0.5
              text-[11px] font-semibold px-2.5 py-1 rounded-full border
              ${isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/50'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/50'
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isPositive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {isPositive ? 'Kas Sehat' : 'Defisit'}
          </span>
        </div>

        <p className="text-[12.5px] text-zinc-400 dark:text-zinc-500">
          {isPositive
            ? 'Total saldo bersih yang tersedia saat ini'
            : 'Total pengeluaran melebihi pemasukan yang tercatat'}
        </p>
      </div>

      {/* 4 metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800 min-w-0">
        {/* Pemasukan */}
        <MetricTile
          label="Pemasukan"
          value={display(totalIncome)}
          sub={
            effectiveIncome > 0 && effectiveIncome !== totalIncome
              ? `Est. ${display(effectiveIncome)}`
              : cycleLabel ?? 'Siklus ini'
          }
          icon={<ArrowDownLeft className="w-3.5 h-3.5" strokeWidth={2.5} />}
          iconClass="bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        />

        {/* Pengeluaran */}
        <MetricTile
          label="Pengeluaran"
          value={display(totalExpense)}
          sub={cycleLabel ?? 'Siklus ini'}
          icon={<ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />}
          iconClass="bg-rose-100/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
        />

        {/* Tabungan */}
        <MetricTile
          label="Tabungan"
          value={display(totalSavings)}
          sub="Total terkumpul"
          icon={<PiggyBank className="w-3.5 h-3.5" strokeWidth={2.2} />}
          iconClass="bg-indigo-100/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
        />

        {/* Saving rate */}
        <MetricTile
          label="Porsi Tabungan"
          value={showAmount ? `${savingRate}%` : mask}
          sub="Target 20%"
          icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={2.2} />}
          iconClass="bg-amber-100/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
        />
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  sub,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-medium text-zinc-400 dark:text-zinc-500 truncate">
          {label}
        </span>
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ml-1 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
      <p className="font-bold text-sm sm:text-[15px] text-zinc-900 dark:text-white tabular-nums truncate leading-tight">
        {value}
      </p>
      <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500 truncate">
        {sub}
      </p>
    </div>
  );
}
