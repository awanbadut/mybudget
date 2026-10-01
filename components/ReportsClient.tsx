'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { calculateSavingRate } from '@/lib/calculations';
import { toDateString } from '@/lib/dates';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Wallet,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Landmark,
} from 'lucide-react';
import { NetWorthCard } from '@/components/NetWorthCard';
import { useToast } from '@/hooks/use-toast';

const FILTERS = [
  { label: '30 Hari', days: 30 },
  { label: '3 Bulan', days: 90 },
  { label: '6 Bulan', days: 180 },
  { label: '1 Tahun', days: 365 },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface Transaction {
  id: string;
  name?: string;
  type: string;
  amount: number;
  transactionDate: string;
  note?: string | null;
  category: { name: string; color: string | null } | null;
}

interface SavingsTransaction {
  id: string;
  amount: number;
  transactionDate: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  currentAmount?: number;
  transactions: SavingsTransaction[];
}

interface DebtItem {
  id: string;
  name: string;
  status: string;
  installments: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
}

interface Props {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  debts?: DebtItem[];
}

export function ReportsClient({ transactions, savingsGoals, debts = [] }: Props) {
  const { toast } = useToast();
  const [filterDays, setFilterDays] = useState(30);

  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - filterDays);
    return toDateString(d);
  }, [filterDays]);

  const filtered = useMemo(() =>
    transactions.filter(t => t.transactionDate >= cutoffDate),
    [transactions, cutoffDate]
  );

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingRate = calculateSavingRate(totalIncome, savings);

  // Lifetime liquid balance (all-time total income minus all-time total expense)
  const lifetimeCashBalance = useMemo(() => {
    return transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
  }, [transactions]);

  // Total savings across all goals
  const totalSavingsAmount = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [savingsGoals]);

  // Total pending debts
  const totalPendingDebtAmount = useMemo(() => {
    return debts
      .filter(d => d.status === 'active')
      .flatMap(d => d.installments || [])
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0);
  }, [debts]);

  // Monthly cashflow
  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    filtered.forEach(t => {
      const [y, m] = t.transactionDate.split('-').map(Number);
      const key = `${MONTH_NAMES[m-1]} ${y}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (t.type === 'income') map[key].income += t.amount;
      else map[key].expense += t.amount;
    });
    return Object.entries(map).map(([label, data]) => ({
      label,
      ...data,
      savings: data.income - data.expense,
    }));
  }, [filtered]);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
      const name = t.category?.name || 'Lainnya';
      map[name] = (map[name] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name, amount }));
  }, [filtered]);

  // Month-over-Month Category Trend (comparing last 30 days vs previous 30-60 days)
  const categoryTrends = useMemo(() => {
    const now = new Date();
    const d30 = new Date(now);
    d30.setDate(d30.getDate() - 30);
    const d60 = new Date(now);
    d60.setDate(d60.getDate() - 60);

    const d30Str = toDateString(d30);
    const d60Str = toDateString(d60);

    const currentMap: Record<string, number> = {};
    const previousMap: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type !== 'expense') return;
      const cat = t.category?.name || 'Lainnya';
      if (t.transactionDate >= d30Str) {
        currentMap[cat] = (currentMap[cat] || 0) + t.amount;
      } else if (t.transactionDate >= d60Str && t.transactionDate < d30Str) {
        previousMap[cat] = (previousMap[cat] || 0) + t.amount;
      }
    });

    const allCatNames = Array.from(new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]));

    return allCatNames.map(name => {
      const cur = currentMap[name] || 0;
      const prev = previousMap[name] || 0;
      const diff = cur - prev;
      let pct = 0;
      if (prev > 0) {
        pct = Math.round(((cur - prev) / prev) * 100);
      } else if (cur > 0) {
        pct = 100;
      }
      return {
        name,
        current: cur,
        previous: prev,
        diff,
        pct,
      };
    }).sort((a, b) => b.current - a.current);
  }, [transactions]);

  // Export to CSV (Excel compatible)
  function handleExportCSV() {
    if (filtered.length === 0) {
      toast({ title: 'Tidak ada data untuk diekspor', variant: 'destructive' });
      return;
    }

    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nama Transaksi', 'Nominal (IDR)', 'Catatan'];
    const rows = filtered.map(t => [
      t.transactionDate,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      `"${(t.category?.name || 'Umum').replace(/"/g, '""')}"`,
      `"${(t.name || '-').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Excel properly renders Indonesian text and symbols
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan-Keuangan-MyBudget-${toDateString(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: 'Laporan CSV/Excel Berhasil Diunduh ✓' });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Printable Report Header (visible on print only) */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-black">Laporan Keuangan Pribadi - My Budget</h1>
        <p className="text-xs text-gray-500">Dicetak pada {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Analisis arus kas, tren pos belanja, dan evaluasi kekayaan bersih
          </p>
        </div>

        {/* Action buttons (CSV & Print) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 touch-manipulation"
            title="Unduh laporan ke berkas CSV / Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 touch-manipulation"
            title="Cetak laporan atau simpan sebagai PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-print">
        {FILTERS.map(f => (
          <button
            key={f.days}
            onClick={() => setFilterDays(f.days)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border touch-manipulation',
              filterDays === f.days
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border-stone-200/80 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary 4-grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pemasukan</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pengeluaran</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Net Surplus</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PiggyBank className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <p
            className={cn(
              'text-base sm:text-lg font-bold tabular-nums',
              savings >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatCurrency(Math.abs(savings))}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Saving Rate</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
            {savingRate}%
          </p>
        </div>
      </div>

      {/* Net Worth Card in Reports */}
      <NetWorthCard
        totalSavings={totalSavingsAmount}
        currentBalance={lifetimeCashBalance}
        totalPendingDebt={totalPendingDebtAmount}
      />

      {/* Cashflow Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 space-y-4 transition-colors">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
            Perbandingan Cashflow (Pemasukan vs Pengeluaran)
          </h3>
          <div className="h-[230px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Pemasukan" />
                <Bar dataKey="expense" fill="#71717A" radius={[4, 4, 0, 0]} name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expense by category chart */}
      {expenseByCategory.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 space-y-4 transition-colors">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
            Pengeluaran per Pos Belanja
          </h3>
          <div className="h-[210px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={expenseByCategory} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#88888820" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Trends across Months */}
      {categoryTrends.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 space-y-3.5 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-white leading-none">
                Tren Fluktuasi Pos Belanja
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Perbandingan belanja 30 hari terakhir vs 30 hari sebelumnya
              </p>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
              MoM (Month-over-Month)
            </span>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-zinc-800">
            {categoryTrends.map(cat => {
              const isUp = cat.diff > 0;
              const isDown = cat.diff < 0;

              return (
                <div key={cat.name} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      Bulan ini: {formatCurrency(cat.current)} vs Sebelumnya: {formatCurrency(cat.previous)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-md tabular-nums',
                        isUp
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                          : isDown
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-stone-100 dark:bg-zinc-800 text-zinc-500'
                      )}
                    >
                      {isUp && <TrendingUp className="w-3 h-3" />}
                      {isDown && <TrendingDown className="w-3 h-3" />}
                      {!isUp && !isDown && <Minus className="w-3 h-3" />}
                      <span>
                        {cat.diff > 0 ? '+' : ''}
                        {cat.pct}%
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
            Belum ada transaksi untuk rentang filter waktu ini.
          </p>
        </div>
      )}
    </div>
  );
}
