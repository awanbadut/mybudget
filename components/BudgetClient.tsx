'use client';

import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatMonth } from '@/lib/dates';
import { upsertBudget, deleteBudget } from '@/actions/budgets';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  category: Category | null;
}

interface BudgetClientProps {
  budgets: Budget[];
  categories: Category[];
  month: number;
  year: number;
}

export function BudgetClient({ budgets, categories, month, year }: BudgetClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Categories not yet in budget
  const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId));
  const availableCategories = categories.filter(c => !budgetedCategoryIds.has(c.id));

  function resetForm() {
    setFormCategory(''); setFormAmount(''); setEditBudget(null);
  }

  function openEdit(budget: Budget) {
    setEditBudget(budget);
    setFormCategory(budget.categoryId);
    setFormAmount(String(budget.amount));
    setShowForm(true);
  }

  async function handleSave() {
    const amount = parseInt(formAmount.replace(/[^0-9]/g, ''), 10);
    if (!formCategory || amount < 0) return;
    startTransition(async () => {
      const result = await upsertBudget({ categoryId: formCategory, month, year, amount });
      if (result.success) {
        toast({ title: editBudget ? 'Budget diperbarui' : 'Budget ditambahkan' });
        setShowForm(false); resetForm();
      } else {
        toast({ title: result.error || 'Terjadi kesalahan', variant: 'destructive' });
      }
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteBudget(deleteId);
      if (result.success) {
        toast({ title: 'Budget dihapus' });
        setDeleteId(null);
      }
    });
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
            Pagu Anggaran
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Batas pengeluaran operasional {formatMonth(month, year)}
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Anggaran</span>
        </button>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex justify-between items-baseline text-xs">
          <span className="font-medium text-zinc-500">Realisasi Total Anggaran</span>
          <span className="font-bold text-zinc-900 tabular-nums">{overallPct}% Terpakai</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', overallPct < 70 ? 'bg-emerald-500' : overallPct <= 90 ? 'bg-amber-500' : 'bg-rose-500')}
            style={{ width: `${Math.min(overallPct, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs pt-1 text-zinc-500">
          <span className="tabular-nums">{formatCurrency(totalSpent)} terpakai</span>
          <span className="font-semibold text-zinc-900 tabular-nums">Pagu: {formatCurrency(totalBudget)}</span>
        </div>
      </div>

      {/* Budget list */}
      {budgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
          <PieChart className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="font-semibold text-sm text-zinc-900">Belum Ada Anggaran Tercatat</p>
          <p className="text-xs text-zinc-500">Atur pagu anggaran per kategori untuk mengontrol pengeluaran.</p>
          <button
            className="mt-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-xl transition-all shadow-sm"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + Tambah Anggaran
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] divide-y divide-stone-100 overflow-hidden">
          {budgets.map(budget => {
            const pct = Math.min(budget.percentage, 100);
            const isDanger = budget.percentage > 90;
            const isWarning = budget.percentage >= 70 && budget.percentage <= 90;

            return (
              <div key={budget.id} className="p-4 sm:p-5 hover:bg-stone-50/60 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-zinc-900">
                    {budget.category?.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(budget)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(budget.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-zinc-900 tabular-nums font-semibold">{formatCurrency(budget.spent)}</span>
                  <span className="text-zinc-400 tabular-nums">/ {formatCurrency(budget.amount)}</span>
                </div>

                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500')}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className={cn('font-medium', isDanger ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600')}>
                    {budget.percentage}% terpakai
                  </span>
                  <span className={cn(budget.remaining >= 0 ? 'text-zinc-500' : 'text-rose-600 font-medium')}>
                    {budget.remaining >= 0 ? `Sisa: ${formatCurrency(budget.remaining)}` : `Lebih: ${formatCurrency(Math.abs(budget.remaining))}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">
              {editBudget ? 'Ubah Alokasi Anggaran' : 'Tetapkan Anggaran Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Kategori</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                disabled={!!editBudget}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 touch-manipulation"
              >
                <option value="">Pilih Kategori</option>
                {(editBudget ? categories : availableCategories).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Nominal Anggaran (Rp)</label>
              <input
                placeholder="0"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base sm:text-base text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation"
              />
              <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1">
                {[100000, 250000, 500000, 1000000, 2000000].map(amt => (
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
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-3.5 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 text-xs touch-manipulation"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isPending || !formCategory || !formAmount}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 touch-manipulation"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">
              Hapus Anggaran
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500">
            Apakah kamu yakin ingin menghapus alokasi anggaran ini?
          </p>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setDeleteId(null)}
              className="px-3.5 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 text-xs"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              {isPending ? 'Menghapus...' : 'Hapus'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
