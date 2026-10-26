'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { useBalanceVisibility } from '@/context/BalanceVisibilityContext';
import { Bank, CheckCircle, Warning } from '@phosphor-icons/react';
import { Wallet, PiggyBank, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetWorthCardProps {
  totalSavings: number;
  currentBalance: number;
  totalPendingDebt: number;
}

export function NetWorthCard({
  totalSavings,
  currentBalance,
  totalPendingDebt,
}: NetWorthCardProps) {
  const { showBalance, formatMasked } = useBalanceVisibility();
  const {
    liquidCash,
    savingsAsset,
    totalAssets,
    totalLiabilities,
    netWorth,
    isPositive,
    cashRatio,
    savingsRatio,
    debtRatio,
  } = useMemo(() => {
    const liquid = Math.max(0, currentBalance);
    const sav = Math.max(0, totalSavings);
    const assets = sav + liquid;
    const liabilities = Math.max(0, totalPendingDebt);
    const net = assets - liabilities;
    const totalVolume = assets + liabilities;

    const cRatio = totalVolume > 0 ? Math.round((liquid / totalVolume) * 100) : 50;
    const sRatio = totalVolume > 0 ? Math.round((sav / totalVolume) * 100) : 50;
    const dRatio = totalVolume > 0 ? Math.max(0, 100 - cRatio - sRatio) : 0;

    return {
      liquidCash: liquid,
      savingsAsset: sav,
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorth: net,
      isPositive: net >= 0,
      cashRatio: cRatio,
      savingsRatio: sRatio,
      debtRatio: dRatio,
    };
  }, [totalSavings, currentBalance, totalPendingDebt]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5 transition-colors space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <Bank size={15} weight="fill" />
          </div>
          <div>
            <h3 className="font-semibold text-[13.5px] sm:text-[14.5px] text-zinc-900 dark:text-white leading-none">
              Kekayaan Bersih (Net Worth)
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 leading-snug">
              Kas operasional + tabungan dikurangi sisa utang (tanpa saldo dobel)
            </p>
          </div>
        </div>
        <span
          className={cn(
            'text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0 flex items-center gap-1',
            isPositive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          )}
        >
          {isPositive ? <CheckCircle size={11} weight="fill" /> : <Warning size={11} weight="fill" />}
          {isPositive ? 'Positif' : 'Defisit'}
        </span>
      </div>

      {/* Net worth main number */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="space-y-0.5">
          <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">
            Nilai Bersih Saat Ini
          </span>
          <p
            className={cn(
              'font-bold text-2xl sm:text-3xl tabular-nums tracking-tight leading-none',
              isPositive ? 'text-zinc-900 dark:text-white' : 'text-red-600 dark:text-red-500'
            )}
          >
            {formatMasked(netWorth)}
          </p>
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium tabular-nums">
          Total Aset: <strong className="text-emerald-600 dark:text-emerald-400">{formatMasked(totalAssets)}</strong>
        </div>
      </div>

      {/* Multi-segment Asset vs Debt Bar */}
      <div className="space-y-2">
        <div className="w-full h-2 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
          {cashRatio > 0 && (
            <div
              className="bg-blue-600 h-full transition-all duration-700"
              style={{ width: `${cashRatio}%` }}
              title="Kas Operasional"
            />
          )}
          {savingsRatio > 0 && (
            <div
              className="bg-emerald-500 h-full transition-all duration-700"
              style={{ width: `${savingsRatio}%` }}
              title="Tabungan"
            />
          )}
          {debtRatio > 0 && (
            <div
              className="bg-rose-500 h-full transition-all duration-700"
              style={{ width: `${debtRatio}%` }}
              title="Utang"
            />
          )}
        </div>

        {/* 3-Pillar Transparent Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-stone-50/80 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <Wallet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Kas Operasional</span>
            </div>
            <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white tabular-nums">
              {formatMasked(liquidCash)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <PiggyBank className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Simpanan Tabungan</span>
            </div>
            <span className="font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 tabular-nums">
              {formatMasked(savingsAsset)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
              <CreditCard className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>Sisa Utang / Cicilan</span>
            </div>
            <span className="font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400 tabular-nums">
              {showBalance ? (totalLiabilities > 0 ? `-${formatCurrency(totalLiabilities)}` : 'Rp 0') : '••••••'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
