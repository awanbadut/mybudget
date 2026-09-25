'use client';

import { useState, useMemo, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort, toDateString } from '@/lib/dates';
import { createTransaction, updateTransaction, deleteTransaction } from '@/actions/transactions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Pencil, Trash2, Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car, ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car,
  ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop,
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

interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: string;
  transactionDate: string;
  note: string | null;
  categoryId: string;
  category: Category | null;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  initialType?: 'income' | 'expense';
  openForm?: boolean;
}

export function TransactionListClient({ transactions, categories, initialType, openForm }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(openForm || false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>(initialType || 'all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Form states
  const [formType, setFormType] = useState<'income' | 'expense'>(initialType || 'expense');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(toDateString(new Date()));
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');

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
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
      if (filterMonth !== 'all' && !t.transactionDate.startsWith(filterMonth)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchCat = t.category?.name.toLowerCase().includes(q);
        const matchNote = t.note?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchNote) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterCategory, filterMonth, searchQuery]);

  const filteredCategories = categories.filter(c => c.type === formType);

  function resetForm() {
    setFormName('');
    setFormCategory('');
    setFormAmount('');
    setFormDate(toDateString(new Date()));
    setFormNote('');
    setFormError('');
    setEditingTx(null);
    setFormType(initialType || 'expense');
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx);
    setFormType(tx.type as 'income' | 'expense');
    setFormName(tx.name);
    setFormCategory(tx.categoryId);
    setFormAmount(String(tx.amount));
    setFormDate(tx.transactionDate);
    setFormNote(tx.note || '');
    setFormError('');
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) { setFormError('Nama transaksi harus diisi'); return; }
    if (!formCategory) { setFormError('Pilih kategori'); return; }
    const amount = parseInt(formAmount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) { setFormError('Nominal harus lebih dari 0'); return; }
    if (!formDate) { setFormError('Tanggal harus diisi'); return; }

    startTransition(async () => {
      const data = {
        type: formType,
        name: formName.trim(),
        categoryId: formCategory,
        amount,
        transactionDate: formDate,
        note: formNote.trim() || null,
      };

      const result = editingTx
        ? await updateTransaction(editingTx.id, data)
        : await createTransaction(data);

      if (result.success) {
        toast({ title: editingTx ? 'Transaksi diperbarui' : 'Transaksi ditambahkan', description: `${formName} ${formatCurrency(amount)}` });
        setShowForm(false); resetForm();
      } else {
        setFormError(result.error || 'Terjadi kesalahan');
      }
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteTransaction(deleteId);
      if (result.success) {
        toast({ title: 'Transaksi dihapus' });
        setDeleteId(null);
      }
    });
  }

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5 sm:space-y-6 font-sans w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight leading-tight">
            Buku Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Daftar lengkap arus kas masuk dan keluar
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>Catat Transaksi</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full min-w-0">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500 truncate">Total Pemasukan</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="font-sans text-sm sm:text-lg lg:text-xl font-bold text-emerald-600 tabular-nums truncate">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500 truncate">Total Pengeluaran</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="font-sans text-sm sm:text-lg lg:text-xl font-bold text-zinc-900 tabular-nums truncate">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2.5 w-full min-w-0">
        <div className="relative w-full min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            placeholder="Cari transaksi berdasarkan nama, pos belanja, atau catatan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
        </div>

        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs w-full min-w-0 max-w-full">
          {(['all', 'expense', 'income'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 sm:px-3.5 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap border flex-shrink-0',
                filterType === type
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border-stone-200/80 hover:bg-stone-50'
              )}
            >
              {type === 'all' ? 'Semua' : type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
            </button>
          ))}

          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-base sm:text-xs font-medium bg-white text-zinc-700 border border-stone-200/80 outline-none focus:ring-1 focus:ring-zinc-900 flex-shrink-0"
          >
            <option value="all">Semua Bulan</option>
            {months.map(m => {
              const [y, mo] = m.split('-').map(Number);
              return <option key={m} value={m}>{MONTH_NAMES[mo-1]} {y}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
          <p className="font-semibold text-sm text-zinc-900">Belum Ada Transaksi</p>
          <p className="text-xs text-zinc-500">Mulai catat transaksi untuk melihat riwayat arus kas.</p>
          <button
            className="mt-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-xl transition-all shadow-sm"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + Tambah Transaksi
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] divide-y divide-stone-100 overflow-hidden w-full min-w-0">
          {filtered.map(tx => {
            const isIncome = tx.type === 'income';
            const iconName = tx.category?.icon || 'MoreHorizontal';
            const Icon = ICON_MAP[iconName] || MoreHorizontal;

            return (
              <div key={tx.id} className="flex items-center justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-4 hover:bg-stone-50/60 transition-colors min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-zinc-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs sm:text-sm text-zinc-900 truncate">
                      {tx.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] sm:text-xs text-zinc-500 truncate">
                        {tx.category?.name || 'Umum'}
                      </span>
                      <span className="text-zinc-300 text-xs">·</span>
                      <span className="text-[10px] sm:text-xs text-zinc-400 flex-shrink-0">
                        {formatDateShort(tx.transactionDate)}
                      </span>
                      {tx.note && <span className="text-[10px] sm:text-xs text-zinc-400 italic truncate max-w-[100px] hidden sm:inline">· {tx.note}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'font-sans font-semibold text-xs sm:text-sm md:text-base tabular-nums',
                      isIncome ? 'text-emerald-600' : 'text-zinc-900'
                    )}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(tx)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-stone-100 rounded-lg transition-colors touch-manipulation"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(tx.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors touch-manipulation"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-md bg-white border border-stone-200/80 rounded-2xl shadow-xl p-5 sm:p-6 w-full">
          <DialogHeader>
            <DialogTitle className="font-bold text-base sm:text-lg text-zinc-900">
              {editingTx ? 'Ubah Catatan Transaksi' : 'Catat Transaksi Baru'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 text-xs pt-1 sm:pt-2">
            {/* Type toggle */}
            <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
              {(['expense', 'income'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setFormType(type); setFormCategory(''); }}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg font-semibold text-xs transition-all touch-manipulation',
                    formType === type
                      ? (type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'bg-white text-emerald-600 shadow-sm')
                      : 'text-zinc-500 hover:text-zinc-900'
                  )}
                >
                  {type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Nama Transaksi</label>
              <input
                placeholder="Contoh: Makan Siang / Gaji Bulanan"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Kategori</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="">Pilih Kategori</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Nominal (Rp)</label>
              <input
                placeholder="0"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base sm:text-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
              />
              {/* Quick Nominal Chips */}
              <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1 w-full max-w-full">
                {[10000, 25000, 50000, 100000, 500000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      const cur = parseInt(formAmount || '0', 10);
                      setFormAmount(String(cur + amt));
                    }}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-zinc-700 rounded-lg text-[11px] font-medium transition-colors flex-shrink-0 touch-manipulation"
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Tanggal</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Catatan (opsional)</label>
              <textarea
                placeholder="Catatan tambahan..."
                value={formNote}
                onChange={e => setFormNote(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}

            <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 sm:flex-initial px-4 py-2 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 touch-manipulation"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 sm:flex-initial px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium shadow-sm touch-manipulation"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-5 sm:p-6 w-full">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">
              Hapus Transaksi
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500">
            Apakah kamu yakin ingin menghapus catatan transaksi ini?
          </p>
          <DialogFooter className="pt-3 flex flex-row gap-2 justify-end">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-sm"
            >
              {isPending ? 'Menghapus...' : 'Hapus'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
