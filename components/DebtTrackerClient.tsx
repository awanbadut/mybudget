'use client';
import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort, toDateString } from '@/lib/dates';
import {
  markInstallmentPaid, markInstallmentUnpaid, createDebt,
  createInstallment, updateInstallment, deleteInstallment
} from '@/actions/debts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Circle, Plus, CreditCard, TrendingDown, Pencil, Trash2 } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Utang & Cicilan</h1>
      </div>

      {debts.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Tidak ada utang aktif</p>
        </div>
      ) : (
        debts.map(debt => {
          const stats = getStats(debt);
          const progress = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;
          const isAllPaid = stats.paidCount === stats.totalCount && stats.totalCount > 0;

          return (
            <div key={debt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Debt Header */}
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-gray-900">{debt.name}</h2>
                      {isAllPaid && <Badge variant="secondary" className="bg-green-100 text-green-700">Lunas</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{stats.paidCount} dari {stats.totalCount} cicilan</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-400 mb-3">{progress}% lunas</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-xs font-semibold text-gray-900">{formatCurrency(stats.total)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-green-600">Sudah Bayar</p>
                    <p className="text-xs font-semibold text-green-700">{formatCurrency(stats.paid)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-red-500">Sisa</p>
                    <p className="text-xs font-semibold text-red-600">{formatCurrency(stats.remaining)}</p>
                  </div>
                </div>
              </div>

              {/* Installments */}
              <div className="divide-y divide-gray-50">
                {debt.installments.map(installment => (
                  <div key={installment.id} className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => handleMarkPaid(installment.id, installment.status)}
                      disabled={isPending}
                      className="flex-shrink-0"
                    >
                      {installment.status === 'paid' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', installment.status === 'paid' ? 'text-gray-400 line-through' : 'text-gray-900')}>
                        Cicilan {installment.installmentNumber}
                      </p>
                      <p className="text-xs text-gray-400">Jatuh tempo {formatDateShort(installment.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-semibold', installment.status === 'paid' ? 'text-gray-400' : 'text-gray-900')}>
                        {formatCurrency(installment.amount)}
                      </span>
                      {installment.status === 'pending' && (
                        <>
                          <button onClick={() => { setEditInstallment(installment); setFormAmount(String(installment.amount)); setFormDate(installment.dueDate); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                            <Pencil className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          <button onClick={() => setDeleteInstallmentId(installment.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Installment */}
              <div className="p-4 border-t border-gray-50">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAddInstallment(debt.id)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Tambah Cicilan
                </Button>
              </div>
            </div>
          );
        })
      )}

      {/* Add Installment Dialog */}
      <Dialog open={!!showAddInstallment} onOpenChange={(open) => { if (!open) setShowAddInstallment(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah Cicilan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nominal (Rp)</Label>
              <Input placeholder="0" value={formAmount} onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label>Tanggal Jatuh Tempo</Label>
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInstallment(null)}>Batal</Button>
            <Button onClick={() => handleAddInstallment(showAddInstallment!)} disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Installment Dialog */}
      <Dialog open={!!editInstallment} onOpenChange={(open) => { if (!open) { setEditInstallment(null); setFormAmount(''); setFormDate(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Cicilan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nominal (Rp)</Label>
              <Input value={formAmount} onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label>Tanggal Jatuh Tempo</Label>
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditInstallment(null); }}>Batal</Button>
            <Button onClick={handleUpdateInstallment} disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteInstallmentId} onOpenChange={(open) => { if (!open) setDeleteInstallmentId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Hapus Cicilan</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Apakah kamu yakin ingin menghapus cicilan ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteInstallmentId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteInstallment} disabled={isPending}>{isPending ? 'Menghapus...' : 'Hapus'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
