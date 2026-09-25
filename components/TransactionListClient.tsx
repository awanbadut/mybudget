'use client';
import { useState, useMemo, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort, toDateString } from '@/lib/dates';
import { createTransaction, updateTransaction, deleteTransaction } from '@/actions/transactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Pencil, Trash2, Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car, ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop, Filter } from 'lucide-react';
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
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Form state
  const [formType, setFormType] = useState<'income' | 'expense'>(initialType || 'expense');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(toDateString(new Date()));
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');

  const filteredCategories = categories.filter(c => c.type === formType);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (filterCategory !== 'all' && tx.categoryId !== filterCategory) return false;
      if (filterMonth !== 'all') {
        const [y, m] = filterMonth.split('-').map(Number);
        const [ty, tm] = tx.transactionDate.split('-').map(Number);
        if (ty !== y || tm !== m) return false;
      }
      if (searchQuery) {
        return tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [transactions, filterType, filterCategory, filterMonth, searchQuery]);

  // Get unique months
  const months = useMemo(() => {
    const set = new Set(transactions.map(t => t.transactionDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  function resetForm() {
    setFormName(''); setFormCategory(''); setFormAmount('');
    setFormDate(toDateString(new Date())); setFormNote(''); setFormError('');
    setFormType(initialType || 'expense'); setEditingTx(null);
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx);
    setFormType(tx.type as 'income' | 'expense');
    setFormName(tx.name); setFormCategory(tx.categoryId);
    setFormAmount(String(tx.amount)); setFormDate(tx.transactionDate);
    setFormNote(tx.note || ''); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const amount = parseInt(formAmount.replace(/[^0-9]/g, ''), 10);
    if (!formName.trim()) return setFormError('Nama harus diisi');
    if (!formCategory) return setFormError('Pilih kategori');
    if (!amount || amount <= 0) return setFormError('Nominal harus lebih dari 0');

    const data = { type: formType, name: formName.trim(), categoryId: formCategory, amount, transactionDate: formDate, note: formNote || null };

    startTransition(async () => {
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
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#24201D] pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-[#D9381E] uppercase">LEDGER Nº 02</span>
            <span className="text-[#24201D]/30">/</span>
            <span className="font-mono text-[10px] text-[#706860] uppercase">Rekam Catatan Kas</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#24201D] uppercase leading-none">
            BUKU TRANSAKSI
          </h1>
        </div>

        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] px-3.5 py-2 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#24201D] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ CATAT BARU</span>
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-3 shadow-[2px_2px_0px_#24201D]">
          <p className="font-mono text-[10px] font-bold text-[#2A7B88] uppercase tracking-wider">Total Pemasukan</p>
          <p className="font-mono text-base sm:text-lg font-bold text-[#2A7B88] tabular-nums mt-0.5">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-3 shadow-[2px_2px_0px_#24201D]">
          <p className="font-mono text-[10px] font-bold text-[#D9381E] uppercase tracking-wider">Total Pengeluaran</p>
          <p className="font-mono text-base sm:text-lg font-bold text-[#D9381E] tabular-nums mt-0.5">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#706860]" />
          <input
            placeholder="Cari transaksi berdasarkan nama atau kategori..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF7F2] border-2 border-[#24201D] font-mono text-xs text-[#24201D] placeholder-[#706860]/60 outline-none shadow-[2px_2px_0px_#24201D]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 font-mono text-xs">
          {(['all', 'expense', 'income'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 py-1.5 border-2 border-[#24201D] font-bold uppercase transition-all whitespace-nowrap',
                filterType === type
                  ? 'bg-[#24201D] text-[#F4F0EA] shadow-[2px_2px_0px_#D9381E]'
                  : 'bg-[#EDE6DC] text-[#24201D] hover:bg-[#FAF7F2]'
              )}
            >
              {type === 'all' ? 'SEMUA' : type === 'expense' ? 'PENGELUARAN' : 'PEMASUKAN'}
            </button>
          ))}

          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 border-2 border-[#24201D] font-mono text-xs font-bold uppercase bg-[#EDE6DC] text-[#24201D] outline-none"
          >
            <option value="all">SEMUA BULAN</option>
            {months.map(m => {
              const [y, mo] = m.split('-').map(Number);
              return <option key={m} value={m}>{MONTH_NAMES[mo-1]} {y}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-8 text-center shadow-[3px_3px_0px_#24201D] space-y-2">
          <p className="font-display font-bold text-lg text-[#24201D] uppercase">Belum Ada Transaksi</p>
          <p className="font-sans text-xs text-[#706860]">Yuk mulai catat pengeluaran pertamamu.</p>
          <button
            className="mt-2 font-mono text-xs font-bold text-[#F4F0EA] bg-[#D9381E] px-4 py-2 border border-[#B82C15] shadow-[2px_2px_0px_#24201D]"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + TAMBAH TRANSAKSI
          </button>
        </div>
      ) : (
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] shadow-[3px_3px_0px_#24201D] divide-y divide-[#24201D]/20 overflow-hidden">
          <div className="p-3 bg-[#EDE6DC] flex items-center justify-between font-mono text-xs border-b border-[#24201D]">
            <span className="font-bold text-[#24201D] uppercase">Daftar Transaksi ({filtered.length})</span>
            <span className="font-bold text-[#706860] uppercase">Nominal & Aksi</span>
          </div>

          {filtered.map(tx => {
            const isIncome = tx.type === 'income';
            return (
              <div key={tx.id} className="flex items-center justify-between gap-3 p-3.5 hover:bg-[#EDE6DC]/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="font-display font-bold text-base sm:text-lg text-[#24201D] uppercase truncate leading-tight">
                      {tx.name}
                    </p>
                    <span className="font-mono text-[10px] uppercase px-1.5 py-0.2 bg-[#EDE6DC] border border-[#24201D]/25 text-[#706860]">
                      {tx.category?.name || 'Umum'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-[#706860] mt-0.5">
                    {formatDateShort(tx.transactionDate)}
                    {tx.note && <span className="ml-1 text-[#24201D]/60 font-sans italic">· {tx.note}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className={cn(
                      'font-mono font-bold text-sm sm:text-base tabular-nums',
                      isIncome ? 'text-[#2A7B88]' : 'text-[#24201D]'
                    )}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(tx)}
                      className="p-1.5 border border-[#24201D]/30 bg-[#EDE6DC] hover:bg-[#24201D] hover:text-[#F4F0EA] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(tx.id)}
                      className="p-1.5 border border-[#D9381E]/40 bg-[#FBEBE8] text-[#D9381E] hover:bg-[#D9381E] hover:text-[#F4F0EA] transition-colors"
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
        <DialogContent className="max-w-md bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl uppercase text-[#24201D]">
              {editingTx ? 'Ubah Catatan Transaksi' : 'Entri Transaksi Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3.5 font-mono text-xs">
            {/* Type toggle */}
            <div className="flex gap-2">
              {(['expense', 'income'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setFormType(type); setFormCategory(''); }}
                  className={cn(
                    'flex-1 py-2 border-2 border-[#24201D] font-bold uppercase transition-all',
                    formType === type
                      ? (type === 'expense' ? 'bg-[#D9381E] text-[#F4F0EA]' : 'bg-[#2A7B88] text-[#F4F0EA]')
                      : 'bg-[#EDE6DC] text-[#24201D]'
                  )}
                >
                  {type === 'expense' ? 'PENGELUARAN' : 'PEMASUKAN'}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Nama Transaksi</label>
              <input
                placeholder="Contoh: Makan Siang / Gaji"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Kategori</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              >
                <option value="">PILIH KATEGORI</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Nominal (Rp)</label>
              <input
                placeholder="0"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-mono font-bold text-base text-[#24201D] outline-none tabular-nums"
              />
              {/* Quick Nominal Chips */}
              <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1">
                {[10000, 25000, 50000, 100000, 500000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      const cur = parseInt(formAmount || '0', 10);
                      setFormAmount(String(cur + amt));
                    }}
                    className="px-2 py-0.5 bg-[#EDE6DC] border border-[#24201D]/40 hover:bg-[#24201D] hover:text-[#F4F0EA] text-[10px] font-bold text-[#24201D] transition-all flex-shrink-0"
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Tanggal</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Catatan (opsional)</label>
              <textarea
                placeholder="Catatan tambahan..."
                value={formNote}
                onChange={e => setFormNote(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              />
            </div>

            {formError && <p className="text-xs font-bold text-[#D9381E]">{formError}</p>}

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold uppercase hover:bg-[#FAF7F2]"
              >
                BATAL
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] font-bold uppercase shadow-[2px_2px_0px_#24201D]"
              >
                {isPending ? 'MENYIMPAN...' : 'SIMPAN CATATAN'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg uppercase text-[#24201D]">
              Hapus Transaksi
            </DialogTitle>
          </DialogHeader>
          <p className="font-sans text-xs text-[#3D3834]">
            Apakah kamu yakin ingin menghapus baris transaksi ini dari buku kas?
          </p>
          <DialogFooter className="pt-2">
            <button
              onClick={() => setDeleteId(null)}
              className="px-3 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-mono text-xs font-bold uppercase"
            >
              BATAL
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-3 py-1.5 bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#24201D]"
            >
              {isPending ? 'MENGHAPUS...' : 'YA, HAPUS'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
