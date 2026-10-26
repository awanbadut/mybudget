'use client';

import { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort, toDateString } from '@/lib/dates';
import { createTransaction, updateTransaction, deleteTransaction } from '@/actions/transactions';
import { transferBetweenAccounts, AccountWithBalance } from '@/actions/accounts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Search, Plus, Pencil, Trash2, Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car, ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop, ArrowDownLeft, ArrowUpRight, Repeat, ArrowLeftRight, ArrowDownToLine, Lightbulb, Calculator, Sparkles, Building2, Coins, Smartphone, Wallet, X, Check, PiggyBank, Scale, ChevronDown } from 'lucide-react';
import { RecurringManager, RecurringItem } from '@/components/RecurringManager';
import { TransferModal } from '@/components/TransferModal';
import { CycleOption } from '@/components/CycleSelector';
import { FilterBottomSheet } from '@/components/FilterBottomSheet';
import { PaginationBar } from '@/components/PaginationBar';
import { cn, triggerHaptic } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car,
  ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop, PiggyBank,
};

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

interface AccountRef {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: string;
  transactionDate: string;
  note: string | null;
  categoryId?: string | null;
  category?: Category | null;
  accountId?: string | null;
  account?: AccountRef | null;
  toAccountId?: string | null;
  toAccount?: AccountRef | null;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  accounts?: AccountWithBalance[];
  recurringList?: RecurringItem[];
  cycles?: CycleOption[];
  currentMonth?: number;
  currentYear?: number;
  initialType?: 'income' | 'expense' | 'transfer';
  initialName?: string;
  initialAmount?: string;
  openForm?: boolean;
}

