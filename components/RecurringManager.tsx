'use client';

import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringActive,
  postRecurringTransactions,
} from '@/actions/recurring';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Repeat, Plus, Pencil, Trash2, CheckCircle2, Clock, Play, Power, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RecurringItem {
  id: string;
  name: string;
  type: string;
  amount: number;
  dueDay: number;
  isActive: boolean;
  note: string | null;
  categoryId: string;
  lastPostedMonth: number | null;
  lastPostedYear: number | null;
  category?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
}

interface CategoryOption {
  id: string;
  name: string;
  type: string;
}

interface Props {
  recurringList: RecurringItem[];
  categories: CategoryOption[];
  currentMonth: number;
  currentYear: number;
}

export function RecurringManager({ recurringList, categories, currentMonth, currentYear }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  // Unposted count for this month
  const unpostedList = recurringList.filter(
    r => r.isActive && (r.lastPostedMonth !== currentMonth || r.lastPostedYear !== currentYear)
  );

  function resetForm() {
    setName('');
    setType('expense');
    setCategoryId('');
    setAmount('');
    setDueDay('1');
    setNote('');
    setFormError('');
    setEditingItem(null);
  }

  function openEdit(item: RecurringItem) {
    setEditingItem(item);
    setName(item.name);
    setType(item.type as 'income' | 'expense');
    setCategoryId(item.categoryId);
    setAmount(String(item.amount));
    setDueDay(String(item.dueDay));
    setNote(item.note || '');
    setFormError('');
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama transaksi harus diisi');
      return;
    }
    if (!categoryId) {
      setFormError('Pilih kategori');
      return;
    }
    const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Nominal harus lebih dari 0');
      return;
    }
    const parsedDay = parseInt(dueDay, 10);
    if (!parsedDay || parsedDay < 1 || parsedDay > 31) {
      setFormError('Tanggal jatuh tempo harus antara 1 sampai 31');
      return;
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        type,
        categoryId,
        amount: parsedAmount,
        dueDay: parsedDay,
        note: note.trim() || null,
        isActive: true,
      };

      const result = editingItem
        ? await updateRecurringTransaction(editingItem.id, payload)
        : await createRecurringTransaction(payload);

      if (result.success) {
        toast({
          title: editingItem ? 'Template diperbarui ✓' : 'Template transaksi berulang dibuat ✓',
          description: `${name} ${formatCurrency(parsedAmount)} tiap tgl ${parsedDay}`,
        });
        setShowForm(false);
        resetForm();
      } else {
        setFormError(result.error || 'Terjadi kesalahan.');
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteRecurringTransaction(deleteId);
      if (result.success) {
        toast({ title: 'Template transaksi berulang dihapus ✓' });
        setDeleteId(null);
      } else {
        toast({ title: result.error || 'Gagal menghapus', variant: 'destructive' });
      }
    });
  }

  function handleToggle(item: RecurringItem) {
    startTransition(async () => {
      const res = await toggleRecurringActive(item.id, item.isActive);
      if (res.success) {
        toast({
          title: item.isActive ? 'Transaksi dinonaktifkan' : 'Transaksi diaktifkan kembali',
        });
      }
    });
  }

  function handlePostDue() {
    startTransition(async () => {
      const result = await postRecurringTransactions(currentMonth, currentYear);
      if (result.success) {
        toast({
          title: 'Posting Berhasil ✓',
          description: result.message,
        });
      } else {
        toast({ title: result.error || 'Gagal posting.', variant: 'destructive' });
      }
    });
  }

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-6 space-y-4 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40">
            <Repeat className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-zinc-900 dark:text-white leading-none">
              Transaksi Berulang & Langganan
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Catat tagihan rutin (kos, wifi, cicilan, langganan) tanpa input berulang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unpostedList.length > 0 && (
            <button
              onClick={handlePostDue}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 touch-manipulation"
              title="Posting transaksi yang jatuh tempo bulan ini ke catatan kas"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Posting Bulan Ini ({unpostedList.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-95 touch-manipulation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* List */}
      {recurringList.length === 0 ? (
        <div className="text-center py-6 px-4 space-y-2">
          <Clock className="w-7 h-7 text-zinc-300 dark:text-zinc-600 mx-auto stroke-[1.5]" />
          <p className="font-medium text-xs text-zinc-600 dark:text-zinc-300">
            Belum ada transaksi berulang tercatat
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto">
            Tambahkan biaya rutin seperti uang kos, paket internet, tagihan listrik, atau langganan agar otomatis diposting tiap bulan.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recurringList.map(item => {
            const isPosted = item.lastPostedMonth === currentMonth && item.lastPostedYear === currentYear;
            const isIncome = item.type === 'income';

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between gap-3 p-3 rounded-xl border transition-all',
                  item.isActive
                    ? 'border-stone-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-800/30'
                    : 'border-dashed border-stone-200 dark:border-zinc-800 opacity-60 bg-stone-50/20'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {item.dueDay}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {item.name}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {item.category?.name || 'Kategori'}
                      </span>
                      {isPosted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Diposting</span>
                        </span>
                      ) : (
                        item.isActive && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            • Menunggu Posting
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Rutin tiap tanggal {item.dueDay} {item.note ? `· ${item.note}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <p
                    className={cn(
                      'font-sans font-bold text-xs sm:text-sm tabular-nums',
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'
                    )}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      disabled={isPending}
                      title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        item.isActive
                          ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          : 'text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                      )}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
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

      {/* Add / Edit Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={open => {
          if (!open) {
            setShowForm(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-5 sm:p-6 w-full">
          <DialogHeader>
            <DialogTitle className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white">
              {editingItem ? 'Edit Transaksi Berulang' : 'Tambah Transaksi Berulang Baru'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs pt-1 sm:pt-2">
            {/* Type toggle */}
            <div className="flex gap-2 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setCategoryId('');
                  }}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg font-semibold text-xs transition-all touch-manipulation',
                    type === t
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  )}
                >
                  {t === 'expense' ? 'Pengeluaran Rutin' : 'Pemasukan Rutin'}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Nama Pengeluaran / Tagihan
              </label>
              <input
                placeholder="Contoh: Sewa Kos, WiFi Indihome, Spotify Premium"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">Pilih Kategori</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Tanggal Jatuh Tempo (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={e => setDueDay(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl font-bold text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Nominal Rutin (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 pointer-events-none">
                  Rp
                </span>
                <input
                  placeholder="0"
                  value={amount ? Number(amount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl font-sans font-bold text-base sm:text-base text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Catatan (opsional)
              </label>
              <input
                placeholder="Contoh: Pembayaran auto-debet via m-banking"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            {formError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {formError}
              </p>
            )}

            <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 sm:flex-initial px-4 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-sm"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Template'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteId}
        onOpenChange={open => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-5 sm:p-6 w-full">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              Hapus Transaksi Berulang
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Apakah Anda yakin ingin menghapus template transaksi berulang ini? Catatan transaksi yang sudah diposting sebelumnya tidak akan terpengaruh.
          </p>
          <DialogFooter className="pt-3 flex flex-row gap-2 justify-end">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-sm text-xs"
            >
              {isPending ? 'Menghapus...' : 'Hapus'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
