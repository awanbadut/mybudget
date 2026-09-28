'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { Compass, TrendingDown, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
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

    // Current daily burn rate
    const dailyBurnRate = Math.round(totalExpense / safeElapsed);

    // Projected total spending by end of cycle
    const projectedFinalExpense = totalExpense + (dailyBurnRate * safeRemaining);

    // Projected ending balance
    const incomeBase = effectiveIncome > 0 ? effectiveIncome : totalExpense + balance;
    const projectedEndingBalance = incomeBase - projectedFinalExpense;

    // Safe daily spending ceiling for the rest of the cycle
    const safeDailyCeiling = Math.max(0, Math.round(balance / safeRemaining));

    let status: 'surplus' | 'warning' | 'deficit' = 'surplus';
    let statusLabel = 'Pacing Aman';
    let statusBadgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

    if (projectedEndingBalance < 0) {
      status = 'deficit';
      statusLabel = 'Terancam Defisit';
      statusBadgeColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    } else if (projectedEndingBalance < 0.1 * incomeBase) {
      status = 'warning';
      statusLabel = 'Ketahanan Tipis';
      statusBadgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }

    return {
      dailyBurnRate,
      projectedFinalExpense,
      projectedEndingBalance,
      safeDailyCeiling,
      status,
      statusLabel,
      statusBadgeColor,
    };
  }, [balance, totalExpense, effectiveIncome, elapsedDays, daysRemaining]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5 transition-colors space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white leading-none">
              Prediksi Arus Kas Siklus Gajian
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Proyeksi saldo akhir berdasarkan laju pengeluaran ({elapsedDays} hari berjalan, {daysRemaining} hari tersisa)
            </p>
          </div>
        </div>

        <span className={cn('text-[11px] font-semibold px-2.5 py-0.5 rounded-full border', calculation.statusBadgeColor)}>
          {calculation.statusLabel}
        </span>
      </div>

      {/* Grid Prediction Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Laju Belanja Harian */}
        <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-zinc-800/40 border border-stone-200/50 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Laju Belanja Rata-Rata</span>
          <p className="font-sans font-bold text-sm sm:text-base text-zinc-900 dark:text-white tabular-nums mt-0.5">
            {formatCurrency(calculation.dailyBurnRate)}
            <span className="text-[10px] text-zinc-400 font-normal"> /hari</span>
          </p>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">
            Berdasarkan {elapsedDays} hari terakhir
          </span>
        </div>

        {/* Batas Belanja Aman */}
        <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-zinc-800/40 border border-stone-200/50 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Batas Maks Harian Sisa</span>
          <p className="font-sans font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {formatCurrency(calculation.safeDailyCeiling)}
            <span className="text-[10px] text-zinc-400 font-normal"> /hari</span>
          </p>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">
            Untuk {daysRemaining} hari ke depan
          </span>
        </div>

        {/* Proyeksi Saldo Akhir */}
        <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-zinc-800/40 border border-stone-200/50 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Proyeksi Saldo saat Gajian</span>
          <p
            className={cn(
              'font-sans font-bold text-sm sm:text-base tabular-nums mt-0.5',
              calculation.projectedEndingBalance >= 0
                ? 'text-zinc-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {calculation.projectedEndingBalance < 0 ? '-' : ''}
            {formatCurrency(Math.abs(calculation.projectedEndingBalance))}
          </p>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">
            Di tgl {salaryDate} mendatang
          </span>
        </div>
      </div>

      {/* Advisory Message */}
      <div
        className={cn(
          'p-3 rounded-xl text-xs flex items-start gap-2.5 border',
          calculation.status === 'deficit'
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
            : calculation.status === 'warning'
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
            : 'bg-stone-50 dark:bg-zinc-800/50 border-stone-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
        )}
      >
        {calculation.status === 'deficit' ? (
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        )}
        <p className="leading-relaxed">
          {calculation.status === 'deficit'
            ? `Peringatan: Pada laju belanja saat ini (${formatCurrency(calculation.dailyBurnRate)}/hari), saldo diperkirakan habis sebelum gajian. Batasi pengeluaran maksimal ${formatCurrency(calculation.safeDailyCeiling)}/hari.`
            : calculation.status === 'warning'
            ? `Ketahanan kas cukup tipis. Pertahankan belanja di bawah ${formatCurrency(calculation.safeDailyCeiling)}/hari untuk menjamin surplus di tanggal ${salaryDate}.`
            : `Pola belanja kamu sangat terkendali! Jika laju ini dipertahankan, kamu diproyeksikan surplus ${formatCurrency(calculation.projectedEndingBalance)} di akhir siklus gajian.`}
        </p>
      </div>
    </div>
  );
}