export function TransactionListClient({
  transactions,
  categories,
  accounts = [],
  recurringList = [],
  cycles = [],
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
  initialType,
  initialName = '',
  initialAmount = '',
  openForm,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const defaultAccount = accounts.find(a => a.isDefault) || accounts[0];
  const cashAccount = accounts.find(a => a.type === 'cash') || accounts[0];
  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const defaultBank = bankAccounts[0] || accounts.find(a => a.id !== cashAccount?.id) || accounts[0];

  const [showForm, setShowForm] = useState(openForm || false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  // Undo-delete: baris disembunyikan lokal, hapus ke server ditunda selama jendela undo
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [subTab, setSubTab] = useState<'ledger' | 'recurring'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>(initialType || 'all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCycle, setFilterCycle] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const dueRecurringCount = useMemo(() => {
    return recurringList.filter(
      r => r.isActive && (r.lastPostedMonth !== currentMonth || r.lastPostedYear !== currentYear)
    ).length;
  }, [recurringList, currentMonth, currentYear]);

  // Form states
  const [formType, setFormType] = useState<'income' | 'expense' | 'transfer'>(initialType || 'expense');
  const [transferSubMode, setTransferSubMode] = useState<'withdraw' | 'deposit' | 'free'>('withdraw');
  const [formName, setFormName] = useState(initialName || '');
  const [formCategory, setFormCategory] = useState('');
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [formAccount, setFormAccount] = useState(defaultAccount?.id || '');
  const [formToAccount, setFormToAccount] = useState('');
  const [formAmount, setFormAmount] = useState(initialAmount || '');
  const [formDate, setFormDate] = useState(toDateString(new Date()));
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');
  const [showCalc, setShowCalc] = useState(false);
  const [calcExpr, setCalcExpr] = useState(initialAmount || '');

  function evaluateMathExpression(expr: string): number | null {
    const cleaned = expr.replace(/\./g, '').replace(/,/g, '').replace(/[x×]/gi, '*').replace(/[^0-9+\-*]/g, '');
    if (!cleaned) return null;
    try {
      const addParts = cleaned.split('+');
      let total = 0;
      for (const addPart of addParts) {
        if (!addPart) continue;
        const subParts = addPart.split('-');
        let subVal = 0;
        subParts.forEach((mulPart, idx) => {
          if (!mulPart) return;
          const factors = mulPart.split('*').filter(Boolean).map(Number);
          const prod = factors.length > 0 ? factors.reduce((a, b) => a * b, 1) : 0;
          if (idx === 0) subVal += prod;
          else subVal -= prod;
        });
        total += subVal;
      }
      return Number.isFinite(total) && total >= 0 ? Math.round(total) : null;
    } catch {
      return null;
    }
  }

  function applyQuickPreset(preset: { name: string; amount: number; categoryKeywords: string[] }) {
    triggerHaptic('selection');
    setFormName(preset.name);
    if (preset.amount > 0) {
      setFormAmount(String(preset.amount));
      setCalcExpr(String(preset.amount));
    }
    const matchedCat = filteredCategories.find(c =>
      preset.categoryKeywords.some(kw => c.name.toLowerCase().includes(kw.toLowerCase()))
    ) || filteredCategories[0];
    if (matchedCat) {
      setFormCategory(matchedCat.id);
    }
  }

  // Months list from data
  const months = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      const d = t.transactionDate.substring(0, 7);
      set.add(d);
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    const activeCycleObj =
      filterCycle !== 'all' ? cycles.find(c => String(c.offset) === filterCycle) : undefined;

    return transactions.filter(t => {
      if (hiddenIds.has(t.id)) return false;
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
      if (filterAccount !== 'all') {
        const isFrom = t.accountId === filterAccount;
        const isTo = t.toAccountId === filterAccount;
        if (!isFrom && !isTo) return false;
      }
      if (activeCycleObj) {
        if (
          t.transactionDate < activeCycleObj.startDateStr ||
          t.transactionDate > activeCycleObj.endDateStr
        ) {
          return false;
        }
      }
      if (filterMonth !== 'all' && !t.transactionDate.startsWith(filterMonth)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchCat = t.category?.name.toLowerCase().includes(q);
        const matchAccount = (t.account?.name || '').toLowerCase().includes(q);
        const matchNote = t.note?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchAccount && !matchNote) return false;
      }
      return true;
    });
  }, [transactions, hiddenIds, filterType, filterCategory, filterAccount, filterCycle, cycles, filterMonth, searchQuery]);

  const filteredCategories = categories.filter(c => c.type === formType);

  function resetForm() {
    setFormName('');
    setFormCategory('');
    setShowCategorySheet(false);
    setCategorySearch('');
    setShowAccountSheet(false);
    setFormAccount(defaultAccount?.id || '');
    setFormToAccount('');
    setFormAmount('');
    setFormDate(toDateString(new Date()));
    setFormNote('');
    setFormError('');
    setEditingTx(null);
    setFormType(initialType || 'expense');
    setTransferSubMode('withdraw');
    setShowCalc(false);
    setCalcExpr('');
  }

  function applyTransferPreset(sub: 'withdraw' | 'deposit' | 'free') {
    setTransferSubMode(sub);
    setFormError('');
    if (sub === 'withdraw') {
      const from = defaultBank?.id || accounts[0]?.id || '';
      const to = cashAccount?.id || accounts.find(a => a.id !== from)?.id || '';
      setFormAccount(from);
      setFormToAccount(to);
      if (!editingTx) {
        const fromAcc = accounts.find(a => a.id === from);
        setFormName(`Tarik Tunai: ${fromAcc?.name || 'ATM'} → Tunai`);
      }
    } else if (sub === 'deposit') {
      const from = cashAccount?.id || accounts[0]?.id || '';
      const to = defaultBank?.id || accounts.find(a => a.id !== from)?.id || '';
      setFormAccount(from);
      setFormToAccount(to);
      if (!editingTx) {
        const toAcc = accounts.find(a => a.id === to);
        setFormName(`Setor Tunai: Tunai → ${toAcc?.name || 'Bank'}`);
      }
    } else {
      const from = defaultAccount?.id || accounts[0]?.id || '';
      const to = accounts.find(a => a.id !== from)?.id || '';
      setFormAccount(from);
      setFormToAccount(to);
      if (!editingTx) {
        const fromAcc = accounts.find(a => a.id === from);
        const toAcc = accounts.find(a => a.id === to);
        setFormName(`Transfer: ${fromAcc?.name || 'Dompet'} → ${toAcc?.name || 'Dompet'}`);
      }
    }
  }

  function handleFormTypeChange(newType: 'income' | 'expense' | 'transfer') {
    setFormType(newType);
    setFormError('');
    if (newType === 'transfer') {
      applyTransferPreset('withdraw');
    } else {
      if (!formAccount) setFormAccount(defaultAccount?.id || '');
      setFormToAccount('');
    }
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx);
    const tType = (tx.type === 'income' ? 'income' : tx.type === 'transfer' ? 'transfer' : 'expense');
    setFormType(tType);
    setFormName(tx.name);
    setFormCategory(tx.categoryId || '');
    setFormAccount(tx.accountId || defaultAccount?.id || '');
    setFormToAccount(tx.toAccountId || '');
    setFormAmount(String(tx.amount));
    setFormDate(tx.transactionDate);
    setFormNote(tx.note || '');
    setFormError('');
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const amount = parseInt(formAmount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) { setFormError('Nominal harus lebih dari 0'); return; }
    if (!formDate) { setFormError('Tanggal harus diisi'); return; }

    if (formType === 'transfer') {
      if (!formAccount || !formToAccount) {
        setFormError('Pilih dompet asal dan dompet tujuan');
        return;
      }
      if (formAccount === formToAccount) {
        setFormError('Dompet asal dan tujuan tidak boleh sama');
        return;
      }

      startTransition(async () => {
        const fromAcc = accounts.find(a => a.id === formAccount);
        const toAcc = accounts.find(a => a.id === formToAccount);
        let defaultName = formName.trim();
        if (!defaultName) {
          if (fromAcc?.type === 'bank' && toAcc?.type === 'cash') {
            defaultName = `Tarik Tunai: ${fromAcc.name} → Tunai`;
          } else if (fromAcc?.type === 'cash' && toAcc?.type === 'bank') {
            defaultName = `Setor Tunai: Tunai → ${toAcc.name}`;
          } else {
            defaultName = `Transfer: ${fromAcc?.name} → ${toAcc?.name}`;
          }
        }

        let result;
        if (editingTx) {
          result = await updateTransaction(editingTx.id, {
            type: 'transfer',
            name: defaultName,
            accountId: formAccount,
            toAccountId: formToAccount,
            amount,
            transactionDate: formDate,
            note: formNote.trim() || defaultName,
          });
        } else {
          result = await transferBetweenAccounts({
            name: defaultName,
            fromAccountId: formAccount,
            toAccountId: formToAccount,
            amount,
            transactionDate: formDate,
            note: formNote.trim() || defaultName,
          });
        }

        if (result.success) {
          toast({
            title: editingTx ? 'Transfer diperbarui' : 'Tarik Tunai / Transfer Berhasil! ✓',
            description: `${formatCurrency(amount)} dipindahkan dari ${fromAcc?.name} ke ${toAcc?.name}`,
          });
          setShowForm(false);
          resetForm();
          router.refresh();
        } else {
          setFormError(result.error || 'Terjadi kesalahan saat memproses transfer');
        }
      });
      return;
    }

    // Regular Income / Expense transaction
    if (!formName.trim()) { setFormError('Nama transaksi harus diisi'); return; }
    if (!formCategory) { setFormError('Pilih kategori'); return; }

    startTransition(async () => {
      const data = {
        type: formType,
        name: formName.trim(),
        categoryId: formCategory || null,
        accountId: formAccount || null,
        amount,
        transactionDate: formDate,
        note: formNote.trim() || null,
      };

      const result = editingTx
        ? await updateTransaction(editingTx.id, data)
        : await createTransaction(data);

      if (result.success) {
        triggerHaptic('success');
        toast({ title: editingTx ? 'Transaksi diperbarui' : 'Transaksi ditambahkan', description: `${formName} ${formatCurrency(amount)}` });
        setShowForm(false);
        resetForm();
        router.refresh();
      } else {
        setFormError(result.error || 'Terjadi kesalahan');
      }
    });
  }

  const UNDO_WINDOW_MS = 5000;

  // Jika pengguna meninggalkan halaman, eksekusi hapus yang masih menunggu agar tidak "menggantung"
  useEffect(() => {
    const pending = pendingDeletes.current;
    return () => {
      pending.forEach((timer, id) => {
        clearTimeout(timer);
        void deleteTransaction(id);
      });
      pending.clear();
    };
  }, []);

  function unhide(id: string) {
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function undoDelete(id: string) {
    const timer = pendingDeletes.current.get(id);
    if (!timer) return;
    clearTimeout(timer);
    pendingDeletes.current.delete(id);
    unhide(id);
    triggerHaptic('light');
    toast({ title: 'Penghapusan dibatalkan ✓' });
  }

  function scheduleDelete(id: string, name: string) {
    triggerHaptic('medium');
    setHiddenIds(prev => new Set(prev).add(id));

    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(id);
      const result = await deleteTransaction(id);
      if (result.success) {
        router.refresh();
      } else {
        unhide(id);
        toast({
          title: 'Gagal menghapus transaksi',
          description: result.error,
          variant: 'destructive',
        });
      }
    }, UNDO_WINDOW_MS);
    pendingDeletes.current.set(id, timer);

    toast({
      title: 'Transaksi dihapus',
      description: name,
      duration: UNDO_WINDOW_MS,
      action: (
        <ToastAction altText="Urungkan penghapusan transaksi" onClick={() => undoDelete(id)}>
          Urungkan
        </ToastAction>
      ),
    });
  }

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5 sm:space-y-6 font-sans w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight leading-tight">
            Buku Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Daftar lengkap arus kas masuk, keluar, dan tagihan berkala
          </p>
        </div>

        {subTab === 'ledger' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98] touch-manipulation"
            >
              <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
              <span>Transfer Saldo</span>
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98] touch-manipulation"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        )}
      </div>

      {/* Subtab Switcher */}
      <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-zinc-800/80 rounded-xl w-full sm:w-fit transition-colors">
        <button
          type="button"
          onClick={() => setSubTab('ledger')}
          className={cn(
            'flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation',
            subTab === 'ledger'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          )}
        >
          Buku Kas Harian ({transactions.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('recurring')}
          className={cn(
            'flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation',
            subTab === 'recurring'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          )}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Tagihan & Berulang ({recurringList.length})</span>
          {dueRecurringCount > 0 && (
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"
              title={`${dueRecurringCount} transaksi jatuh tempo bulan ini`}
            />
          )}
        </button>
      </div>

      {/* View: Recurring Manager */}
      {subTab === 'recurring' && (
        <RecurringManager
          recurringList={recurringList}
          categories={categories}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      )}

      {/* View: Ledger */}
      {subTab === 'ledger' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full min-w-0">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-w-0 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">Total Pemasukan</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                </div>
              </div>
              <p className="font-sans text-sm sm:text-lg lg:text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                {formatCurrency(totalIncome)}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-w-0 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">Total Pengeluaran</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                </div>
              </div>
              <p className="font-sans text-sm sm:text-lg lg:text-xl font-bold text-zinc-900 dark:text-white tabular-nums truncate">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </div>

      {/* Mobile-First Bottom Sheet Filters */}
      <FilterBottomSheet
        searchQuery={searchQuery}
        onSearchChange={q => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Cari transaksi, pos belanja, atau catatan..."
        filterType={filterType}
        onFilterTypeChange={t => {
          setFilterType(t);
          setCurrentPage(1);
        }}
        categories={categories}
        filterCategory={filterCategory}
        onFilterCategoryChange={c => {
          setFilterCategory(c);
          setCurrentPage(1);
        }}
        accounts={accounts}
        filterAccount={filterAccount}
        onFilterAccountChange={a => {
          setFilterAccount(a);
          setCurrentPage(1);
        }}
        cycles={cycles}
        filterCycle={filterCycle}
        onFilterCycleChange={val => {
          setFilterCycle(val);
          if (val !== 'all') setFilterMonth('all');
          setCurrentPage(1);
        }}
      />

      {/* Transaction List (Paginated per 20 by default) */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5 transition-colors">
          <p className="font-semibold text-sm text-zinc-900 dark:text-white">Belum Ada Transaksi</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Mulai catat transaksi untuk melihat riwayat arus kas.</p>
          <button
            className="mt-2 text-xs font-semibold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 px-4 py-2 rounded-xl transition-all shadow-sm"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + Tambah Transaksi
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden w-full min-w-0 transition-colors">
          <div className="divide-y divide-stone-100 dark:divide-zinc-800">
          {filtered
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map(tx => {
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';
            const isAdjustment = tx.name.startsWith('Penyesuaian Saldo') || (tx.name.toLowerCase().includes('penyesuaian saldo'));
            const isSavingsTransfer = !isAdjustment && ((isTransfer || tx.type === 'expense') && (
              tx.category?.name === 'Tabungan' ||
              tx.name.startsWith('Setor Tabungan') ||
              (tx.note && (tx.note.includes('[Tabungan]') || tx.note.includes('Sweeping Sisa Uang Siklus'))) ||
              (isTransfer && !tx.toAccountId)
            ));
            const iconName = tx.category?.icon || 'MoreHorizontal';
            const Icon = isAdjustment ? Scale : isSavingsTransfer ? PiggyBank : isTransfer ? ArrowLeftRight : (ICON_MAP[iconName] || MoreHorizontal);
            const accountName = tx.account?.name || (tx.accountId ? accounts.find(a => a.id === tx.accountId)?.name : null);
            const toAccountName = tx.toAccount?.name || (tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId)?.name : null);

            return (
              <div key={tx.id} className="flex items-center justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-4 hover:bg-stone-50/60 dark:hover:bg-zinc-800/40 transition-colors min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      isAdjustment
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                        : isSavingsTransfer
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : isTransfer
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        : isIncome
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                      {tx.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {isAdjustment ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <Scale className="w-3 h-3" />
                          Penyesuaian Saldo
                        </span>
                      ) : isSavingsTransfer ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <PiggyBank className="w-3 h-3" />
                          Setor Tabungan
                        </span>
                      ) : isTransfer ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          Transfer Antar Dompet
                        </span>
                      ) : (
                        <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {tx.category?.name || 'Umum'}
                        </span>
                      )}
                      {accountName && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs">·</span>
                          <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {isSavingsTransfer ? `${accountName} → Tabungan` : isTransfer && toAccountName ? `${accountName} → ${toAccountName}` : accountName}
                          </span>
                        </>
                      )}
                      <span className="text-zinc-300 dark:text-zinc-600 text-xs">·</span>
                      <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                        {formatDateShort(tx.transactionDate)}
                      </span>
                      {tx.note && <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 italic truncate max-w-[120px] hidden sm:inline">· {tx.note}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'font-sans font-semibold text-xs sm:text-sm md:text-base tabular-nums',
                      isSavingsTransfer
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isTransfer
                        ? 'text-blue-600 dark:text-blue-400'
                        : isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-900 dark:text-white'
                    )}>
                      {isSavingsTransfer ? '→ ' : isTransfer ? '' : isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(tx)}
                      className="p-2.5 sm:p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-colors touch-manipulation"
                      title="Edit"
                      aria-label={`Ubah transaksi ${tx.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scheduleDelete(tx.id, tx.name)}
                      className="p-2.5 sm:p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors touch-manipulation"
                      title="Hapus"
                      aria-label={`Hapus transaksi ${tx.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
            itemLabel="transaksi"
          />
        </div>
      )}
        </>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-6 w-full max-h-[92vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white">
              {editingTx
                ? (editingTx.type === 'transfer' ? 'Ubah Tarik / Transfer Saldo' : 'Ubah Catatan Transaksi')
                : (formType === 'transfer' ? 'Tarik Tunai / Transfer Dompet' : 'Catat Transaksi Baru')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 text-xs pt-1 sm:pt-2 overflow-x-hidden">
            {/* Type toggle */}
            <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl">
              {(['expense', 'income', 'transfer'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleFormTypeChange(type)}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded-lg font-semibold text-xs transition-all touch-manipulation flex items-center justify-center gap-1.5',
                    formType === type
                      ? (type === 'expense'
                          ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm'
                          : type === 'income'
                          ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm')
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  )}
                >
                  {type === 'expense' ? (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Pengeluaran</span>
                    </>
                  ) : type === 'income' ? (
                    <>
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Pemasukan</span>
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Tarik / Transfer</span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Transfer-specific Mode Selector & Account Pickers */}
            {formType === 'transfer' ? (
              <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                {/* Submode presets */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTransferPreset('withdraw')}
                    className={cn(
                      'flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all touch-manipulation flex items-center justify-center gap-1',
                      transferSubMode === 'withdraw'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-white'
                    )}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Tarik ATM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTransferPreset('deposit')}
                    className={cn(
                      'flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all touch-manipulation flex items-center justify-center gap-1',
                      transferSubMode === 'deposit'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-white'
                    )}
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Setor Tunai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTransferPreset('free')}
                    className={cn(
                      'flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all touch-manipulation flex items-center justify-center gap-1',
                      transferSubMode === 'free'
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                        : 'bg-white/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-white'
                    )}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Pindah Bebas</span>
                  </button>
                </div>

                {/* Source and Destination Wallets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>Dari (Sumber Uang):</span>
                    </label>
                    <select
                      value={formAccount}
                      onChange={e => setFormAccount(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                    >
                      <option value="">Pilih Dompet Sumber</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} disabled={acc.id === formToAccount}>
                          {acc.name} ({formatCurrency(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Ke (Tujuan Masuk):</span>
                    </label>
                    <select
                      value={formToAccount}
                      onChange={e => setFormToAccount(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                    >
                      <option value="">Pilih Dompet Tujuan</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} disabled={acc.id === formAccount}>
                          {acc.name} ({formatCurrency(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Name / Label */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nama / Keterangan Transaksi</label>
                  <input
                    placeholder={transferSubMode === 'withdraw' ? 'Tarik tunai ATM...' : 'Nama transfer...'}
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* 1-Tap Quick Presets for Fast Mobile Entry */}
                {!editingTx && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Isi Cepat 1-Ketuk:</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(formType === 'expense'
                        ? [
                            { name: 'Makan Siang', amount: 25000, categoryKeywords: ['makan', 'konsumsi'] },
                            { name: 'Sarapan / Kopi', amount: 15000, categoryKeywords: ['makan', 'hiburan'] },
                            { name: 'Bensin / Transport', amount: 25000, categoryKeywords: ['transport', 'bensin'] },
                            { name: 'Belanja Harian', amount: 50000, categoryKeywords: ['belanja', 'kebutuhan', 'toilet'] },
                            { name: 'Parkir', amount: 2000, categoryKeywords: ['transport', 'lain'] },
                          ]
                        : [
                            { name: 'Gaji Bulanan', amount: 0, categoryKeywords: ['gaji', 'utama'] },
                            { name: 'Kiriman Orang Tua', amount: 500000, categoryKeywords: ['kiriman', 'saku', 'ortu', 'gaji'] },
                            { name: 'Bonus / Freelance', amount: 250000, categoryKeywords: ['bonus', 'freelance', 'lain'] },
                          ]
                      ).map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => applyQuickPreset(preset)}
                          className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold flex-shrink-0 active:scale-95 transition-all touch-manipulation border border-stone-200/60 dark:border-zinc-700"
                        >
                          {preset.name}
                          {preset.amount > 0 ? ` · ${preset.amount / 1000}rb` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nama Transaksi</label>
                  <input
                    placeholder="Contoh: Makan Siang / Gaji Bulanan"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                  />
                </div>

                {/* Smart tip if user types 'tarik' or 'atm' */}
                {/\b(tarik|atm|penarikan|withdraw)\b/i.test(formName) && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-1.5 animate-in fade-in-50">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong>Ingin mencatat tarik tunai ATM?</strong>
                        <p className="text-zinc-600 dark:text-zinc-300 mt-0.5">
                          {formType === 'income'
                            ? 'Jika dicatat sebagai "Pemasukan", saldo rekening ATM tidak akan berkurang. Gunakan tab "Tarik / Transfer" agar saldo rekening ATM otomatis dipotong dan saldo tunai bertambah.'
                            : 'Tarik tunai bukan belanja/pengeluaran. Gunakan tab "Tarik / Transfer" agar tidak memotong anggaran belanja bulanan Anda.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFormTypeChange('transfer')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors touch-manipulation"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Beralih ke Tab Tarik / Transfer Saldo</span>
                    </button>
                  </div>
                )}

                {/* Gojek-Style Category Dropdown Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Pos Belanja / Kategori
                    </label>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {formCategory ? '1 dipilih' : 'Wajib dipilih'}
                    </span>
                  </div>

                  {/* Compact Gojek Trigger Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setShowCategorySheet(true);
                    }}
                    className={cn(
                      'w-full p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] touch-manipulation',
                      formCategory
                        ? 'bg-stone-50/90 dark:bg-zinc-800/80 border-stone-300/80 dark:border-zinc-700 shadow-2xs'
                        : 'bg-stone-50 dark:bg-zinc-800/50 border-dashed border-stone-300 dark:border-zinc-700 hover:border-zinc-400'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                        formCategory
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                          : 'bg-stone-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                      )}>
                        {(() => {
                          const cat = filteredCategories.find(c => c.id === formCategory);
                          const IconComp = (cat?.icon && ICON_MAP[cat.icon]) ? ICON_MAP[cat.icon] : MoreHorizontal;
                          return <IconComp className="w-4 h-4" />;
                        })()}
                      </div>
                      <div className="min-w-0">
                        <div className={cn(
                          'text-xs sm:text-sm font-bold truncate',
                          formCategory ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 font-medium'
                        )}>
                          {filteredCategories.find(c => c.id === formCategory)?.name || 'Pilih Pos Belanja / Kategori...'}
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {formCategory ? 'Ketuk untuk mengganti pos belanja' : 'Pilih pos anggaran untuk transaksi ini'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 shadow-2xs flex-shrink-0">
                      <span className="hidden sm:inline">Pilih</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </button>

                  {/* Gojek-Style Bottom Sheet / Dialog */}
                  <Dialog open={showCategorySheet} onOpenChange={setShowCategorySheet}>
                    <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 p-0 overflow-hidden flex flex-col max-h-[82vh] rounded-3xl shadow-2xl">
                      <DialogHeader className="px-5 pt-4 pb-3 border-b border-stone-100 dark:border-zinc-800">
                        <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-emerald-500" />
                          <span>Pilih Pos Belanja</span>
                        </DialogTitle>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formType === 'expense' ? 'Kategori pos pengeluaran anggaran' : 'Kategori sumber pemasukan'}
                        </p>
                        {/* Instant Search Bar */}
                        <div className="pt-2 relative">
                          <input
                            type="text"
                            placeholder="Cari nama pos belanja (makan, bensin, dll)..."
                            value={categorySearch}
                            onChange={e => setCategorySearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-stone-100 dark:bg-zinc-800/80 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                          />
                          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-[18px]" />
                        </div>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {filteredCategories
                          .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                          .map(cat => {
                            const isSelected = formCategory === cat.id;
                            const CatIcon = (cat.icon && ICON_MAP[cat.icon]) ? ICON_MAP[cat.icon] : MoreHorizontal;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  triggerHaptic('selection');
                                  setFormCategory(cat.id);
                                  setShowCategorySheet(false);
                                  setCategorySearch('');
                                }}
                                className={cn(
                                  'w-full p-2.5 sm:p-3 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] touch-manipulation',
                                  isSelected
                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                                    : 'hover:bg-stone-100 dark:hover:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                                    isSelected
                                      ? 'bg-white/20 dark:bg-black/10 text-white dark:text-zinc-900'
                                      : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                  )}>
                                    <CatIcon className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-xs sm:text-sm text-left">{cat.name}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                              </button>
                            );
                          })}

                        {filteredCategories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                          <div className="py-8 text-center text-zinc-400 text-xs">
                            Tidak ada pos belanja &quot;{categorySearch}&quot;
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Gojek-Style Wallet Dropdown Selector */}
                {accounts.length > 0 && (() => {
                  const selectedAcc = accounts.find(a => a.id === formAccount);
                  const accIconFor = (type: string) =>
                    type === 'bank' ? Building2 : type === 'cash' ? Coins : type === 'ewallet' ? Smartphone : Wallet;
                  const SelIcon = accIconFor(selectedAcc?.type || '');
                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {formType === 'expense' ? 'Sumber Dompet (Saldo Berkurang)' : 'Dompet Penerima (Saldo Masuk)'}
                        </label>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {accounts.length} dompet
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setShowAccountSheet(true);
                        }}
                        aria-label="Pilih dompet"
                        className={cn(
                          'w-full p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] touch-manipulation',
                          selectedAcc
                            ? 'bg-stone-50/90 dark:bg-zinc-800/80 border-stone-300/80 dark:border-zinc-700 shadow-2xs'
                            : 'bg-stone-50 dark:bg-zinc-800/50 border-dashed border-stone-300 dark:border-zinc-700 hover:border-zinc-400'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                            selectedAcc
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                              : 'bg-stone-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                          )}>
                            <SelIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={cn(
                              'text-xs sm:text-sm font-bold truncate',
                              selectedAcc ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 font-medium'
                            )}>
                              {selectedAcc?.name || 'Pilih dompet...'}
                            </div>
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                              {selectedAcc ? `Saldo ${formatCurrency(selectedAcc.balance)}` : 'Pilih sumber dana transaksi ini'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 shadow-2xs flex-shrink-0">
                          <span className="hidden sm:inline">Ganti</span>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                      </button>

                      <Dialog open={showAccountSheet} onOpenChange={setShowAccountSheet}>
                        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 p-0 overflow-hidden flex flex-col max-h-[82vh] rounded-3xl shadow-2xl">
                          <DialogHeader className="px-5 pt-4 pb-3 border-b border-stone-100 dark:border-zinc-800">
                            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-emerald-500" />
                              <span>Pilih Dompet</span>
                            </DialogTitle>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formType === 'expense' ? 'Saldo dompet ini akan berkurang' : 'Saldo dompet ini akan bertambah'}
                            </p>
                          </DialogHeader>
                          <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {accounts.map(acc => {
                              const isSelected = formAccount === acc.id;
                              const AccIcon = accIconFor(acc.type);
                              return (
                                <button
                                  key={acc.id}
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('selection');
                                    setFormAccount(acc.id);
                                    setShowAccountSheet(false);
                                  }}
                                  className={cn(
                                    'w-full p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 transition-all active:scale-[0.99] touch-manipulation',
                                    isSelected
                                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                                      : 'hover:bg-stone-100 dark:hover:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200'
                                  )}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                      'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                                      isSelected
                                        ? 'bg-white/20 dark:bg-black/10 text-white dark:text-zinc-900'
                                        : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    )}>
                                      <AccIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 text-left">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-xs sm:text-sm truncate">{acc.name}</span>
                                        {acc.isDefault && (
                                          <span className={cn(
                                            'text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0',
                                            isSelected ? 'bg-white/20 dark:bg-zinc-900/20' : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                          )}>
                                            Utama
                                          </span>
                                        )}
                                      </div>
                                      <div className={cn(
                                        'text-[11px] tabular-nums',
                                        isSelected ? 'opacity-80' : 'text-zinc-500 dark:text-zinc-400'
                                      )}>
                                        {formatCurrency(acc.balance)}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  );
                })()}
              </>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {formType === 'transfer' ? 'Nominal Tarik / Transfer (Rp)' : 'Nominal (Rp)'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCalc(v => !v);
                    if (!showCalc && !calcExpr && formAmount) {
                      setCalcExpr(formAmount);
                    }
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors touch-manipulation',
                    showCalc
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-stone-200'
                  )}
                >
                  <Calculator className="w-3 h-3" />
                  <span>{showCalc ? 'Tutup Kalkulator' : 'Kalkulator (+ - ×)'}</span>
                </button>
              </div>

              {/* Built-in Mini Expression Calculator */}
              {showCalc && (
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 space-y-2 animate-in fade-in-50">
                  <div className="flex items-center gap-1.5">
                    <input
                      value={calcExpr}
                      onChange={e => {
                        const val = e.target.value;
                        setCalcExpr(val);
                        const evaluated = evaluateMathExpression(val);
                        if (evaluated !== null) {
                          setFormAmount(String(evaluated));
                        }
                      }}
                      placeholder="Contoh: 18000 + 5000 + 2000"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['+', '-', '×', '000'].map(op => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => {
                          const next = op === '000' ? `${calcExpr}000` : `${calcExpr} ${op} `;
                          setCalcExpr(next);
                          const evaluated = evaluateMathExpression(next);
                          if (evaluated !== null) setFormAmount(String(evaluated));
                        }}
                        className="px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-xs font-extrabold text-zinc-800 dark:text-zinc-200 active:scale-95 touch-manipulation"
                      >
                        {op}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setCalcExpr('');
                        setFormAmount('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold ml-auto"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 pointer-events-none">Rp</span>
                <input
                  placeholder="0"
                  value={formAmount ? Number(formAmount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                  onChange={e => {
                    const digits = e.target.value.replace(/[^0-9]/g, '');
                    setFormAmount(digits);
                    setCalcExpr(digits);
                  }}
                  inputMode="numeric"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl font-sans font-bold text-base sm:text-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white tabular-nums"
                />
              </div>

              {/* Quick Nominal Chips - Responsive Grid with NO Horizontal Scroll */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                {(formType === 'transfer' ? [50000, 100000, 200000, 500000, 1000000, 2000000] : [10000, 20000, 50000, 100000, 200000, 500000]).map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      if (formType === 'transfer') {
                        setFormAmount(String(amt));
                        setCalcExpr(String(amt));
                      } else {
                        const cur = parseInt(formAmount || '0', 10);
                        const nextVal = String(cur + amt);
                        setFormAmount(nextVal);
                        setCalcExpr(nextVal);
                      }
                    }}
                    className="py-1.5 px-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-xs flex items-center justify-center touch-manipulation border border-stone-200/60 dark:border-zinc-700"
                  >
                    {formType === 'transfer'
                      ? (amt >= 1000000 ? `${amt / 1000000} Juta` : `${amt / 1000}rb`)
                      : `+${amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}`}
                  </button>
                ))}
              </div>

              {/* Live Preview for Transfer */}
              {formType === 'transfer' && Number(formAmount.replace(/[^0-9]/g, '')) > 0 && formAccount && formToAccount && (
                (() => {
                  const numAmt = parseInt(formAmount.replace(/[^0-9]/g, ''), 10) || 0;
                  const fromAcc = accounts.find(a => a.id === formAccount);
                  const toAcc = accounts.find(a => a.id === formToAccount);
                  if (!fromAcc || !toAcc) return null;
                  return (
                    <div className="mt-2 p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/80 dark:border-zinc-700 text-[11px] space-y-1">
                      <div className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Preview Dampak Saldo:</div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">{fromAcc.name} (Berkurang):</span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                          {formatCurrency(fromAcc.balance)} → {formatCurrency(fromAcc.balance - numAmt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">{toAcc.name} (Bertambah):</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatCurrency(toAcc.balance)} → {formatCurrency(toAcc.balance + numAmt)}
                        </span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Tanggal & Catatan Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Catatan (opsional)</label>
                <input
                  type="text"
                  placeholder={formType === 'transfer' ? 'Tarik tunai untuk belanja mingguan...' : 'Catatan tambahan...'}
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold text-xs">
                {formError}
              </div>
            )}

            <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 sm:flex-initial px-4 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 touch-manipulation"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={cn(
                  'flex-1 sm:flex-initial px-4 py-2 text-white rounded-xl font-medium shadow-sm touch-manipulation transition-all',
                  formType === 'transfer'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900'
                )}
              >
                {isPending
                  ? 'Menyimpan...'
                  : formType === 'transfer'
                  ? 'Konfirmasi Tarik / Transfer'
                  : 'Simpan Transaksi'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <TransferModal
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        accounts={accounts}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
