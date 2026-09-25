'use client';
import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatMonth } from '@/lib/dates';
import { upsertBudget, deleteBudget } from '@/actions/budgets';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
          <p className="text-sm text-gray-500">{formatMonth(month, year)}</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah
        </Button>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Total Pengeluaran</span>
          <span className="text-sm font-medium text-gray-900">{overallPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
          <div
            className={cn('h-3 rounded-full transition-all', overallPct < 70 ? 'bg-green-500' : overallPct <= 90 ? 'bg-yellow-500' : 'bg-red-500')}
            style={{ width: `${Math.min(overallPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{formatCurrency(totalSpent)} terpakai</span>
          <span className="font-medium text-gray-900">dari {formatCurrency(totalBudget)}</span>
        </div>
      </div>

      {/* Budget list */}
      {budgets.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <PieChart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada budget</p>
          <Button className="mt-4" onClick={() => { resetForm(); setShowForm(true); }}>+ Tambah budget</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map(budget => {
            const pct = Math.min(budget.percentage, 100);
            const barColor = budget.percentage < 70 ? 'bg-green-500' : budget.percentage <= 90 ? 'bg-yellow-500' : 'bg-red-500';
            return (
              <div key={budget.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{budget.category?.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(budget)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => setDeleteId(budget.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{formatCurrency(budget.spent)}</span>
                  <span className="text-gray-400">/ {formatCurrency(budget.amount)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <div className={cn('h-2 rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className={cn('font-medium', budget.percentage < 70 ? 'text-green-600' : budget.percentage <= 90 ? 'text-yellow-600' : 'text-red-600')}>
                    {budget.percentage}%
                  </span>
                  <span className={cn(budget.remaining >= 0 ? 'text-gray-400' : 'text-red-500')}>
                    {budget.remaining >= 0 ? `Sisa ${formatCurrency(budget.remaining)}` : `Lebih ${formatCurrency(Math.abs(budget.remaining))}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editBudget ? 'Edit Budget' : 'Tambah Budget'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Kategori</Label>
              <Select
                value={formCategory}
                onValueChange={setFormCategory}
                disabled={!!editBudget}
              >
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {(editBudget ? categories : availableCategories).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Budget (Rp)</Label>
              <Input
                placeholder="0"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="text-base font-bold text-gray-900"
              />
              {formAmount && (
                <p className="text-xs font-bold text-blue-600">
                  {formatCurrency(parseInt(formAmount, 10) || 0)}
                </p>
              )}
              <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
                {[100000, 250000, 500000, 1000000, 2000000].map(amt => (
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Batal</Button>
            <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Hapus Budget</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Apakah kamu yakin ingin menghapus budget ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>{isPending ? 'Menghapus...' : 'Hapus'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
