'use client';

import Link from 'next/link';
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
import { Sparkles, ShieldCheck, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';
import { cn, triggerHaptic } from '@/lib/utils';

interface DashboardSummaryProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  savingRate: number;
  effectiveIncome: number;
  cycleLabel?: string;
  isHistorical?: boolean;
  budgetRemainingTotal?: number;
  safeDailySpend?: number;
  daysRemaining?: number;
}

export function DashboardSummary({
  balance,
  totalIncome,
  totalExpense,
  savingRate,
  cycleLabel,
  isHistorical = false,
  budgetRemainingTotal = 0,
  safeDailySpend,
  daysRemaining,
}: DashboardSummaryProps) {
  const { showBalance: showAmount, toggleBalance } = useBalanceVisibility();

  const mask = '••••••';
  const display = (val: number) => {
    if (!showAmount) return mask;
    return formatCurrency(Math.abs(val));
  };

  const cycleNetCash = totalIncome - totalExpense;
  const heroValue = isHistorical ? cycleNetCash : balance;
  const isPositive = heroValue >= 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-4 sm:p-6 w-full min-w-0 transition-colors space-y-4">
      {/* Top Row: Label + Eye Toggle & Status Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none">
            {isHistorical ? `Sisa Siklus (${cycleLabel})` : 'Total Saldo Aktif'}
          </span>
          <button
            type="button"
            onClick={toggleBalance}
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
            aria-label={showAmount ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
          >
            {showAmount ? <EyeSlash size={14} weight="bold" /> : <Eye size={14} weight="bold" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {!isHistorical && daysRemaining !== undefined && (
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
              {daysRemaining}h lagi
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full',
              isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', isPositive ? 'bg-emerald-500' : 'bg-rose-500')} />
            {isHistorical ? (isPositive ? 'Surplus' : 'Defisit') : isPositive ? 'Aman' : 'Defisit'}
          </span>
        </div>
      </div>

      {/* Main Balance & Safe Daily Spend Pill */}
      <div>
        <p className="font-extrabold text-[clamp(2rem,6vw,3.2rem)] text-zinc-900 dark:text-white tracking-[-0.03em] tabular-nums leading-none break-all">
          {heroValue < 0 && showAmount && <span className="text-rose-600 dark:text-rose-500">-</span>}
          {display(heroValue)}
        </p>

        {!isHistorical && safeDailySpend !== undefined && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100/90 dark:bg-zinc-800/80 text-xs">
            {safeDailySpend > 0 ? (
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Aman belanja:</span>
            <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
              {display(safeDailySpend)}/hari
            </span>
          </div>
        )}
      </div>

      {/* DANA-Style 4 Primary Quick Actions Dock */}
      {!isHistorical && (
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-100 dark:border-zinc-800/80">
          <Link
            href="/transactions?action=new&type=expense"
            onClick={() => triggerHaptic('light')}
            className="group flex flex-col items-center gap-1.5 py-2 rounded-2xl hover:bg-stone-50 dark:hover:bg-zinc-800/50 active:scale-95 transition-all touch-manipulation"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-5 h-5 stroke-[2.25]" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Keluar</span>
          </Link>

          <Link
            href="/transactions?action=new&type=income"
            onClick={() => triggerHaptic('light')}
            className="group flex flex-col items-center gap-1.5 py-2 rounded-2xl hover:bg-stone-50 dark:hover:bg-zinc-800/50 active:scale-95 transition-all touch-manipulation"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.25]" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Masuk</span>
          </Link>

          <Link
            href="/transactions?action=new&type=transfer"
            onClick={() => triggerHaptic('light')}
            className="group flex flex-col items-center gap-1.5 py-2 rounded-2xl hover:bg-stone-50 dark:hover:bg-zinc-800/50 active:scale-95 transition-all touch-manipulation"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <ArrowLeftRight className="w-5 h-5 stroke-[2.25]" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Pindah</span>
          </Link>

          <Link
            href="/savings"
            onClick={() => triggerHaptic('light')}
            className="group flex flex-col items-center gap-1.5 py-2 rounded-2xl hover:bg-stone-50 dark:hover:bg-zinc-800/50 active:scale-95 transition-all touch-manipulation"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <PiggyBank size={20} weight="fill" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Tabungan</span>
          </Link>
        </div>
      )}

      {/* Clean 2x2 Cashflow Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
        <MetricCell
          label="Pemasukan"
          value={display(totalIncome)}
          icon={<ArrowDown size={12} weight="bold" className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
        />
        <MetricCell
          label="Pengeluaran"
          value={display(totalExpense)}
          icon={<ArrowUp size={12} weight="bold" className="text-rose-600 dark:text-rose-400" />}
          iconBg="bg-rose-50 dark:bg-rose-950/50"
        />
        <MetricCell
          label="Selisih Siklus"
          value={`${cycleNetCash < 0 && showAmount ? '-' : ''}${display(cycleNetCash)}`}
          icon={<PiggyBank size={12} weight="fill" className="text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-950/50"
        />
        <MetricCell
          label={`Sisa Budget (${showAmount ? `${savingRate}%` : '••'})`}
          value={`${budgetRemainingTotal < 0 && showAmount ? '-' : ''}${display(budgetRemainingTotal)}`}
          icon={<TrendUp size={12} weight="bold" className="text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-950/50"
        />
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-stone-50/80 dark:bg-zinc-800/50 rounded-2xl px-3 py-2.5 space-y-1 min-w-0 border border-stone-100 dark:border-zinc-800">
      <div className="flex items-center gap-1.5">
        <div className={`w-5 h-5 rounded-md ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">{label}</span>
      </div>
      <p className="font-bold text-[13.5px] sm:text-sm text-zinc-900 dark:text-white tabular-nums truncate leading-tight">
        {value}
      </p>
    </div>
  );
}
