'use client';
import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort, toDateString } from '@/lib/dates';
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addSavings } from '@/actions/savings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Target, Plus, Pencil, Trash2, PiggyBank, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateProgress } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface SavingsTransaction {
  id: string;
  amount: number;
  transactionDate: string;
  note: string | null;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  transactions: SavingsTransaction[];
}

export function SavingsClient({ goals }: { goals: SavingsGoal[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [addSavingsGoalId, setAddSavingsGoalId] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  // Goal form
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  // Savings form
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsDate, setSavingsDate] = useState(toDateString(new Date()));
  const [savingsNote, setSavingsNote] = useState('');

  function resetGoalForm() {
    setGoalName(''); setGoalTarget(''); setGoalDeadline('');
  }

  function openEditGoal(goal: SavingsGoal) {
    setEditGoal(goal);
    setGoalName(goal.name);
    setGoalTarget(String(goal.targetAmount));
    setGoalDeadline(goal.deadline || '');
  }

  async function handleCreateGoal() {
    const amount = parseInt(goalTarget.replace(/[^0-9]/g, ''), 10);
    if (!goalName || !amount) return;
    startTransition(async () => {
      const result = await createSavingsGoal({
        name: goalName, targetAmount: amount, deadline: goalDeadline || null,
      });
      if (result.success) {
        toast({ title: 'Target tabungan dibuat' });
        setShowAddGoal(false); resetGoalForm();
      }
    });
  }

  async function handleUpdateGoal() {
    if (!editGoal) return;
    const amount = parseInt(goalTarget.replace(/[^0-9]/g, ''), 10);
    startTransition(async () => {
      const result = await updateSavingsGoal(editGoal.id, {
        name: goalName, targetAmount: amount || editGoal.targetAmount,
        currentAmount: editGoal.currentAmount, deadline: goalDeadline || null,
      });
      if (result.success) {
        toast({ title: 'Target diperbarui' });
        setEditGoal(null); resetGoalForm();
      }
    });
  }

  async function handleDeleteGoal() {
    if (!deleteGoalId) return;
    startTransition(async () => {
      const result = await deleteSavingsGoal(deleteGoalId);
      if (result.success) {
        toast({ title: 'Target dihapus' });
        setDeleteGoalId(null);
      }
    });
  }

  async function handleAddSavings() {
    if (!addSavingsGoalId) return;
    const amount = parseInt(savingsAmount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) return;
    startTransition(async () => {
      const result = await addSavings({
        savingsGoalId: addSavingsGoalId,
        amount,
        transactionDate: savingsDate,
        note: savingsNote || null,
      });
      if (result.success) {
        toast({ title: 'Tabungan ditambahkan! 🎉', description: `+${formatCurrency(amount)}` });
        setAddSavingsGoalId(null); setSavingsAmount(''); setSavingsNote('');
      }
    });
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#24201D] pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-[#D9381E] uppercase">LEDGER Nº 05</span>
            <span className="text-[#24201D]/30">/</span>
            <span className="font-mono text-[10px] text-[#706860] uppercase">Akumulasi Aset Finansial</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#24201D] uppercase leading-none">
            TARGET TABUNGAN
          </h1>
        </div>

        <button
          onClick={() => { resetGoalForm(); setShowAddGoal(true); }}
          className="bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] px-3.5 py-2 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#24201D] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ TARGET BARU</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-8 text-center shadow-[3px_3px_0px_#24201D] space-y-2">
          <PiggyBank className="w-8 h-8 text-[#706860] mx-auto mb-1" />
          <p className="font-display font-bold text-lg text-[#24201D] uppercase">Belum Ada Target Tabungan</p>
          <p className="font-sans text-xs text-[#706860]">Rencanakan target tabungan dan masa depan finansialmu.</p>
          <button
            className="mt-2 font-mono text-xs font-bold text-[#F4F0EA] bg-[#D9381E] px-4 py-2 border border-[#B82C15] shadow-[2px_2px_0px_#24201D]"
            onClick={() => { resetGoalForm(); setShowAddGoal(true); }}
          >
            + BUAT TARGET SEKARANG
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isExpanded = expandedGoal === goal.id;

            return (
              <div key={goal.id} className="bg-[#FAF7F2] border-2 border-[#24201D] shadow-[3px_3px_0px_#24201D] p-4 sm:p-5 flex flex-col justify-between space-y-3">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-[#24201D]/20">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 border border-[#24201D] bg-[#EDE6DC] flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-[#24201D]" />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-lg text-[#24201D] uppercase leading-tight">{goal.name}</h2>
                        {goal.deadline && (
                          <p className="font-mono text-[10px] text-[#706860]">Tenggat: {formatDateShort(goal.deadline)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditGoal(goal)}
                        className="p-1 border border-[#24201D]/30 bg-[#EDE6DC] hover:bg-[#24201D] hover:text-[#F4F0EA]"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeleteGoalId(goal.id)}
                        className="p-1 border border-[#D9381E]/40 bg-[#FBEBE8] text-[#D9381E] hover:bg-[#D9381E] hover:text-[#F4F0EA]"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex justify-between font-mono text-xs mb-1.5">
                    <span className="text-[#3D3834] font-bold tabular-nums">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-[#706860] tabular-nums">Pagu: {formatCurrency(goal.targetAmount)}</span>
                  </div>

                  {/* Ruler Progress Bar */}
                  <div className="w-full bg-[#E2D7C7] h-2.5 border border-[#24201D] p-[0.5px] mb-1.5">
                    <div className="h-full bg-[#2A7B88] transition-all" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="font-bold text-[#2A7B88]">{progress}% TERCAPAI</span>
                    <span className="text-[#706860] tabular-nums">Sisa: {formatCurrency(remaining)}</span>
                  </div>
                </div>

                {/* Actions & History */}
                <div className="pt-2 border-t border-[#24201D]/20 space-y-2">
                  <div className="flex gap-2 font-mono text-xs">
                    <button
                      onClick={() => { setAddSavingsGoalId(goal.id); setSavingsAmount(''); setSavingsNote(''); }}
                      className="flex-1 py-1.5 bg-[#24201D] hover:bg-[#D9381E] text-[#F4F0EA] border border-[#24201D] font-bold uppercase transition-all"
                    >
                      + SETOR TABUNGAN
                    </button>
                    {goal.transactions.length > 0 && (
                      <button
                        onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                        className="px-2.5 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded history */}
                  {isExpanded && goal.transactions.length > 0 && (
                    <div className="border border-[#24201D] bg-[#EDE6DC]/60 divide-y divide-[#24201D]/20 p-1 font-mono text-[11px]">
                      {goal.transactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="flex justify-between items-center py-1 px-1.5">
                          <span className="text-[#706860]">{formatDateShort(tx.transactionDate)}</span>
                          <span className="font-bold text-[#2A7B88] tabular-nums">+{formatCurrency(tx.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Savings Deposit Dialog */}
      <Dialog open={!!addSavingsGoalId} onOpenChange={(open) => { if (!open) setAddSavingsGoalId(null); }}>
        <DialogContent className="max-w-sm bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl uppercase text-[#24201D]">
              Setor Dana Tabungan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Nominal Setoran (Rp)</label>
              <input
                placeholder="0"
                value={savingsAmount}
                onChange={e => setSavingsAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-sm text-[#24201D] outline-none tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Tanggal Setor</label>
              <input
                type="date"
                value={savingsDate}
                onChange={e => setSavingsDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Catatan (opsional)</label>
              <input
                placeholder="cth: Tabungan gaji bulan ini"
                value={savingsNote}
                onChange={e => setSavingsNote(e.target.value)}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-2 font-mono text-xs">
            <button
              onClick={() => setAddSavingsGoalId(null)}
              className="px-3.5 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold uppercase"
            >
              BATAL
            </button>
            <button
              onClick={handleAddSavings}
              disabled={isPending}
              className="px-3.5 py-1.5 bg-[#2A7B88] hover:bg-[#24201D] text-[#F4F0EA] border border-[#1E5E69] font-bold uppercase shadow-[2px_2px_0px_#24201D]"
            >
              {isPending ? 'MENYIMPAN...' : 'SIMPAN SETORAN'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Goal Dialog */}
      <Dialog open={showAddGoal || !!editGoal} onOpenChange={(open) => { if (!open) { setShowAddGoal(false); setEditGoal(null); resetGoalForm(); } }}>
        <DialogContent className="max-w-sm bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl uppercase text-[#24201D]">
              {editGoal ? 'Ubah Target Tabungan' : 'Target Tabungan Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Nama Target</label>
              <input
                placeholder="cth: Dana Darurat / Laptop"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Target Nominal (Rp)</label>
              <input
                placeholder="0"
                value={goalTarget}
                onChange={e => setGoalTarget(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-sm text-[#24201D] outline-none tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#24201D] uppercase">Tenggat Waktu (opsional)</label>
              <input
                type="date"
                value={goalDeadline}
                onChange={e => setGoalDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-2 font-mono text-xs">
            <button
              onClick={() => { setShowAddGoal(false); setEditGoal(null); resetGoalForm(); }}
              className="px-3.5 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold uppercase"
            >
              BATAL
            </button>
            <button
              onClick={editGoal ? handleUpdateGoal : handleCreateGoal}
              disabled={isPending}
              className="px-3.5 py-1.5 bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] font-bold uppercase shadow-[2px_2px_0px_#24201D]"
            >
              {isPending ? 'MENYIMPAN...' : 'SIMPAN TARGET'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteGoalId} onOpenChange={(open) => { if (!open) setDeleteGoalId(null); }}>
        <DialogContent className="max-w-sm bg-[#FAF7F2] border-2 border-[#24201D] shadow-[6px_6px_0px_#24201D]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg uppercase text-[#24201D]">
              Hapus Target
            </DialogTitle>
          </DialogHeader>
          <p className="font-sans text-xs text-[#3D3834]">Apakah kamu yakin ingin menghapus target tabungan ini?</p>
          <DialogFooter className="pt-2 font-mono text-xs">
            <button
              onClick={() => setDeleteGoalId(null)}
              className="px-3 py-1.5 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] font-bold uppercase"
            >
              BATAL
            </button>
            <button
              onClick={handleDeleteGoal}
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
