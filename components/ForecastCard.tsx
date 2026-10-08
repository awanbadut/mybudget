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
    let statusColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/50';

    const baseline = effectiveIncome > 0 ? effectiveIncome : Math.max(balance + totalExpense, 1);

    if (projectedEndingBalance < 0 || balance <= 0) {
      status = 'deficit';
      statusLabel = 'Berisiko';
      statusColor = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/50';
    } else if (projectedEndingBalance < 0.1 * baseline) {
      status = 'warning';
      statusLabel = 'Waspada';
      statusColor = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/50';
    }

    return {
      dailyBurnRate,
      projectedFinalExpense,
      projectedEndingBalance,
      safeDailyCeiling,
      status,
      statusLabel,
      statusColor,
    };
  }, [balance, totalExpense, effectiveIncome, elapsedDays, daysRemaining]);

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.20)] p-4 sm:p-5 transition-colors space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-indigo-100/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
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
        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0', calculation.statusColor)}>
          {calculation.statusLabel}
        </span>
      </div>

      {/* 3-metric row */}
      <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800/50">
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
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
        <Metric
          label="Est. saldo gajian"
          value={(calculation.projectedEndingBalance < 0 ? '-' : '') + formatCurrency(Math.abs(calculation.projectedEndingBalance))}
          sub={`Tgl ${salaryDate} mendatang`}
          valueClass={calculation.projectedEndingBalance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}
        />
      </div>

      {/* Advisory */}
      <div className={cn(
        'p-3 rounded-xl text-[11.5px] flex items-start gap-2.5 border leading-relaxed',
        calculation.status === 'deficit'
          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
          : calculation.status === 'warning'
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
          : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
      )}>
        {calculation.status === 'deficit'
          ? <Warning size={14} weight="fill" className="text-rose-500 flex-shrink-0 mt-0.5" />
          : calculation.status === 'warning'
          ? <Warning size={14} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
          : <Lightning size={14} weight="fill" className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />}
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
    <div className="bg-white dark:bg-[#1c1c1e] px-3 py-2.5 space-y-1 min-w-0">
      <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium block truncate">{label}</span>
      <p className={cn('font-bold text-[13px] sm:text-[14px] tabular-nums truncate leading-none', valueClass)}>{value}</p>
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">{sub}</span>
    </div>
  );
}
