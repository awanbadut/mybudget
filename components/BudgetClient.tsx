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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#24201D] pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-[#D9381E] uppercase">LEDGER Nº 03</span>
            <span className="text-[#24201D]/30">/</span>
            <span className="font-mono text-[10px] text-[#706860] uppercase">{formatMonth(month, year)}</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#24201D] uppercase leading-none">
            PAGU ANGGARAN
          </h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] px-3.5 py-2 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#24201D] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ ANGGARAN BARU</span>
        </button>
      </div>

      {/* Overview Card */}
      <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 sm:p-5 shadow-[3px_3px_0px_#24201D] space-y-2.5">
        <div className="flex justify-between items-baseline font-mono text-xs">
          <span className="font-bold text-[#706860] uppercase tracking-wider">Realisasi Total Anggaran</span>
          <span className="font-bold text-[#24201D] text-sm tabular-nums">{overallPct}% TERCAPAI</span>
        </div>

        {/* Ruler Progress Bar */}
        <div className="w-full bg-[#E2D7C7] h-3 border border-[#24201D] p-[1px] overflow-hidden">
          <div
            className={cn('h-full transition-all', overallPct < 70 ? 'bg-[#2A7B88]' : overallPct <= 90 ? 'bg-[#D97706]' : 'bg-[#D9381E]')}
            style={{ width: `${Math.min(overallPct, 100)}%` }}
          />
        </div>

        <div className="flex justify-between font-mono text-xs pt-1">
          <span className="text-[#706860] tabular-nums">{formatCurrency(totalSpent)} terpakai</span>
          <span className="font-bold text-[#24201D] tabular-nums">Pagu: {formatCurrency(totalBudget)}</span>
        </div>
      </div>

      {/* Budget list */}
      {budgets.length === 0 ? (
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-8 text-center shadow-[3px_3px_0px_#24201D] space-y-2">
          <PieChart className="w-8 h-8 text-[#706860] mx-auto mb-1" />
          <p className="font-display font-bold text-lg text-[#24201D] uppercase">Belum Ada Anggaran Tercatat</p>
          <button
            className="mt-2 font-mono text-xs font-bold text-[#F4F0EA] bg-[#D9381E] px-4 py-2 border border-[#B82C15] shadow-[2px_2px_0px_#24201D]"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + TAMBAH ANGGARAN
          </button>
        </div>
      ) : (
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] shadow-[3px_3px_0px_#24201D] divide-y divide-[#24201D]/20 overflow-hidden">
          <div className="p-3 bg-[#EDE6DC] flex items-center justify-between font-mono text-xs border-b border-[#24201D]">
            <span className="font-bold text-[#24201D] uppercase">Kategori Pos Belanja</span>
            <span className="font-bold text-[#706860] uppercase">Realisasi & Limit</span>
          </div>

          {budgets.map(budget => {
            const pct = Math.min(budget.percentage, 100);
            const isDanger = budget.percentage > 90;

            return (
              <div key={budget.id} className="p-3.5 sm:p-4 hover:bg-[#EDE6DC]/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-base sm:text-lg text-[#24201D] uppercase">
                    {budget.category?.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(budget)}
                      className="p-1.5 border border-[#24201D]/30 bg-[#EDE6DC] hover:bg-[#24201D] hover:text-[#F4F0EA] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(budget.id)}
                      className="p-1.5 border border-[#D9381E]/40 bg-[#FBEBE8] text-[#D9381E] hover:bg-[#D9381E] hover:text-[#F4F0EA] transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between font-mono text-xs">
                  <span className="text-[#3D3834] tabular-nums font-bold">{formatCurrency(budget.spent)}</span>
                  <span className="text-[#706860] tabular-nums">/ {formatCurrency(budget.amount)}</span>
                </div>

                <div className="w-full bg-[#E2D7C7] h-2 border border-[#24201D] p-[0.5px]">
                  <div
                    className={cn('h-full transition-all', isDanger ? 'bg-[#D9381E]' : 'bg-[#2A7B88]')}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between font-mono text-[11px]">
                  <span className={cn('font-bold', isDanger ? 'text-[#D9381E]' : 'text-[#2A7B88]')}>
                    {budget.percentage}% TERCAPAI
                  </span>
                  <span className={cn(budget.remaining >= 0 ? 'text-[#706860]' : 'text-[#D9381E] font-bold')}>
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
        <DialogContent className="max-w-sm bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl uppercase text-[#24201D]">
              {editBudget ? 'Ubah Alokasi Anggaran' : 'Tetapkan Anggaran Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 font-mono text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Kategori</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                disabled={!!editBudget}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none disabled:opacity-60"
              >
                <option value="">PILIH KATEGORI</option>
                {(editBudget ? categories : availableCategories).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Nominal Anggaran (Rp)</label>
              <input
                placeholder="0"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-mono font-bold text-base text-[#24201D] outline-none tabular-nums"
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
                    className="px-2 py-0.5 bg-[#EDE6DC] border border-[#24201D]/40 hover:bg-[#24201D] hover:text-[#F4F0EA] text-[10px] font-bold text-[#24201D] transition-all flex-shrink-0"
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2 font-mono text-xs">
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-3.5 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold uppercase hover:bg-[#FAF7F2]"
            >
              BATAL
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-3.5 py-1.5 bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] font-bold uppercase shadow-[2px_2px_0px_#24201D]"
            >
              {isPending ? 'MENYIMPAN...' : 'SIMPAN ANGGARAN'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg uppercase text-[#24201D]">
              Hapus Anggaran
            </DialogTitle>
          </DialogHeader>
          <p className="font-sans text-xs text-[#3D3834]">Apakah kamu yakin ingin menghapus alokasi anggaran ini?</p>
          <DialogFooter className="pt-2 font-mono text-xs">
            <button
              onClick={() => setDeleteId(null)}
              className="px-3 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold uppercase"
            >
              BATAL
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-3 py-1.5 bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] font-bold uppercase shadow-[2px_2px_0px_#24201D]"
            >
              {isPending ? 'MENGHAPUS...' : 'YA, HAPUS'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
