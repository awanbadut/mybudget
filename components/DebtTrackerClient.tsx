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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#24201D] pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-[#D9381E] uppercase">LEDGER Nº 04</span>
            <span className="text-[#24201D]/30">/</span>
            <span className="font-mono text-[10px] text-[#706860] uppercase">Jadwal Cicilan & Pelunasan</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#24201D] uppercase leading-none">
            UTANG & CICILAN
          </h1>
        </div>
      </div>

      {debts.length === 0 ? (
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-8 text-center shadow-[3px_3px_0px_#24201D] space-y-2">
          <CreditCard className="w-8 h-8 text-[#706860] mx-auto mb-1" />
          <p className="font-display font-bold text-lg text-[#24201D] uppercase">Tidak Ada Fasilitas Utang Aktif</p>
          <p className="font-sans text-xs text-[#706860]">Semua kewajiban telah terlunasi dengan baik.</p>
        </div>
      ) : (
        debts.map(debt => {
          const stats = getStats(debt);
          const progress = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;
          const isAllPaid = stats.paidCount === stats.totalCount && stats.totalCount > 0;

          return (
            <div key={debt.id} className="bg-[#FAF7F2] border-2 border-[#24201D] shadow-[3px_3px_0px_#24201D] overflow-hidden space-y-3">
              {/* Debt Header */}
              <div className="p-4 sm:p-5 border-b border-[#24201D]/20 bg-[#EDE6DC]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-extrabold text-xl text-[#24201D] uppercase">{debt.name}</h2>
                      {isAllPaid && (
                        <span className="font-mono text-[10px] font-bold bg-[#EAF4F5] border border-[#2A7B88] text-[#2A7B88] px-2 py-0.5 uppercase">
                          Lunas
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#706860] mt-0.5">
                      {stats.paidCount} dari {stats.totalCount} angsuran diselesaikan
                    </p>
                  </div>

                  <button
                    onClick={() => { setShowAddInstallment(debt.id); setFormAmount(''); setFormDate(''); }}
                    className="font-mono text-xs font-bold text-[#F4F0EA] bg-[#24201D] hover:bg-[#D9381E] px-3 py-1.5 border border-[#24201D] transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ANGSURAN</span>
                  </button>
                </div>

                {/* Ruler Progress bar */}
                <div className="w-full bg-[#E2D7C7] h-2.5 border border-[#24201D] p-[0.5px] mb-1.5">
                  <div className="h-full bg-[#2A7B88] transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between font-mono text-[11px] mb-3">
                  <span className="font-bold text-[#2A7B88]">{progress}% TERBAYAR</span>
                  <span className="text-[#706860]">Target jatuh tempo tgl 25</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-2 border-t border-[#24201D]/20">
                  <div className="bg-[#FAF7F2] border border-[#24201D]/30 p-2 text-center">
                    <p className="text-[10px] text-[#706860] uppercase">Total Pagu</p>
                    <p className="font-bold text-[#24201D] tabular-nums mt-0.5">{formatCurrency(stats.total)}</p>
                  </div>
                  <div className="bg-[#FAF7F2] border border-[#24201D]/30 p-2 text-center">
                    <p className="text-[10px] text-[#2A7B88] uppercase">Sudah Bayar</p>
                    <p className="font-bold text-[#2A7B88] tabular-nums mt-0.5">{formatCurrency(stats.paid)}</p>
                  </div>
                  <div className="bg-[#FAF7F2] border border-[#24201D]/30 p-2 text-center">
                    <p className="text-[10px] text-[#D9381E] uppercase">Sisa Utang</p>
                    <p className="font-bold text-[#D9381E] tabular-nums mt-0.5">{formatCurrency(stats.remaining)}</p>
                  </div>
                </div>
              </div>

              {/* Installments List */}
              <div className="divide-y divide-[#24201D]/20 px-4 pb-2">
                {debt.installments.map(installment => (
                  <div key={installment.id} className="flex items-center gap-3 py-3">
                    <button
                      onClick={() => handleMarkPaid(installment.id, installment.status)}
                      disabled={isPending}
                      className="flex-shrink-0 text-[#24201D] hover:text-[#D9381E] transition-colors"
                      title={installment.status === 'paid' ? 'Tandai belum bayar' : 'Tandai lunas'}
                    >
                      {installment.status === 'paid' ? (
                        <CheckSquare className="w-5 h-5 text-[#2A7B88]" />
                      ) : (
                        <Square className="w-5 h-5 text-[#706860]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0 font-mono">
                      <p className={cn(
                        'text-xs font-bold uppercase',
                        installment.status === 'paid' ? 'text-[#706860] line-through' : 'text-[#24201D]'
                      )}>
                        Angsuran #{installment.installmentNumber}
                      </p>
                      <p className="text-[10px] text-[#706860]">
                        Jatuh tempo: {formatDateShort(installment.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-mono text-xs sm:text-sm font-bold tabular-nums',
                        installment.status === 'paid' ? 'text-[#706860] line-through' : 'text-[#24201D]'
                      )}>
                        {formatCurrency(installment.amount)}
                      </span>
                      {installment.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditInstallment(installment); setFormAmount(String(installment.amount)); setFormDate(installment.dueDate); }}
                            className="p-1 border border-[#24201D]/30 bg-[#EDE6DC] hover:bg-[#24201D] hover:text-[#F4F0EA]"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteInstallmentId(installment.id)}
                            className="p-1 border border-[#D9381E]/40 bg-[#FBEBE8] text-[#D9381E] hover:bg-[#D9381E] hover:text-[#F4F0EA]"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
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
        <DialogContent className="max-w-sm bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl uppercase text-[#24201D]">
              Tambah Jadwal Angsuran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Nominal Angsuran (Rp)</label>
              <input
                placeholder="0"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-sm text-[#24201D] outline-none tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-2 font-mono text-xs">
            <button
              onClick={() => setShowAddInstallment(null)}
              className="px-3.5 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold uppercase"
            >
              BATAL
            </button>
            <button
              onClick={() => showAddInstallment && handleAddInstallment(showAddInstallment)}
              disabled={isPending}
              className="px-3.5 py-1.5 bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] font-bold uppercase shadow-[2px_2px_0px_#24201D]"
            >
              {isPending ? 'MENYIMPAN...' : 'SIMPAN ANGSURAN'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Installment Dialog */}
      <Dialog open={!!editInstallment} onOpenChange={(open) => { if (!open) setEditInstallment(null); }}>
        <DialogContent className="max-w-sm bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl uppercase text-[#24201D]">
              Ubah Jadwal Angsuran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Nominal Angsuran (Rp)</label>
              <input
                value={formAmount}
                onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-sm text-[#24201D] outline-none tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-2 font-mono text-xs">
            <button
              onClick={() => setEditInstallment(null)}
              className="px-3.5 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold uppercase"
            >
              BATAL
            </button>
            <button
              onClick={handleUpdateInstallment}
              disabled={isPending}
              className="px-3.5 py-1.5 bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] font-bold uppercase shadow-[2px_2px_0px_#24201D]"
            >
              {isPending ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteInstallmentId} onOpenChange={(open) => { if (!open) setDeleteInstallmentId(null); }}>
        <DialogContent className="max-w-sm bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg uppercase text-[#24201D]">
              Hapus Angsuran
            </DialogTitle>
          </DialogHeader>
          <p className="font-sans text-xs text-[#3D3834]">Apakah kamu yakin ingin menghapus jadwal angsuran ini?</p>
          <DialogFooter className="pt-2 font-mono text-xs">
            <button
              onClick={() => setDeleteInstallmentId(null)}
              className="px-3 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold uppercase"
            >
              BATAL
            </button>
            <button
              onClick={handleDeleteInstallment}
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
