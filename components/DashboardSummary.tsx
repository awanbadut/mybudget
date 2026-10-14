'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { useBalanceVisibility } from '@/context/BalanceVisibilityContext';
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
  const { showBalance: showAmount, toggleBalance } = useBalanceVisibility();

  const mask = '••••••';
  const display = (val: number) => {
    if (!showAmount) return mask;
    return formatCurrency(Math.abs(val));
  };

  const isPositive = balance >= 0;

  return (
    /* Double-Bezel outer shell */
    <div className="p-1.5 rounded-[1.6rem] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 w-full min-w-0">
      {/* Inner core */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-[calc(1.6rem-0.375rem)] shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.40)] p-5 sm:p-6 w-full min-w-0 transition-colors">
        {/* Inset top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/10 pointer-events-none" aria-hidden />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-zinc-400 dark:text-zinc-500 select-none">
            Saldo Tersedia
          </span>
          <button
            type="button"
            onClick={toggleBalance}
            className="flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-all duration-200 active:scale-95"
            aria-label={showAmount ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
          >
            {showAmount
              ? <EyeSlash size={14} weight="regular" />
              : <Eye size={14} weight="regular" />}
            <span className="hidden sm:inline">{showAmount ? 'Sembunyikan' : 'Tampilkan'}</span>
          </button>
        </div>

        {/* Balance block */}
        <div className="mb-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 min-w-0">
            <p className="font-bold text-[clamp(2.2rem,6.5vw,3.8rem)] text-zinc-900 dark:text-white tracking-[-0.04em] tabular-nums leading-none break-all min-w-0">
              {balance < 0 && showAmount && <span className="text-red-600 dark:text-red-500">-</span>}
              {display(balance)}
            </p>
            {/* Status badge — solid, no washed-out pastels */}
            <span className={`self-start sm:self-auto mb-0.5 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full ${
              isPositive
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
              {isPositive ? 'Kas Sehat' : 'Defisit'}
            </span>
          </div>
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-2 leading-snug">
            {isPositive ? 'Total kas bersih yang tersedia' : 'Pengeluaran melebihi pemasukan tercatat'}
          </p>
        </div>

        {/* 4-metric strip — solid icon backgrounds */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
          <MetricCell
            label="Pemasukan"
            value={display(totalIncome)}
            sub={effectiveIncome > 0 && effectiveIncome !== totalIncome ? `Est. ${display(effectiveIncome)}` : (cycleLabel ?? 'Siklus ini')}
            icon={<ArrowDown size={13} weight="bold" className="text-white" />}
            iconBg="bg-green-600"
          />
          <MetricCell
            label="Pengeluaran"
            value={display(totalExpense)}
            sub={cycleLabel ?? 'Siklus ini'}
            icon={<ArrowUp size={13} weight="bold" className="text-white" />}
            iconBg="bg-red-600"
          />
          <MetricCell
            label="Tabungan"
            value={display(totalSavings)}
            sub="Total terkumpul"
            icon={<PiggyBank size={13} weight="fill" className="text-white" />}
            iconBg="bg-blue-600"
          />
          <MetricCell
            label="Porsi Simpanan"
            value={showAmount ? `${savingRate}%` : mask}
            sub="Target ≥ 20%"
            icon={<TrendUp size={13} weight="bold" className="text-white" />}
            iconBg="bg-zinc-700 dark:bg-zinc-600"
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
  iconBg,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 px-3.5 py-3 space-y-1.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <div className={`w-[22px] h-[22px] rounded-md ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate">{label}</span>
      </div>
      <p className="font-bold text-[14px] sm:text-[15px] text-zinc-900 dark:text-white tabular-nums truncate leading-none">{value}</p>
      <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500 truncate leading-none">{sub}</p>
    </div>
  );
}
