'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort } from '@/lib/dates';
import { useBalanceVisibility } from '@/context/BalanceVisibilityContext';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Search,
  Download,
  PieChart,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Filter,
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
}: CycleHistoryRecapProps) {
  const { showBalance } = useBalanceVisibility();
  const mask = '••••••';
  const display = (val: number) => (showBalance ? formatCurrency(val) : mask);

  // Filter states for transactions in this cycle
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllTx, setShowAllTx] = useState<boolean>(false);

  // 1. Sisa Uang Siklus (Pemasukan - Pengeluaran di siklus ini, BUKAN saldo dompet keseluruhan)
  const baseIncomeForSurplus = cycleIncome > 0 ? cycleIncome : effectiveIncome;
  const cycleRemainingCash = cycleIncome - cycleExpense;
  const effectiveRemainingCash = baseIncomeForSurplus - cycleExpense;

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

  const visibleTransactions = showAllTx
    ? filteredTransactions
    : filteredTransactions.slice(0, 12);

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
                cycleRemainingCash >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              )}
            >
              {cycleRemainingCash >= 0 ? 'Surplus Siklus' : 'Defisit Siklus'}
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
              Selisih murni pemasukan &amp; pengeluaran di siklus ini (bukan saldo total dompet)
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
            {combinedBudgets.map(b => {
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

        {/* Filter Controls: Tipe + Kategori + Bank/Tunai + Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Filter Tipe */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-stone-200 dark:border-zinc-700 focus:outline-none"
          >
            <option value="all">Semua Tipe ({transactions.length})</option>
            <option value="expense">Pengeluaran (-)</option>
            <option value="income">Pemasukan (+)</option>
            <option value="transfer">Tarik Tunai / Transfer (⇄)</option>
          </select>

          {/* Filter Kategori */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-stone-200 dark:border-zinc-700 focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                Kategori: {cat.name}
              </option>
            ))}
          </select>

          {/* Filter Bank / Tunai */}
          <select
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-stone-200 dark:border-zinc-700 focus:outline-none"
          >
            <option value="all">Semua Bank &amp; Tunai</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                Dompet: {acc.name}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama / catatan..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-stone-200 dark:border-zinc-700 focus:outline-none"
            />
          </div>
        </div>

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
                        isTransfer
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      )}
                    >
                      {isTransfer ? (
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
                        <span>{ isTransfer ? 'Transfer Antar Dompet' : (tx.category?.name || 'Umum') }</span>
                        {accName && (
                          <>
                            <span>·</span>
                            <span className="font-semibold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px]">
                              {isTransfer && toAccName ? `${accName} → ${toAccName}` : accName}
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
                        isTransfer
                          ? 'text-blue-600 dark:text-blue-400'
                          : isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-900 dark:text-white'
                      )}
                    >
                      {isTransfer ? '⇄ ' : isIncome ? '+' : '-'}
                      {display(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredTransactions.length > 12 && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setShowAllTx(!showAllTx)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              {showAllTx
                ? 'Tampilkan Lebih Sedikit'
                : `Lihat Semua ${filteredTransactions.length} Transaksi di Siklus Ini`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
