'use client';

import { useState, useTransition } from 'react';
import { createCategory, updateCategory, deleteCategory } from '@/actions/categories';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

const ICON_OPTIONS = [
  'Home', 'UtensilsCrossed', 'CreditCard', 'Music', 'ShoppingBag', 'Car',
  'ShoppingCart', 'FileText', 'Heart', 'MoreHorizontal', 'Banknote', 'Gift',
  'Laptop', 'TrendingUp', 'Target', 'Briefcase', 'Coffee', 'Zap',
];

const COLOR_OPTIONS = [
  '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#64748b', '#10b981', '#94a3b8',
  '#22c55e', '#84cc16', '#0ea5e9', '#a78bfa', '#fb7185',
];

export function CategoryManager({ categories }: { categories: Category[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formIcon, setFormIcon] = useState('MoreHorizontal');
  const [formError, setFormError] = useState('');

  const filtered = categories.filter(c => c.type === activeTab);

  function openAdd() {
    setEditCat(null);
    setFormName('');
    setFormType(activeTab);
    setFormColor('#6366f1');
    setFormIcon('MoreHorizontal');
    setFormError('');
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditCat(cat);
    setFormName(cat.name);
    setFormType(cat.type as 'expense' | 'income');
    setFormColor(cat.color || '#6366f1');
    setFormIcon(cat.icon || 'MoreHorizontal');
    setFormError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) { setFormError('Nama kategori harus diisi'); return; }
    setFormError('');
    startTransition(async () => {
      const data = { name: formName.trim(), type: formType, color: formColor, icon: formIcon };
      const result = editCat
        ? await updateCategory(editCat.id, data)
        : await createCategory(data);
      if (result.success) {
        toast({ title: editCat ? 'Kategori diperbarui' : 'Kategori dibuat' });
        setShowForm(false);
      } else {
        setFormError(result.error || 'Terjadi kesalahan');
      }
    });
  }

  async function handleDelete() {
    if (!deleteCatId) return;
    startTransition(async () => {
      const result = await deleteCategory(deleteCatId);
      if (result.success) {
        toast({ title: 'Kategori dihapus' });
        setDeleteCatId(null);
      } else {
        toast({ title: result.error || 'Gagal menghapus', variant: 'destructive' });
        setDeleteCatId(null);
      }
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 sm:p-6 space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
            <Tag className="w-4 h-4" />
          </div>
          <h2 className="font-semibold text-base text-zinc-900 dark:text-white">Manajemen Kategori</h2>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl">
        {(['expense', 'income'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              'flex-1 py-1.5 rounded-lg font-semibold text-xs transition-all',
              activeTab === t ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'
            )}
          >
            {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
          </button>
        ))}
      </div>

      {/* Category List */}
      <div className="space-y-1.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">Belum ada kategori {activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'}.</p>
        ) : (
          filtered.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-stone-100 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex-shrink-0" style={{ backgroundColor: cat.color + '22', border: `1.5px solid ${cat.color}44` }}>
                  <div className="w-full h-full rounded-lg" style={{ backgroundColor: cat.color || '#94a3b8' }} />
                </div>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteCatId(cat.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) setShowForm(false); }}>
        <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              {editCat ? 'Edit Kategori' : 'Kategori Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs pt-2">
            {!editCat && (
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tipe</label>
                <div className="flex gap-2 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl">
                  {(['expense', 'income'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg font-semibold text-xs transition-all',
                        formType === t ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'
                      )}
                    >
                      {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nama Kategori</label>
              <input
                placeholder="Contoh: Parkir, Investasi, dll"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Warna</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className={cn('w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110', formColor === c ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            {formError && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{formError}</p>}
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 sm:flex-initial px-4 py-1.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-sm"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteCatId} onOpenChange={open => { if (!open) setDeleteCatId(null); }}>
        <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">Hapus Kategori</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Kategori yang masih digunakan transaksi tidak dapat dihapus.</p>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setDeleteCatId(null)}
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
