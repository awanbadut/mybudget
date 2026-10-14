'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { useBalanceVisibility } from '@/context/BalanceVisibilityContext';
import { Bank, CheckCircle, Warning } from '@phosphor-icons/react';
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
  const { totalAssets, totalLiabilities, netWorth, isPositive, assetRatio } = useMemo(() => {
    const liquidCash = Math.max(0, currentBalance);
    const assets = totalSavings + liquidCash;
    const liabilities = totalPendingDebt;
    const net = assets - liabilities;
    const totalVolume = assets + liabilities;
    const ratio = totalVolume > 0 ? Math.round((assets / totalVolume) * 100) : 100;

    return {
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorth: net,
      isPositive: net >= 0,
      assetRatio: ratio,
    };
  }, [totalSavings, currentBalance, totalPendingDebt]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5 transition-colors space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Solid icon bg */}
          <div className="w-8 h-8 rounded-[10px] bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <Bank size={15} weight="fill" />
          </div>
          <div>
            <h3 className="font-semibold text-[13.5px] sm:text-[14.5px] text-zinc-900 dark:text-white leading-none">
              Kekayaan Bersih
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 leading-snug">
              Aset &amp; kas dikurangi sisa utang
            </p>
          </div>
        </div>
        {/* Solid status badge */}
        <span className={cn(
          'text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0 flex items-center gap-1',
          isPositive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        )}>
          {isPositive
            ? <CheckCircle size={11} weight="fill" />
            : <Warning size={11} weight="fill" />}
          {isPositive ? 'Positif' : 'Defisit'}
        </span>
      </div>

      {/* Net worth main number */}
      <div className="space-y-0.5">
        <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">Nilai Bersih</span>
        <p className={cn(
          'font-bold text-2xl sm:text-3xl tabular-nums tracking-tight leading-none',
          isPositive ? 'text-zinc-900 dark:text-white' : 'text-red-600 dark:text-red-500'
        )}>
          {formatMasked(netWorth)}
        </p>
      </div>

      {/* Asset vs debt bar — solid track colors */}
      <div className="space-y-2">
        <div className="w-full h-[5px] bg-red-200 dark:bg-red-900 rounded-full overflow-hidden">
          <div
            className="bg-green-600 h-full rounded-full transition-all duration-700"
            style={{ width: `${assetRatio}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Aset</span>
            <span className="font-semibold text-[11px] text-green-600 dark:text-green-500 tabular-nums">{formatMasked(totalAssets, { showSign: true })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[11px] text-red-600 dark:text-red-500 tabular-nums">
              {showBalance ? `-${formatCurrency(totalLiabilities)}` : '-••••••'}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Utang</span>
            <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
