'use client';

import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort } from '@/lib/dates';
import {
  markInstallmentPaid, markInstallmentUnpaid,
  createInstallment, updateInstallment, deleteInstallment
} from '@/actions/debts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, Square, Plus, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Installment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: string;
  paidAt: Date | null;
}

interface Debt {
  id: string;
  name: string;
  totalAmount: number | null;
  status: string;
  installments: Installment[];
}

export function DebtTrackerClient({ debts }: { debts: Debt[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showAddInstallment, setShowAddInstallment] = useState<string | null>(null);
  const [editInstallment, setEditInstallment] = useState<Installment | null>(null);
  const [deleteInstallmentId, setDeleteInstallmentId] = useState<string | null>(null);

  // Form state
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');

  function getStats(debt: Debt) {
    const total = debt.installments.reduce((s, i) => s + i.amount, 0);
    const paid = debt.installments.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const paidCount = debt.installments.filter(i => i.status === 'paid').length;
    const remaining = total - paid;
    return { total, paid, paidCount, remaining, totalCount: debt.installments.length };
  }

  async function handleMarkPaid(id: string, currentStatus: string) {
    startTransition(async () => {
      const result = currentStatus === 'paid'
        ? await markInstallmentUnpaid(id)
        : await markInstallmentPaid(id);
      if (result.success) {
        toast({ title: currentStatus === 'paid' ? 'Cicilan dibatalkan' : 'Cicilan ditandai lunas! ✓' });
      }
    });
  }

  async function handleAddInstallment(debtId: string) {
    const amount = parseInt(formAmount.replace(/[^0-9]/g, ''), 10);
    if (!amount || !formDate) return;
    const debt = debts.find(d => d.id === debtId)!;
    startTransition(async () => {
      const result = await createInstallment({
        debtId,
        installmentNumber: debt.installments.length + 1,
        dueDate: formDate,
        amount,
        status: 'pending',
      });
      if (result.success) {
        toast({ title: 'Cicilan ditambahkan' });
        setShowAddInstallment(null); setFormAmount(''); setFormDate('');
      }
    });
  }

  async function handleUpdateInstallment() {
    if (!editInstallment) return;
    const amount = parseInt(formAmount.replace(/[^0-9]/g, ''), 10);
    startTransition(async () => {
      const result = await updateInstallment(editInstallment.id, {
        amount: amount || editInstallment.amount,
        dueDate: formDate || editInstallment.dueDate,
      });
      if (result.success) {
        toast({ title: 'Cicilan diperbarui' });
        setEditInstallment(null); setFormAmount(''); setFormDate('');
      }
    });
  }

  async function handleDeleteInstallment() {
    if (!deleteInstallmentId) return;
    startTransition(async () => {
      const result = await deleteInstallment(deleteInstallmentId);
      if (result.success) {
        toast({ title: 'Cicilan dihapus' });
        setDeleteInstallmentId(null);
      }
    });
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
            Cicilan & Utang
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Jadwal pembayaran dan pelunasan kewajiban
          </p>
        </div>
      </div>

      {debts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
          <CreditCard className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="font-semibold text-sm text-zinc-900">Tidak Ada Fasilitas Utang Aktif</p>
          <p className="text-xs text-zinc-500">Semua kewajiban telah terlunasi dengan baik.</p>
        </div>
      ) : (
        debts.map(debt => {
          const stats = getStats(debt);
          const progress = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;
          const isAllPaid = stats.paidCount === stats.totalCount && stats.totalCount > 0;

          return (
            <div key={debt.id} className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden space-y-4">
              {/* Debt Header */}
              <div className="p-5 sm:p-6 border-b border-stone-100 bg-stone-50/40">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-lg text-zinc-900">{debt.name}</h2>
                      {isAllPaid && (
                        <span className="text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full">
                          Lunas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {stats.paidCount} dari {stats.totalCount} angsuran diselesaikan
                    </p>
                  </div>

                  <button
                    onClick={() => { setShowAddInstallment(debt.id); setFormAmount(''); setFormDate(''); }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Angsuran</span>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-200/70 h-2.5 rounded-full overflow-hidden mb-1.5">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-zinc-500 mb-3">
                  <span className="font-semibold text-emerald-600">{progress}% Terbayar</span>
                  <span>Jatuh tempo setiap tgl 25</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-stone-200/60">
                  <div className="bg-white border border-stone-200/60 rounded-xl p-3 text-center">
                    <p className="text-[11px] text-zinc-500 font-medium">Total Pagu</p>
                    <p className="font-semibold text-sm sm:text-base text-zinc-900 tabular-nums mt-0.5">{formatCurrency(stats.total)}</p>
                  </div>
                  <div className="bg-white border border-stone-200/60 rounded-xl p-3 text-center">
                    <p className="text-[11px] text-emerald-600 font-medium">Sudah Bayar</p>
                    <p className="font-semibold text-sm sm:text-base text-emerald-600 tabular-nums mt-0.5">{formatCurrency(stats.paid)}</p>
                  </div>
                  <div className="bg-white border border-stone-200/60 rounded-xl p-3 text-center">
                    <p className="text-[11px] text-rose-600 font-medium">Sisa Utang</p>
                    <p className="font-semibold text-sm sm:text-base text-rose-600 tabular-nums mt-0.5">{formatCurrency(stats.remaining)}</p>
                  </div>
                </div>
              </div>

              {/* Installments List */}
              <div className="divide-y divide-stone-100 px-4 pb-2">
                {debt.installments.map(installment => (
                  <div key={installment.id} className="flex items-center gap-3 py-3">
                    <button
                      onClick={() => handleMarkPaid(installment.id, installment.status)}
                      disabled={isPending}
                      className="flex-shrink-0 text-zinc-400 hover:text-zinc-900 transition-colors"
                      title={installment.status === 'paid' ? 'Tandai belum bayar' : 'Tandai lunas'}
                    >
                      {installment.status === 'paid' ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-300" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-semibold',
                        installment.status === 'paid' ? 'text-zinc-400 line-through' : 'text-zinc-900'
                      )}>
                        Angsuran #{installment.installmentNumber}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Jatuh tempo: {formatDateShort(installment.dueDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        'font-sans text-xs sm:text-sm font-semibold tabular-nums',
                        installment.status === 'paid' ? 'text-zinc-400 line-through' : 'text-zinc-900'
                      )}>
                        {formatCurrency(installment.amount)}
                      </span>
                      {installment.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditInstallment(installment); setFormAmount(String(installment.amount)); setFormDate(installment.dueDate); }}
                            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteInstallmentId(installment.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Add Installment Dialog */}
      <Dialog open={!!showAddInstallment} onOpenChange={(open) => { if (!open) setShowAddInstallment(null); }}>
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">
              Tambah Jadwal Angsuran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Nominal Angsuran (Rp)</label>
              <input
                placeholder="0"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setShowAddInstallment(null)}
              className="px-3.5 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 text-xs"
            >
              Batal
            </button>
            <button
              onClick={() => showAddInstallment && handleAddInstallment(showAddInstallment)}
              disabled={isPending}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Angsuran'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Installment Dialog */}
      <Dialog open={!!editInstallment} onOpenChange={(open) => { if (!open) setEditInstallment(null); }}>
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">
              Ubah Jadwal Angsuran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Nominal Angsuran (Rp)</label>
              <input
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setEditInstallment(null)}
              className="px-3.5 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 text-xs"
            >
              Batal
            </button>
            <button
              onClick={handleUpdateInstallment}
              disabled={isPending}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteInstallmentId} onOpenChange={(open) => { if (!open) setDeleteInstallmentId(null); }}>
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">
              Hapus Angsuran
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500">Apakah kamu yakin ingin menghapus jadwal angsuran ini?</p>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setDeleteInstallmentId(null)}
              className="px-3.5 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 text-xs"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteInstallment}
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
