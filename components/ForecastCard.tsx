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

    // Projected total spending across the cycle
    const projectedFinalExpense = totalExpense + (dailyBurnRate * safeRemaining);

    // Projected ending cash balance on payday:
    // Derived directly from current real available balance minus projected burn for remaining days
    const projectedEndingBalance = balance - (dailyBurnRate * safeRemaining);

    // Safe daily spending ceiling from available cash for the rest of the cycle
    const safeDailyCeiling = Math.max(0, Math.round(balance / safeRemaining));

    let status: 'surplus' | 'warning' | 'deficit' = 'surplus';
    let statusLabel = 'Pengeluaran Aman';
    let statusBadgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

    const baseline = effectiveIncome > 0 ? effectiveIncome : Math.max(balance + totalExpense, 1);

    if (projectedEndingBalance < 0 || balance <= 0) {
      status = 'deficit';
      statusLabel = 'Berisiko Minus';
      statusBadgeColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    } else if (projectedEndingBalance < 0.1 * baseline) {
      status = 'warning';
      statusLabel = 'Perlu Waspada';
      statusBadgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    } else {
      status = 'surplus';
      statusLabel = 'Pengeluaran Aman';
      statusBadgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
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
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/80 dark:border-zinc-700/50 shadow-[0_1px_4px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.20)] p-4 sm:p-5 transition-colors space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Compass className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white leading-none">
              Prediksi Saldo Akhir Bulan
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Perkiraan sisa uang saat gajian berdasarkan kebiasaan belanja harian
            </p>
          </div>
        </div>

        <span className={cn('text-[11px] font-semibold px-2.5 py-0.5 rounded-full border', calculation.statusBadgeColor)}>
          {calculation.statusLabel}
        </span>
      </div>

      {/* Grid Prediction Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Rata-rata Belanja Harian */}
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium">Rata-rata Harian</span>
          <p className="font-bold text-[14px] sm:text-[15px] text-zinc-900 dark:text-white tabular-nums mt-1">
            {formatCurrency(calculation.dailyBurnRate)}
            <span className="text-[10px] text-zinc-400 font-normal"> /hari</span>
          </p>
          <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">
            {elapsedDays} hari berjalan
          </span>
        </div>

        {/* Batas Belanja Aman */}
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium">Batas Aman/Hari</span>
          <p className="font-bold text-[14px] sm:text-[15px] text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(calculation.safeDailyCeiling)}
            <span className="text-[10px] text-zinc-400 font-normal"> /hari</span>
          </p>
          <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">
            {daysRemaining} hari ke depan
          </span>
        </div>

        {/* Estimasi Saldo saat Gajian */}
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium">Est. Saldo Gajian</span>
          <p
            className={cn(
              'font-bold text-[14px] sm:text-[15px] tabular-nums mt-1',
              calculation.projectedEndingBalance >= 0
                ? 'text-zinc-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {calculation.projectedEndingBalance < 0 ? '-' : ''}
            {formatCurrency(Math.abs(calculation.projectedEndingBalance))}
          </p>
          <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">
            Tanggal {salaryDate} mendatang
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
            ? `Peringatan: Dengan rata-rata belanja saat ini (${formatCurrency(calculation.dailyBurnRate)}/hari), uang diperkirakan habis sebelum gajian. Batasi pengeluaran maksimal ${formatCurrency(calculation.safeDailyCeiling)}/hari.`
            : calculation.status === 'warning'
            ? `Sisa saldo mulai menipis. Usahakan belanja di bawah ${formatCurrency(calculation.safeDailyCeiling)}/hari agar tetap ada sisa tabungan di tanggal ${salaryDate}.`
            : `Pengeluaran kamu sangat terkendali! Jika ritme ini dipertahankan, kamu diproyeksikan memiliki sisa tabungan ${formatCurrency(calculation.projectedEndingBalance)} di tanggal gajian.`}
        </p>
      </div>
    </div>
  );
}
