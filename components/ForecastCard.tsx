'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { Wallet, TrendUp, Warning, CheckCircle, Lightning } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ForecastCardProps {
  balance: number;
  totalExpense: number;
  effectiveIncome: number;
  elapsedDays: number;
  daysRemaining: number;
  salaryDate: number;
}

export function ForecastCard({
  balance,
  totalExpense,
  effectiveIncome,
  elapsedDays,
  daysRemaining,
  salaryDate,
}: ForecastCardProps) {
  const calculation = useMemo(() => {
    const safeElapsed = Math.max(1, elapsedDays);
    const safeRemaining = Math.max(1, daysRemaining);

    const dailyBurnRate = Math.round(totalExpense / safeElapsed);
    const projectedFinalExpense = totalExpense + (dailyBurnRate * safeRemaining);
    const projectedEndingBalance = balance - (dailyBurnRate * safeRemaining);
    const safeDailyCeiling = Math.max(0, Math.round(balance / safeRemaining));

    let status: 'surplus' | 'warning' | 'deficit' = 'surplus';
    let statusLabel = 'Aman';
    // Solid badge colors
    let statusBadgeClass = 'bg-green-600 text-white';

    const baseline = effectiveIncome > 0 ? effectiveIncome : Math.max(balance + totalExpense, 1);

    if (projectedEndingBalance < 0 || balance <= 0) {
      status = 'deficit';
      statusLabel = 'Berisiko';
      statusBadgeClass = 'bg-red-600 text-white';
    } else if (projectedEndingBalance < 0.1 * baseline) {
      status = 'warning';
      statusLabel = 'Waspada';
      statusBadgeClass = 'bg-amber-500 text-white';
    }

    // Advisory box colors — solid
    let advisoryClass = 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400';
    if (status === 'deficit') advisoryClass = 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
    if (status === 'warning') advisoryClass = 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200';

    return {
      dailyBurnRate,
      projectedFinalExpense,
      projectedEndingBalance,
      safeDailyCeiling,
      status,
      statusLabel,
      statusBadgeClass,
      advisoryClass,
    };
  }, [balance, totalExpense, effectiveIncome, elapsedDays, daysRemaining]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5 transition-colors space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Solid icon bg */}
          <div className="w-8 h-8 rounded-[10px] bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <Wallet size={15} weight="fill" />
          </div>
          <div>
            <h3 className="font-semibold text-[13.5px] sm:text-[14.5px] text-zinc-900 dark:text-white leading-none">
              Prediksi Saldo Gajian
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 leading-snug">
              Estimasi sisa uang di tanggal {salaryDate}
            </p>
          </div>
        </div>
        {/* Solid status badge */}
        <span className={cn('text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0', calculation.statusBadgeClass)}>
          {calculation.statusLabel}
        </span>
      </div>

      {/* 3-metric row */}
      <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
        <Metric
          label="Rata-rata/hari"
          value={`${formatCurrency(calculation.dailyBurnRate)}`}
          sub={`${elapsedDays} hari lalu`}
          valueClass="text-zinc-900 dark:text-white"
        />
        <Metric
          label="Batas aman/hari"
          value={formatCurrency(calculation.safeDailyCeiling)}
          sub={`${daysRemaining} hari lagi`}
          valueClass="text-green-600 dark:text-green-500"
        />
        <Metric
          label="Est. saldo gajian"
          value={(calculation.projectedEndingBalance < 0 ? '-' : '') + formatCurrency(Math.abs(calculation.projectedEndingBalance))}
          sub={`Tgl ${salaryDate} mendatang`}
          valueClass={calculation.projectedEndingBalance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-red-600 dark:text-red-500'}
        />
      </div>

      {/* Advisory — solid backgrounds */}
      <div className={cn('p-3 rounded-xl text-[11.5px] flex items-start gap-2.5 border leading-relaxed', calculation.advisoryClass)}>
        {calculation.status === 'deficit'
          ? <Warning size={14} weight="fill" className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          : calculation.status === 'warning'
          ? <Warning size={14} weight="fill" className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          : <Lightning size={14} weight="fill" className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />}
        <p>
          {calculation.status === 'deficit'
            ? `Sisa saldo habis sebelum gajian jika pola belanja berlanjut. Batasi maksimal ${formatCurrency(calculation.safeDailyCeiling)}/hari.`
            : calculation.status === 'warning'
            ? `Saldo mulai menipis. Usahakan di bawah ${formatCurrency(calculation.safeDailyCeiling)}/hari agar ada sisa di tanggal ${salaryDate}.`
            : `Ritme belanja terkendali. Proyeksi sisa ${formatCurrency(calculation.projectedEndingBalance)} di tanggal gajian.`}
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 px-3 py-2.5 space-y-1 min-w-0">
      <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium block truncate">{label}</span>
      <p className={cn('font-bold text-[13px] sm:text-[14px] tabular-nums truncate leading-none', valueClass)}>{value}</p>
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">{sub}</span>
    </div>
  );
}
