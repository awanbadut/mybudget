'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { Landmark, TrendingUp, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/80 dark:border-zinc-700/50 shadow-[0_1px_4px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.20)] p-4 sm:p-5 transition-colors space-y-3.5">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Landmark className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white leading-none">
              Total Kekayaan Bersih
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Total tabungan & kas aktif dikurangi sisa kewajiban cicilan
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
            isPositive
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          )}
        >
          <span
            className={cn('w-1.5 h-1.5 rounded-full', isPositive ? 'bg-emerald-500' : 'bg-rose-500')}
          />
          {isPositive ? 'Kekayaan Positif' : 'Kekayaan Minus'}
        </span>
      </div>

      {/* Main Net Worth Value */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
        <div>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
            Nilai Bersih Finansial
          </span>
          <p
            className={cn(
              'font-sans font-bold text-2xl sm:text-3xl tabular-nums leading-tight',
              isPositive ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isPositive ? '' : '-'}{formatCurrency(Math.abs(netWorth))}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block">Total Aset & Kas</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatCurrency(totalAssets)}
            </span>
          </div>
          <div className="w-px h-6 bg-stone-200 dark:bg-zinc-700" />
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block">Sisa Utang</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
              -{formatCurrency(totalLiabilities)}
            </span>
          </div>
        </div>
      </div>

      {/* Proportion Bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-rose-200 dark:bg-rose-950/60 h-[3px] rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-700"
            style={{ width: `${assetRatio}%` }}
            title={`Aset: ${assetRatio}%`}
          />
        </div>
        <div className="flex justify-between text-[10.5px] text-zinc-400 dark:text-zinc-500">
          <span>Aset: {assetRatio}%</span>
          <span>Utang: {100 - assetRatio}%</span>
        </div>
      </div>
    </div>
  );
}
