'use client';

import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatMonth } from '@/lib/dates';
import { upsertBudget, deleteBudget } from '@/actions/budgets';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, PieChart, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { CycleSelector, CycleOption } from '@/components/CycleSelector';
import { PaginationBar } from '@/components/PaginationBar';
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
  cycleLabel?: string;
  cycles?: CycleOption[];
  currentCycleOffset?: number;
  salaryDate?: number;
  isStudentMode?: boolean;
}

export function BudgetClient({
  budgets,
  categories,
  month,
  year,
  cycleLabel,
  cycles = [],
  currentCycleOffset = 0,
  salaryDate = 25,
  isStudentMode = false,
}: BudgetClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const safeCount = budgets.filter(b => b.percentage < 70).length;
  const warningCount = budgets.filter(b => b.percentage >= 70 && b.percentage <= 100).length;
  const overCount = budgets.filter(b => b.percentage > 100 || b.remaining < 0).length;

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
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
            Anggaran Bulanan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Batas pengeluaran &amp; sisa uang pos budgeting siklus {cycleLabel || formatMonth(month, year)}
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Anggaran</span>
        </button>
      </div>

      {/* Cycle Selector */}
      {cycles.length > 0 && (
        <CycleSelector
          cycles={cycles}
          currentOffset={currentCycleOffset}
          salaryDate={salaryDate}
          isStudentMode={isStudentMode}
        />
      )}

      {/* Overview Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5 transition-colors">
        <div className="flex justify-between items-baseline text-xs">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">
            Pemakaian Anggaran ({cycleLabel || formatMonth(month, year)})
          </span>
          <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{overallPct}% Terpakai</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', overallPct < 70 ? 'bg-emerald-500' : overallPct <= 90 ? 'bg-amber-500' : 'bg-rose-500')}
            style={{ width: `${Math.min(overallPct, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/60 dark:border-zinc-700/60">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Total Jatah Anggaran</span>
            <span className="font-bold text-sm text-zinc-900 dark:text-white tabular-nums">
              {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/60 dark:border-zinc-700/60">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Total Terpakai Siklus Ini</span>
            <span className="font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums">
              -{formatCurrency(totalSpent)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/60 dark:border-zinc-700/60">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
              {totalRemaining >= 0 ? 'Sisa Uang Pos Budgeting' : 'Lewat Batas (Overbudget)'}
            </span>
            <span
              className={cn(
                'font-extrabold text-sm tabular-nums',
                totalRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {totalRemaining < 0 ? '-' : '+'}
              {formatCurrency(Math.abs(totalRemaining))}
            </span>
          </div>
        </div>

        {budgets.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-stone-100 dark:border-zinc-800 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{safeCount} Pos Aman</span>
            </span>
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{warningCount} Pos Hampir Habis</span>
              </span>
            )}
            {overCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{overCount} Pos Overbudget</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Budget list */}
      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5 transition-colors">
          <PieChart className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto" />
          <p className="font-semibold text-sm text-zinc-900 dark:text-white">Belum Ada Anggaran Tercatat</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Atur alokasi anggaran per kategori belanja untuk mengontrol pengeluaran.</p>
          <button
            className="mt-2 text-xs font-semibold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 px-4 py-2 rounded-xl transition-all shadow-sm"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + Tambah Anggaran
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-colors">
          <div className="divide-y divide-stone-100 dark:divide-zinc-800">
          {budgets
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map(budget => {
            const pct = Math.min(budget.percentage, 100);
            const isDanger = budget.percentage > 90;
            const isWarning = budget.percentage >= 70 && budget.percentage <= 90;

            return (
              <div key={budget.id} className="p-4 sm:p-5 hover:bg-stone-50/60 dark:hover:bg-zinc-800/40 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                    {budget.category?.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(budget)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(budget.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-zinc-900 dark:text-white tabular-nums font-semibold">{formatCurrency(budget.spent)}</span>
                  <span className="text-zinc-400 dark:text-zinc-500 tabular-nums">/ {formatCurrency(budget.amount)}</span>
                </div>

                <div className="w-full bg-stone-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
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

          <PaginationBar
            currentPage={currentPage}
            totalItems={budgets.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
            itemLabel="pos anggaran"
          />
        </div>
      )}

      {/* Modernized Form Dialog (No Horizontal Scroll, No Native Select) */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-5 sm:p-6 overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              {editBudget ? 'Ubah Alokasi Anggaran' : 'Tetapkan Anggaran Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs pt-2">
            {/* Visual Category Pill Grid */}
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                Pilih Pos Kategori Belanja
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                {(editBudget ? categories : availableCategories).map(cat => {
                  const isSelected = formCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={!!editBudget}
                      onClick={() => setFormCategory(cat.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left font-bold text-xs flex items-center gap-2 transition-all touch-manipulation',
                        isSelected
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs'
                          : 'bg-stone-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:border-zinc-400',
                        editBudget && !isSelected && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color || '#10b981' }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero Currency Input + 2-Row Preset Grid */}
            <div className="space-y-2">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                Nominal Jatah Anggaran (Rp)
              </label>
              <div className="relative flex items-center bg-stone-50 dark:bg-zinc-800/90 border border-stone-200 dark:border-zinc-700 rounded-2xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-white">
                <span className="text-sm font-extrabold text-zinc-400 dark:text-zinc-500 mr-2 select-none">
                  Rp
                </span>
                <input
                  placeholder="0"
                  value={formAmount ? Number(formAmount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                  onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  className="w-full bg-transparent font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white focus:outline-none tabular-nums touch-manipulation"
                />
                {formAmount && (
                  <button
                    type="button"
                    onClick={() => setFormAmount('')}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    title="Reset nominal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {[100000, 250000, 500000, 1000000, 1500000, 2000000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      const cur = parseInt(formAmount.replace(/[^0-9]/g, '') || '0', 10);
                      setFormAmount(String(cur + amt));
                    }}
                    className="py-1.5 px-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold transition-colors touch-manipulation text-center"
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2">
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="flex-1 py-2.5 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs touch-manipulation"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isPending || !formCategory || !formAmount}
              className="flex-1 py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 touch-manipulation"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Anggaran'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              Hapus Anggaran
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Apakah kamu yakin ingin menghapus alokasi anggaran ini?
          </p>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setDeleteId(null)}
              className="px-3.5 py-1.5 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs"
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
