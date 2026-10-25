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
  Calendar,
  History,
  Filter,
} from 'lucide-react';
import { NetWorthCard } from '@/components/NetWorthCard';
import { CycleSelector, CycleOption } from '@/components/CycleSelector';
import { CycleHistoryRecap } from '@/components/CycleHistoryRecap';
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
  name: string;
  type: string;
  amount: number;
  transactionDate: string;
  note?: string | null;
  categoryId?: string | null;
  category: { id?: string; name: string; color: string | null; icon?: string | null } | null;
  accountId?: string | null;
  account?: { id: string; name: string; type: string } | null;
  toAccountId?: string | null;
  toAccount?: { id: string; name: string; type: string } | null;
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
  categories?: Array<{ id: string; name: string; type: string }>;
  accounts?: Array<{ id: string; name: string; type: string; balance: number }>;
  cycles?: CycleOption[];
  budgets?: Array<any>;
  foodBudgetTotal?: number;
  salaryDate?: number;
  isStudentMode?: boolean;
}

export function ReportsClient({
  transactions,
  savingsGoals,
  debts = [],
  categories = [],
  accounts = [],
  cycles = [],
  budgets = [],
  foodBudgetTotal = 0,
  salaryDate = 25,
  isStudentMode = false,
}: Props) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'cycle' | 'days'>('cycle');
  const [selectedCycleOffset, setSelectedCycleOffset] = useState<number>(0);
  const [filterDays, setFilterDays] = useState(30);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  const activeCycle = useMemo(
    () => cycles.find(c => c.offset === selectedCycleOffset) || cycles[0],
    [cycles, selectedCycleOffset]
  );

  const prevCycle = useMemo(
    () => cycles.find(c => c.offset === selectedCycleOffset - 1) || cycles[1] || activeCycle,
    [cycles, selectedCycleOffset, activeCycle]
  );

  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - filterDays);
    return toDateString(d);
  }, [filterDays]);

  // Base date-filtered transactions (either by selected cycle or rolling days)
  const dateFiltered = useMemo(() => {
    if (viewMode === 'cycle' && activeCycle) {
      return transactions.filter(
        t => t.transactionDate >= activeCycle.startDateStr && t.transactionDate <= activeCycle.endDateStr
      );
    }
    return transactions.filter(t => t.transactionDate >= cutoffDate);
  }, [transactions, viewMode, activeCycle, cutoffDate]);

  // Apply Category & Bank/Tunai filters on top of dateFiltered
  const filtered = useMemo(() => {
    return dateFiltered.filter(t => {
      if (filterCategory !== 'all') {
        if (t.categoryId !== filterCategory && t.category?.name !== filterCategory) return false;
      }
      if (filterAccount !== 'all') {
        if (t.accountId !== filterAccount && t.toAccountId !== filterAccount) return false;
      }
      return true;
    });
  }, [dateFiltered, filterCategory, filterAccount]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingRate = calculateSavingRate(totalIncome, savings);

  // Previous cycle stats for CycleHistoryRecap
  const prevCycleStats = useMemo(() => {
    if (!prevCycle) return { income: 0, expense: 0 };
    const txs = transactions.filter(
      t => t.transactionDate >= prevCycle.startDateStr && t.transactionDate <= prevCycle.endDateStr
    );
    return {
      income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions, prevCycle]);

  // Compute budgets with spending for the selected cycle
  const cycleBudgetsWithSpending = useMemo(() => {
    return budgets.map((b: any) => {
      const spent = dateFiltered
        .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...b,
        spent,
        remaining: b.amount - spent,
        percentage: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
      };
    });
  }, [budgets, dateFiltered]);

  const cycleFoodSpent = useMemo(() => {
    return dateFiltered
      .filter(t => t.type === 'expense' && t.category?.name === 'Makan')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [dateFiltered]);

  // Historical Cycle Summary Table (last 6 cycles: 25 to 24)
  const cycleHistoryComparison = useMemo(() => {
    const baseTotalBudget =
      budgets.reduce((s: number, b: any) => s + (b.amount || 0), 0) +
      (budgets.some((b: any) => b.category?.name?.toLowerCase() === 'makan') ? 0 : foodBudgetTotal);

    return cycles.slice(0, 6).map(cyc => {
      const cycTxs = transactions.filter(
        t =>
          t.transactionDate >= cyc.startDateStr &&
          t.transactionDate <= cyc.endDateStr &&
          (filterCategory === 'all' || t.categoryId === filterCategory || t.category?.name === filterCategory) &&
          (filterAccount === 'all' || t.accountId === filterAccount || t.toAccountId === filterAccount)
      );
      const inc = cycTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = cycTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = inc - exp;

      // Pos budget spent in this cycle
      const posSpent = budgets.reduce((sum: number, b: any) => {
        const s = cycTxs
          .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
          .reduce((acc, t) => acc + t.amount, 0);
        return sum + s;
      }, 0);
      const foodS = cycTxs
        .filter(t => t.type === 'expense' && t.category?.name === 'Makan')
        .reduce((acc, t) => acc + t.amount, 0);
      const totalPosSpent =
        posSpent + (budgets.some((b: any) => b.category?.name?.toLowerCase() === 'makan') ? 0 : foodS);
      const posRemaining = baseTotalBudget - totalPosSpent;

      return {
        ...cyc,
        shortLabel: cyc.label.split(' ').slice(0, 2).join(' ') + ' - ' + cyc.label.split('-')[1]?.trim().split(' ').slice(0, 2).join(' '),
        income: inc,
        expense: exp,
        savings: net,
        posBudgetTotal: baseTotalBudget,
        posRemaining,
        txCount: cycTxs.length,
      };
    });
  }, [cycles, transactions, budgets, foodBudgetTotal, filterCategory, filterAccount]);

  // Lifetime liquid balance
  const lifetimeCashBalance = useMemo(() => {
    if (accounts.length > 0) {
      return accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    }
    return transactions.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense') return sum - t.amount;
      return sum;
    }, 0);
  }, [transactions, accounts]);

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

  // Chart data: if viewMode === 'cycle', show last 6 cycles comparison!
  const chartData = useMemo(() => {
    if (viewMode === 'cycle' && cycleHistoryComparison.length > 0) {
      return [...cycleHistoryComparison].reverse().map(c => ({
        label: c.shortLabel,
        income: c.income,
        expense: c.expense,
        savings: c.savings,
      }));
    }
    const map: Record<string, { income: number; expense: number }> = {};
    filtered.forEach(t => {
      const [y, m] = t.transactionDate.split('-').map(Number);
      const key = `${MONTH_NAMES[m - 1]} ${y}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (t.type === 'income') map[key].income += t.amount;
      else if (t.type === 'expense') map[key].expense += t.amount;
    });
    return Object.entries(map).map(([label, data]) => ({
      label,
      ...data,
      savings: data.income - data.expense,
    }));
  }, [viewMode, cycleHistoryComparison, filtered]);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const name = t.category?.name || 'Lainnya';
        map[name] = (map[name] || 0) + t.amount;
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name, amount }));
  }, [filtered]);

  // Category Trends comparing selected cycle vs previous cycle
  const categoryTrends = useMemo(() => {
    const currentMap: Record<string, number> = {};
    const previousMap: Record<string, number> = {};

    if (viewMode === 'cycle' && activeCycle && prevCycle) {
      transactions.forEach(t => {
        if (t.type !== 'expense') return;
        if (filterAccount !== 'all' && t.accountId !== filterAccount) return;
        const cat = t.category?.name || 'Lainnya';
        if (t.transactionDate >= activeCycle.startDateStr && t.transactionDate <= activeCycle.endDateStr) {
          currentMap[cat] = (currentMap[cat] || 0) + t.amount;
        } else if (t.transactionDate >= prevCycle.startDateStr && t.transactionDate <= prevCycle.endDateStr) {
          previousMap[cat] = (previousMap[cat] || 0) + t.amount;
        }
      });
    } else {
      const now = new Date();
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 30);
      const d60 = new Date(now);
      d60.setDate(d60.getDate() - 60);
      const d30Str = toDateString(d30);
      const d60Str = toDateString(d60);

      transactions.forEach(t => {
        if (t.type !== 'expense') return;
        const cat = t.category?.name || 'Lainnya';
        if (t.transactionDate >= d30Str) {
          currentMap[cat] = (currentMap[cat] || 0) + t.amount;
        } else if (t.transactionDate >= d60Str && t.transactionDate < d30Str) {
          previousMap[cat] = (previousMap[cat] || 0) + t.amount;
        }
      });
    }

    const allCatNames = Array.from(new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]));

    return allCatNames
      .map(name => {
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
      })
      .sort((a, b) => b.current - a.current);
  }, [transactions, viewMode, activeCycle, prevCycle, filterAccount]);

  // Export to CSV (Excel compatible)
  function handleExportCSV() {
    if (filtered.length === 0) {
      toast({ title: 'Tidak ada data untuk diekspor', variant: 'destructive' });
      return;
    }

    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Bank/Dompet', 'Nama Transaksi', 'Nominal (IDR)', 'Catatan'];
    const rows = filtered.map(t => {
      const accName = t.account?.name || accounts.find(a => a.id === t.accountId)?.name || 'Utama';
      return [
        t.transactionDate,
        t.type === 'income' ? 'Pemasukan' : t.type === 'transfer' ? 'Transfer/Tarik Tunai' : 'Pengeluaran',
        `"${(t.category?.name || 'Umum').replace(/"/g, '""')}"`,
        `"${accName.replace(/"/g, '""')}"`,
        `"${(t.name || '-').replace(/"/g, '""')}"`,
        t.amount,
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ];
    });

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
      {/* Printable Report Header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-black">Laporan Keuangan Pribadi - My Budget</h1>
        <p className="text-xs text-gray-500">
          Dicetak pada {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
            Laporan &amp; Riwayat Siklus
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Evaluasi pemasukan, pengeluaran, uang sisa per siklus ({isStudentMode ? 'Bulan Kalender' : `Tgl ${salaryDate}`}), serta filter per kategori &amp; bank/tunai
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

      {/* Mode Switcher + Filter Kategori & Bank/Tunai */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3.5 sm:p-4 space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Mode Toggle: Per Siklus (25-24) vs Rentang Hari */}
          <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl w-full sm:w-fit">
            <button
              type="button"
              onClick={() => setViewMode('cycle')}
              className={cn(
                'flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation',
                viewMode === 'cycle'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Per Siklus ({isStudentMode ? 'Bulanan' : `${salaryDate} ke ${salaryDate - 1 || 30}`})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('days')}
              className={cn(
                'flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation',
                viewMode === 'days'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Rentang Hari (30h - 1Thn)</span>
            </button>
          </div>

          {/* Filter Kategori & Filter Bank/Tunai */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-stone-200 dark:border-zinc-700 focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  Kategori: {cat.name}
                </option>
              ))}
            </select>

            <select
              value={filterAccount}
              onChange={e => setFilterAccount(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-stone-200 dark:border-zinc-700 focus:outline-none"
            >
              <option value="all">Semua Bank &amp; Tunai</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  Dompet: {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* If viewMode === 'days', show rolling days buttons */}
        {viewMode === 'days' && (
          <div className="flex gap-1.5 overflow-x-auto pt-1 text-xs">
            {FILTERS.map(f => (
              <button
                key={f.days}
                onClick={() => setFilterDays(f.days)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border touch-manipulation',
                  filterDays === f.days
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border-stone-200/80 dark:border-zinc-800'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* If viewMode === 'cycle', show CycleSelector & Multi-Cycle Comparison Table */}
      {viewMode === 'cycle' && cycles.length > 0 && (
        <>
          <CycleSelector
            cycles={cycles}
            currentOffset={selectedCycleOffset}
            salaryDate={salaryDate}
            isStudentMode={isStudentMode}
            onSelectOffset={setSelectedCycleOffset}
          />

          {/* Tabel Perbandingan 6 Siklus Terakhir */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="p-4 sm:px-5 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Tabel Riwayat Siklus Bulanan ({isStudentMode ? '1 s/d Akhir Bulan' : `Tgl ${salaryDate} ke ${salaryDate - 1 || 30}`})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Klik salah satu baris siklus untuk membuka rincian lengkap transaksi &amp; pos budgeting siklus tersebut
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-stone-100 dark:border-zinc-800">
                    <th className="py-3 px-4 font-semibold">Siklus Rentang Tanggal</th>
                    <th className="py-3 px-4 font-semibold text-right">Pemasukan</th>
                    <th className="py-3 px-4 font-semibold text-right">Pengeluaran</th>
                    <th className="py-3 px-4 font-semibold text-right">Sisa Uang Siklus</th>
                    <th className="py-3 px-4 font-semibold text-right">Sisa Pos Budgeting</th>
                    <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                  {cycleHistoryComparison.map(cyc => {
                    const isSelected = cyc.offset === selectedCycleOffset;
                    return (
                      <tr
                        key={cyc.offset}
                        onClick={() => setSelectedCycleOffset(cyc.offset)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-amber-50/70 dark:bg-amber-950/25 font-semibold'
                            : 'hover:bg-stone-50/70 dark:hover:bg-zinc-800/40'
                        )}
                      >
                        <td className="py-3 px-4 text-zinc-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{cyc.label}</span>
                            {cyc.offset === 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                Aktif
                              </span>
                            )}
                            {cyc.offset === -1 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                Bulan Kemarin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                          +{formatCurrency(cyc.income)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                          -{formatCurrency(cyc.expense)}
                        </td>
                        <td
                          className={cn(
                            'py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap',
                            cyc.savings >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {cyc.savings < 0 ? '-' : '+'}
                          {formatCurrency(Math.abs(cyc.savings))}
                        </td>
                        <td
                          className={cn(
                            'py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap',
                            cyc.posRemaining >= 0
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {cyc.posRemaining < 0 ? '-' : '+'}
                          {formatCurrency(Math.abs(cyc.posRemaining))}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedCycleOffset(cyc.offset);
                            }}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors',
                              isSelected
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-stone-200'
                            )}
                          >
                            {isSelected ? 'Sedang Dilihat' : 'Lihat Detail'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Cycle Recap Component for Selected Cycle */}
          {activeCycle && (
            <CycleHistoryRecap
              cycleLabel={activeCycle.label}
              isHistorical={Boolean(activeCycle.isHistorical)}
              cycleIncome={totalIncome}
              cycleExpense={totalExpense}
              effectiveIncome={totalIncome}
              prevCycleLabel={prevCycle?.label || 'Siklus Lalu'}
              prevCycleIncome={prevCycleStats.income}
              prevCycleExpense={prevCycleStats.expense}
              budgets={cycleBudgetsWithSpending}
              foodBudgetTotal={foodBudgetTotal}
              foodSpent={cycleFoodSpent}
              transactions={dateFiltered}
              accounts={accounts}
              categories={categories}
            />
          )}
        </>
      )}

      {/* Summary 4-grid (for Days mode or quick overview) */}
      {viewMode === 'days' && (
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
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sisa Uang (Surplus)</span>
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
              {savings < 0 ? '-' : ''}
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
      )}

      {/* Net Worth Card in Reports */}
      <NetWorthCard
        totalSavings={totalSavingsAmount}
        currentBalance={lifetimeCashBalance}
        totalPendingDebt={totalPendingDebtAmount}
      />

      {/* Cashflow Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 space-y-4 transition-colors">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
            {viewMode === 'cycle'
              ? 'Grafik Perbandingan Antar Siklus (Pemasukan vs Pengeluaran)'
              : 'Perbandingan Cashflow (Pemasukan vs Pengeluaran)'}
          </h3>
          <div className="h-[230px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expense by category chart */}
      {expenseByCategory.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 space-y-4 transition-colors">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
            Pengeluaran per Pos Belanja {viewMode === 'cycle' && activeCycle ? `(${activeCycle.label})` : ''}
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

      {/* Category Trends across Cycles */}
      {categoryTrends.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 dark:border-zinc-800 space-y-3.5 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-white leading-none">
                Tren Fluktuasi Pos Belanja Antar Siklus
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {viewMode === 'cycle' && activeCycle && prevCycle
                  ? `Perbandingan siklus (${activeCycle.label}) vs siklus sebelumnya (${prevCycle.label})`
                  : 'Perbandingan belanja 30 hari terakhir vs 30 hari sebelumnya'}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
              Evaluasi Pos
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
                      Siklus dipilih: {formatCurrency(cat.current)} vs Sebelumnya: {formatCurrency(cat.previous)}
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
    </div>
  );
}
