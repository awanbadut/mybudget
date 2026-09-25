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
import { Search, Plus, Pencil, Trash2, Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car, ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop, ChevronDown, Filter } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Tambah
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xs text-green-600">Pemasukan</p>
          <p className="text-base font-bold text-green-700">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs text-red-500">Pengeluaran</p>
          <p className="text-base font-bold text-red-600">{formatCurrency(totalExpense)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'expense', 'income'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors', filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              {type === 'all' ? 'Semua' : type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
            </button>
          ))}
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border-0 outline-none"
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
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500 font-medium">Belum ada transaksi</p>
          <p className="text-gray-400 text-sm mt-1">Yuk mulai catat pengeluaran pertamamu.</p>
          <Button className="mt-4" onClick={() => { resetForm(); setShowForm(true); }}>+ Tambah transaksi</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {filtered.map(tx => {
            const iconName = tx.category?.icon || 'MoreHorizontal';
            const Icon = ICON_MAP[iconName] || MoreHorizontal;
            const color = tx.category?.color || '#94a3b8';
            const isIncome = tx.type === 'income';
            return (
              <div key={tx.id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.name}</p>
                  <p className="text-xs text-gray-400">{tx.category?.name} · {formatDateShort(tx.transactionDate)}</p>
                  {tx.note && <p className="text-xs text-gray-300 truncate">{tx.note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn('text-sm font-semibold', isIncome ? 'text-green-600' : 'text-gray-900')}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  <button onClick={() => openEdit(tx)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => setDeleteId(tx.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTx ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type toggle */}
            <div className="flex gap-2">
              {(['expense', 'income'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setFormType(type); setFormCategory(''); }}
                  className={cn('flex-1 py-2 rounded-xl text-sm font-medium transition-colors', formType === type ? (type === 'expense' ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-gray-100 text-gray-600')}
                >
                  {type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <Label>Nama</Label>
              <Input placeholder="Contoh: Makan siang" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Kategori</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Nominal (Rp)</Label>
              <Input
                placeholder="0"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="text-base font-bold text-gray-900"
              />
              {/* Live Preview */}
              {formAmount && (
                <p className="text-xs font-bold text-blue-600">
                  {formatCurrency(parseInt(formAmount, 10) || 0)}
                </p>
              )}
              {/* Quick Nominal Chips */}
              <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
                {[10000, 25000, 50000, 100000, 500000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      const cur = parseInt(formAmount || '0', 10);
                      setFormAmount(String(cur + amt));
                    }}
                    className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-semibold text-gray-600 active:scale-95 transition-all flex-shrink-0"
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Tanggal</Label>
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Catatan (opsional)</Label>
              <Textarea placeholder="Tambah catatan..." value={formNote} onChange={e => setFormNote(e.target.value)} rows={2} />
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Batal</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Transaksi</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Apakah kamu yakin ingin menghapus transaksi ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
