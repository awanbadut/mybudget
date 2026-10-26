'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort, toDateString } from '@/lib/dates';
import { useBalanceVisibility } from '@/context/BalanceVisibilityContext';
import { FilterBottomSheet } from '@/components/FilterBottomSheet';
import { PaginationBar } from '@/components/PaginationBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { addSavings } from '@/actions/savings';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Download,
  PieChart,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Filter,
  PiggyBank,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RecapBudgetItem {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  category: {
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
}

export interface RecapTransactionItem {
  id: string;
  name: string;
  amount: number;
  type: string;
  transactionDate: string;
  note?: string | null;
  categoryId?: string | null;
  category?: { id?: string; name: string; color?: string | null; icon?: string | null } | null;
  accountId?: string | null;
  account?: { id: string; name: string; type: string } | null;
  toAccountId?: string | null;
  toAccount?: { id: string; name: string; type: string } | null;
}

export interface RecapAccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface CycleHistoryRecapProps {
  cycleLabel: string;
  isHistorical: boolean;
  cycleIncome: number;
  cycleExpense: number;
  effectiveIncome: number;
  prevCycleLabel: string;
  prevCycleIncome: number;
  prevCycleExpense: number;
  budgets: RecapBudgetItem[];
  foodBudgetTotal: number;
  foodSpent: number;
  transactions: RecapTransactionItem[];
  accounts: RecapAccountItem[];
  categories: Array<{ id: string; name: string; type: string }>;
  savingsGoals?: Array<{ id: string; name: string; currentAmount?: number; targetAmount?: number }>;
}

export function CycleHistoryRecap({
  cycleLabel,
  isHistorical,
  cycleIncome,
  cycleExpense,
  effectiveIncome,
  prevCycleLabel,
  prevCycleIncome,
  prevCycleExpense,
  budgets,
  foodBudgetTotal,
  foodSpent,
  transactions,
  accounts,
  categories,
  savingsGoals = [],
}: CycleHistoryRecapProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { showBalance } = useBalanceVisibility();
  const mask = '••••••';
  const display = (val: number) => (showBalance ? formatCurrency(val) : mask);

  // Surplus sweep modal state
  const [showSweepModal, setShowSweepModal] = useState(false);
  const [sweepGoalId, setSweepGoalId] = useState(savingsGoals[0]?.id || '');
  const [sweepAmount, setSweepAmount] = useState('');
  const [sweepAccountId, setSweepAccountId] = useState(accounts[0]?.id || '');

  // Filter states for transactions in this cycle
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [txPage, setTxPage] = useState<number>(1);
  const [txPageSize, setTxPageSize] = useState<number>(10);
  const [budgetPage, setBudgetPage] = useState<number>(1);
  const [budgetPageSize, setBudgetPageSize] = useState<number>(6);

  // 1. Sisa Uang Siklus (Pemasukan - Pengeluaran Operasional di siklus ini, BUKAN saldo dompet keseluruhan)
  const baseIncomeForSurplus = cycleIncome > 0 ? cycleIncome : effectiveIncome;
  const cycleRemainingCash = cycleIncome - cycleExpense;
  const effectiveRemainingCash = baseIncomeForSurplus - cycleExpense;

  // Total tabungan yang disetor / dialokasikan di siklus ini
  const cycleSavings = useMemo(() => {
    return transactions
      .filter(t => {
        const isAdjustment = t.name.startsWith('Penyesuaian Saldo') || (t.note || '').includes('Penyesuaian saldo');
        if (isAdjustment) return false;
        return (
          (t.type === 'transfer' && (!t.toAccountId || t.category?.name === 'Tabungan' || t.name.startsWith('Setor Tabungan'))) ||
          (t.category?.name === 'Tabungan' || t.name.startsWith('Setor Tabungan'))
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const unsavedSurplus = Math.max(0, cycleRemainingCash - cycleSavings);
  const isAllSurplusSaved = cycleRemainingCash > 0 && cycleSavings >= cycleRemainingCash;

  // 2. Sisa Uang dari Pos-pos Budgeting
  // Include foodBudget in list if 'Makan' is not already in budgets table
  const combinedBudgets = useMemo(() => {
    const list = [...budgets];
    const hasFoodInBudgets = list.some(
      b => b.category?.name?.toLowerCase() === 'makan' || b.category?.name?.toLowerCase() === 'makanan'
    );
    if (!hasFoodInBudgets && foodBudgetTotal > 0) {
      list.unshift({
        id: 'settings-food-budget',
        categoryId: 'makan',
        amount: foodBudgetTotal,
        spent: foodSpent,
        remaining: foodBudgetTotal - foodSpent,
        percentage: Math.round((foodSpent / foodBudgetTotal) * 100),
        category: { name: 'Makan (Jatah Harian)', color: '#16a34a', icon: 'UtensilsCrossed' },
      });
    }
    return list;
  }, [budgets, foodBudgetTotal, foodSpent]);

  const totalBudgetAmount = combinedBudgets.reduce((s, b) => s + b.amount, 0);
  const totalBudgetSpent = combinedBudgets.reduce((s, b) => s + b.spent, 0);
  const totalBudgetRemaining = totalBudgetAmount - totalBudgetSpent;

  // 3. Perbandingan dengan siklus sebelumnya
  const expenseDiff = cycleExpense - prevCycleExpense;
  const expenseDiffPct =
    prevCycleExpense > 0
      ? Math.round(((cycleExpense - prevCycleExpense) / prevCycleExpense) * 100)
      : cycleExpense > 0
      ? 100
      : 0;
  const prevCycleNet = prevCycleIncome - prevCycleExpense;

  // 4. Filter transaksi siklus ini per Kategori & per Bank/Tunai
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'all' && tx.type !== filterType) return false;

      if (filterCategory !== 'all') {
        if (tx.categoryId !== filterCategory && tx.category?.name !== filterCategory) {
          return false;
        }
      }

      if (filterAccount !== 'all') {
        const isFrom = tx.accountId === filterAccount;
        const isTo = tx.toAccountId === filterAccount;
        if (!isFrom && !isTo) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = tx.name.toLowerCase().includes(q);
        const matchCat = (tx.category?.name || '').toLowerCase().includes(q);
        const matchAcc = (tx.account?.name || '').toLowerCase().includes(q);
        const matchNote = (tx.note || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchAcc && !matchNote) return false;
      }

      return true;
    });
  }, [transactions, filterType, filterCategory, filterAccount, searchQuery]);

  // Sub-totals for current active filter (per kategori / per bank/tunai)
  const filteredStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transferOut = 0;
    let transferIn = 0;

    for (const tx of filteredTransactions) {
      if (tx.type === 'income') {
        income += tx.amount;
      } else if (tx.type === 'expense') {
        expense += tx.amount;
      } else if (tx.type === 'transfer') {
        if (filterAccount !== 'all') {
          if (tx.accountId === filterAccount) transferOut += tx.amount;
          if (tx.toAccountId === filterAccount) transferIn += tx.amount;
        } else {
          transferOut += tx.amount;
        }
      }
    }

    return {
      income,
      expense,
      transferOut,
      transferIn,
      net: income + transferIn - (expense + (filterAccount !== 'all' ? transferOut : 0)),
    };
  }, [filteredTransactions, filterAccount]);

  const isFiltered =
    filterType !== 'all' ||
    filterCategory !== 'all' ||
    filterAccount !== 'all' ||
    searchQuery.trim() !== '';

  const visibleTransactions = filteredTransactions.slice(
    (txPage - 1) * txPageSize,
    txPage * txPageSize
  );

  const visibleBudgets = combinedBudgets.slice(
    (budgetPage - 1) * budgetPageSize,
    budgetPage * budgetPageSize
  );

  function handleExportCycleCSV() {
    if (filteredTransactions.length === 0) return;
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Bank/Dompet', 'Nama Transaksi', 'Nominal (IDR)', 'Catatan'];
    const rows = filteredTransactions.map(t => {
      const accName =
        t.account?.name || accounts.find(a => a.id === t.accountId)?.name || 'Utama';
      const toAccName =
        t.toAccount?.name || accounts.find(a => a.id === t.toAccountId)?.name || '';
      return [
        t.transactionDate,
        t.type === 'income' ? 'Pemasukan' : t.type === 'transfer' ? 'Transfer/Tarik Tunai' : 'Pengeluaran',
        `"${(t.category?.name || (t.type === 'transfer' ? 'Transfer' : 'Umum')).replace(/"/g, '""')}"`,
        `"${(t.type === 'transfer' && toAccName ? `${accName} -> ${toAccName}` : accName).replace(/"/g, '""')}"`,
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
    link.setAttribute('download', `Rekap-Siklus-${cycleLabel.replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* ═══════════ 1. DUA KARTU UANG SISA (SIKLUS VS POS BUDGETING) + PERBANDINGAN ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Card A: Sisa Uang dari Pemasukan & Pengeluaran Siklus Ini */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              1. Sisa Uang Siklus ({cycleLabel})
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                cycleRemainingCash < 0
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  : isAllSurplusSaved
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              )}
            >
              {cycleRemainingCash < 0 ? 'Defisit Siklus' : isAllSurplusSaved ? 'Surplus Diamankan' : 'Surplus Siklus'}
            </span>
          </div>

          <div>
            <p
              className={cn(
                'text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight',
                cycleRemainingCash >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {cycleRemainingCash < 0 && showBalance ? '-' : ''}
              {display(Math.abs(cycleRemainingCash))}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Selisih murni pemasukan &amp; pengeluaran operasional siklus ini (bukan saldo total dompet)
            </p>
          </div>

          <div className="pt-2.5 border-t border-stone-100 dark:border-zinc-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Total Pemasukan Siklus:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{display(cycleIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Total Pengeluaran Siklus:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                -{display(cycleExpense)}
              </span>
            </div>
            {cycleSavings > 0 && (
              <div className="flex justify-between pt-1 border-t border-dashed border-stone-200 dark:border-zinc-800 text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <PiggyBank className="w-3.5 h-3.5" />
                  Dialokasikan ke Tabungan:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {display(cycleSavings)}
                </span>
              </div>
            )}
            {effectiveIncome > 0 && effectiveIncome !== cycleIncome && (
              <div className="flex justify-between pt-1 border-t border-dashed border-stone-200 dark:border-zinc-800 text-[11px]">
                <span className="text-zinc-400">Sisa dari Gaji ({display(effectiveIncome)}):</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {effectiveRemainingCash < 0 && showBalance ? '-' : ''}
                  {display(Math.abs(effectiveRemainingCash))}
                </span>
              </div>
            )}
          </div>

          {/* 1-Click Sweep Surplus to Savings Button or Completed Badge */}
          {isAllSurplusSaved ? (
            <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Seluruh sisa surplus ({display(cycleSavings)}) telah diamankan ke Tabungan</span>
            </div>
          ) : cycleRemainingCash > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSweepAmount(String(unsavedSurplus > 0 ? unsavedSurplus : cycleRemainingCash));
                if (!sweepGoalId && savingsGoals[0]) setSweepGoalId(savingsGoals[0].id);
                if (!sweepAccountId && accounts[0]) setSweepAccountId(accounts[0].id);
                setShowSweepModal(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all touch-manipulation"
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Tabungkan Sisa Uang {unsavedSurplus > 0 && unsavedSurplus < cycleRemainingCash ? `(${display(unsavedSurplus)})` : 'Siklus'}</span>
            </button>
          ) : null}
        </div>

        {/* Card B: Sisa Uang dari Pos-pos Budgeting */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              2. Sisa Uang Pos Budgeting
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                totalBudgetRemaining >= 0
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              )}
            >
              {totalBudgetRemaining >= 0 ? 'Masih Sisa Budget' : 'Overbudget'}
            </span>
          </div>

          <div>
            <p
              className={cn(
                'text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight',
                totalBudgetRemaining >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {totalBudgetRemaining < 0 && showBalance ? '-' : ''}
              {display(Math.abs(totalBudgetRemaining))}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Total sisa jatah anggaran dari {combinedBudgets.length} pos budgeting di siklus ini
            </p>
          </div>

          <div className="pt-2.5 border-t border-stone-100 dark:border-zinc-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Total Jatah Pos Budget:</span>
              <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
                {display(totalBudgetAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Terpakai di Pos Budget:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                -{display(totalBudgetSpent)}
              </span>
            </div>
          </div>
        </div>

        {/* Card C: Perbandingan dengan Siklus Sebelumnya */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              3. Vs Siklus Sebelumnya
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {prevCycleLabel}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                expenseDiff < 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : expenseDiff > 0
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-stone-100 dark:bg-zinc-800 text-zinc-500'
              )}
            >
              {expenseDiff < 0 ? (
                <TrendingDown className="w-5 h-5" />
              ) : expenseDiff > 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <Minus className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                {prevCycleExpense === 0 && cycleExpense === 0
                  ? 'Belum Ada Data Pembanding'
                  : expenseDiff < 0
                  ? `Lebih Hemat ${Math.abs(expenseDiffPct)}%`
                  : expenseDiff > 0
                  ? `Lebih Boros +${expenseDiffPct}%`
                  : 'Pengeluaran Sama Persis'}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                {expenseDiff < 0
                  ? `Hemat ${display(Math.abs(expenseDiff))} dibanding siklus lalu`
                  : expenseDiff > 0
                  ? `Naik +${display(expenseDiff)} dibanding siklus lalu`
                  : 'Tidak ada selisih pengeluaran'}
              </p>
            </div>
          </div>

          <div className="pt-2.5 border-t border-stone-100 dark:border-zinc-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Pengeluaran Siklus Lalu:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                {display(prevCycleExpense)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Uang Sisa Siklus Lalu:</span>
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  prevCycleNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                )}
              >
                {prevCycleNet < 0 && showBalance ? '-' : ''}
                {display(Math.abs(prevCycleNet))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ 2. RINCIAN SISA UANG PER POS BUDGETING ═══════════ */}
      {combinedBudgets.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Rincian Sisa Uang per Pos Budgeting ({cycleLabel})</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Evaluasi jatah anggaran vs realisasi pengeluaran dan uang sisa di setiap pos
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 tabular-nums self-start sm:self-auto">
              Total Sisa Pos:{' '}
              <span
                className={cn(
                  'font-bold',
                  totalBudgetRemaining >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {totalBudgetRemaining < 0 && showBalance ? '-' : ''}
                {display(Math.abs(totalBudgetRemaining))}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {visibleBudgets.map(b => {
              const isOver = b.remaining < 0;
              const pct = Math.min(100, Math.max(0, b.percentage));
              return (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border border-stone-200/70 dark:border-zinc-800 bg-stone-50/40 dark:bg-zinc-800/30 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                      {b.category?.name || 'Kategori'}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
                        isOver
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      )}
                    >
                      {isOver ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Over {b.percentage}%</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{b.percentage}%</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-stone-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isOver
                          ? 'bg-rose-600'
                          : b.percentage >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="space-y-1 text-[11px] pt-0.5">
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Jatah Budget:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                        {display(b.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Terpakai:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                        -{display(b.spent)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-stone-200/60 dark:border-zinc-700/60 font-bold">
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {isOver ? 'Lewat Batas:' : 'Sisa Uang Pos:'}
                      </span>
                      <span
                        className={cn(
                          'tabular-nums',
                          isOver
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {isOver ? '-' : '+'}
                        {display(Math.abs(b.remaining))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <PaginationBar
            currentPage={budgetPage}
            totalItems={combinedBudgets.length}
            pageSize={budgetPageSize}
            onPageChange={setBudgetPage}
            onPageSizeChange={setBudgetPageSize}
            pageSizeOptions={[6, 12, 24]}
            itemLabel="pos anggaran"
            className="rounded-xl border border-stone-100 dark:border-zinc-800"
          />
        </div>
      )}

      {/* ═══════════ 3. DAFTAR TRANSAKSI SIKLUS INI + FILTER KATEGORI & BANK/TUNAI ═══════════ */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <span>
                Daftar Transaksi &amp; Filter Siklus ({cycleLabel})
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Filter berdasarkan <strong>Kategori</strong> atau <strong>Bank / Tunai</strong> untuk melihat rincian pemasukan &amp; pengeluaran spesifik
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCycleCSV}
            disabled={filteredTransactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-40 transition-colors self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV Siklus Ini ({filteredTransactions.length})</span>
          </button>
        </div>

        {/* Filter Controls: Bottom Sheet Mobile-First (No Native Select, No Emoji) */}
        <FilterBottomSheet
          searchQuery={searchQuery}
          onSearchChange={q => {
            setSearchQuery(q);
            setTxPage(1);
          }}
          searchPlaceholder="Cari nama transaksi atau catatan..."
          filterType={filterType}
          onFilterTypeChange={t => {
            setFilterType(t);
            setTxPage(1);
          }}
          categories={categories}
          filterCategory={filterCategory}
          onFilterCategoryChange={c => {
            setFilterCategory(c);
            setTxPage(1);
          }}
          accounts={accounts}
          filterAccount={filterAccount}
          onFilterAccountChange={a => {
            setFilterAccount(a);
            setTxPage(1);
          }}
        />

        {/* Dynamic Sub-total Strip when Filtered (or always visible for quick insight) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-800 text-xs">
          <div>
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 block">
              Pemasukan {isFiltered ? '(Terfilter)' : 'Siklus'}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{display(filteredStats.income)}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 block">
              Pengeluaran {isFiltered ? '(Terfilter)' : 'Siklus'}
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              -{display(filteredStats.expense)}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 block">
              Tarik / Transfer
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {display(filteredStats.transferOut + filteredStats.transferIn)}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 block">
              Selisih / Sisa {isFiltered ? 'Filter' : 'Siklus'}
            </span>
            <span
              className={cn(
                'font-extrabold tabular-nums',
                filteredStats.net >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {filteredStats.net < 0 && showBalance ? '-' : ''}
              {display(Math.abs(filteredStats.net))}
            </span>
          </div>
        </div>

        {/* Transactions Table/List */}
        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center space-y-1.5">
            <Wallet className="w-7 h-7 text-zinc-300 dark:text-zinc-600 mx-auto" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Tidak ada transaksi pada siklus {cycleLabel} untuk filter ini
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  setFilterType('all');
                  setFilterCategory('all');
                  setFilterAccount('all');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-zinc-800 border border-stone-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            {visibleTransactions.map(tx => {
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              const isSavingsTransfer = (isTransfer || tx.type === 'expense') && (
                tx.category?.name === 'Tabungan' ||
                tx.name.startsWith('Setor Tabungan') ||
                (tx.note && (tx.note.includes('[Tabungan]') || tx.note.includes('Sweeping Sisa Uang Siklus'))) ||
                (isTransfer && !tx.toAccountId)
              );
              const accName =
                tx.account?.name || accounts.find(a => a.id === tx.accountId)?.name || null;
              const toAccName =
                tx.toAccount?.name || accounts.find(a => a.id === tx.toAccountId)?.name || null;

              return (
                <div
                  key={tx.id}
                  className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                        isSavingsTransfer
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : isTransfer
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      )}
                    >
                      {isSavingsTransfer ? (
                        <PiggyBank className="w-4 h-4" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="w-4 h-4" />
                      ) : isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                        {tx.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {isSavingsTransfer ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            Setor Tabungan
                          </span>
                        ) : isTransfer ? (
                          <span>Transfer Antar Dompet</span>
                        ) : (
                          <span>{tx.category?.name || 'Umum'}</span>
                        )}
                        {accName && (
                          <>
                            <span>·</span>
                            <span className="font-semibold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px]">
                              {isSavingsTransfer ? `${accName} → Tabungan` : isTransfer && toAccName ? `${accName} → ${toAccName}` : accName}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>{formatDateShort(tx.transactionDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={cn(
                        'font-bold text-xs sm:text-sm tabular-nums',
                        isSavingsTransfer
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isTransfer
                          ? 'text-blue-600 dark:text-blue-400'
                          : isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-900 dark:text-white'
                      )}
                    >
                      {isSavingsTransfer ? '→ ' : isTransfer ? '' : isIncome ? '+' : '-'}
                      {display(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}

            <PaginationBar
              currentPage={txPage}
              totalItems={filteredTransactions.length}
              pageSize={txPageSize}
              onPageChange={setTxPage}
              onPageSizeChange={setTxPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemLabel="transaksi"
            />
          </div>
        )}
      </div>

      {/* Bottom Sheet: Tabungkan Sisa Uang Siklus (Sweeping Surplus) */}
      <Dialog open={showSweepModal} onOpenChange={setShowSweepModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              <span>Tabungkan Sisa Uang Siklus ({cycleLabel})</span>
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Amankan surplus <strong>{formatCurrency(cycleRemainingCash)}</strong> langsung ke Target Tabungan Anda
            </p>
          </DialogHeader>

          {savingsGoals.length === 0 ? (
            <div className="py-5 text-center space-y-3 text-xs">
              <p className="text-zinc-600 dark:text-zinc-300 font-medium">
                Anda belum membuat Target Tabungan. Buat target tabungan terlebih dahulu untuk menyimpan surplus siklus ini.
              </p>
              <Link
                href="/savings"
                onClick={() => setShowSweepModal(false)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold"
              >
                <PiggyBank className="w-4 h-4" />
                <span>Buka Halaman Tabungan</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5 text-xs pt-2">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                  Pilih Target Tabungan Tujuan
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {savingsGoals.map(goal => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setSweepGoalId(goal.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left flex items-center justify-between transition-all touch-manipulation',
                        sweepGoalId === goal.id
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white font-bold'
                          : 'bg-stone-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-stone-200 dark:border-zinc-700'
                      )}
                    >
                      <span className="truncate">{goal.name}</span>
                      {goal.currentAmount !== undefined && (
                        <span className="text-[11px] opacity-80 tabular-nums">
                          Terkumpul: {formatCurrency(goal.currentAmount)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                  Nominal Sisa yang Ditabungkan (Rp)
                </label>
                <input
                  value={sweepAmount ? Number(sweepAmount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                  onChange={e => setSweepAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 font-bold text-sm text-zinc-900 dark:text-white tabular-nums"
                />
                <div className="flex gap-1.5 pt-0.5">
                  {[
                    { label: '25% Sisa', val: Math.round(cycleRemainingCash * 0.25) },
                    { label: '50% Sisa', val: Math.round(cycleRemainingCash * 0.5) },
                    { label: '100% Semua Sisa', val: cycleRemainingCash },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSweepAmount(String(preset.val))}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold touch-manipulation"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {accounts.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Potong dari Saldo Dompet / Bank
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {accounts.map(acc => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSweepAccountId(acc.id)}
                        className={cn(
                          'p-2 rounded-xl border text-left text-[11px] font-bold truncate transition-all touch-manipulation',
                          sweepAccountId === acc.id
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                            : 'bg-stone-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700'
                        )}
                      >
                        {acc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSweepModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 font-bold text-zinc-600 dark:text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending || !sweepGoalId || !parseInt(sweepAmount || '0', 10)}
                  onClick={() => {
                    const amt = parseInt(sweepAmount.replace(/[^0-9]/g, '') || '0', 10);
                    if (!amt || !sweepGoalId) return;
                    startTransition(async () => {
                      const res = await addSavings({
                        savingsGoalId: sweepGoalId,
                        amount: amt,
                        transactionDate: toDateString(new Date()),
                        note: `Sweeping Sisa Uang Siklus (${cycleLabel})`,
                        deductFromCash: Boolean(sweepAccountId),
                        accountId: sweepAccountId || null,
                      });
                      if (res.success) {
                        toast({
                          title: 'Sisa Siklus Berhasil Ditabungkan! ✓',
                          description: `${formatCurrency(amt)} telah diamankan ke Target Tabungan.`,
                        });
                        setShowSweepModal(false);
                        router.refresh();
                      } else {
                        toast({ title: res.error || 'Gagal menyimpan tabungan', variant: 'destructive' });
                      }
                    });
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs disabled:opacity-40"
                >
                  {isPending ? 'Menyimpan...' : 'Tabungkan Sekarang'}
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
