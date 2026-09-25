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
        toast({ title: 'Tabungan ditambahkan! ✓', description: `+${formatCurrency(amount)}` });
        setAddSavingsGoalId(null); setSavingsAmount(''); setSavingsNote('');
      }
    });
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
            Target Tabungan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Akumulasi simpanan dan rencana dana masa depan
          </p>
        </div>

        <button
          onClick={() => { resetGoalForm(); setShowAddGoal(true); }}
          className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Target Baru</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
          <PiggyBank className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="font-semibold text-sm text-zinc-900">Belum Ada Target Tabungan</p>
          <p className="text-xs text-zinc-500">Rencanakan target tabungan untuk mencapai tujuan finansialmu.</p>
          <button
            className="mt-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-xl transition-all shadow-sm"
            onClick={() => { resetGoalForm(); setShowAddGoal(true); }}
          >
            + Buat Target Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isExpanded = expandedGoal === goal.id;

            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 sm:p-6 flex flex-col justify-between space-y-4">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/70">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-zinc-900 leading-tight">{goal.name}</h2>
                        {goal.deadline && (
                          <p className="text-xs text-zinc-400 mt-0.5">Tenggat: {formatDateShort(goal.deadline)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditGoal(goal)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteGoalId(goal.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-900 font-bold tabular-nums">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-zinc-400 tabular-nums">Pagu: {formatCurrency(goal.targetAmount)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="flex justify-between text-xs text-zinc-500">
                    <span className="font-semibold text-indigo-600">{progress}% Tercapai</span>
                    <span className="tabular-nums">Sisa: {formatCurrency(remaining)}</span>
                  </div>
                </div>

                {/* Actions & History */}
                <div className="pt-3 border-t border-stone-100 space-y-2.5">
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => { setAddSavingsGoalId(goal.id); setSavingsAmount(''); setSavingsNote(''); }}
                      className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-zinc-900 rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Setor Tabungan</span>
                    </button>
                    {goal.transactions.length > 0 && (
                      <button
                        onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                        className="px-3 py-2 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 transition-colors flex items-center justify-center"
                        title="Riwayat Setoran"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded history */}
                  {isExpanded && goal.transactions.length > 0 && (
                    <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 divide-y divide-stone-100 p-2 text-xs">
                      {goal.transactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="flex justify-between items-center py-1.5 px-2">
                          <span className="text-zinc-500">{formatDateShort(tx.transactionDate)}</span>
                          <span className="font-semibold text-emerald-600 tabular-nums">+{formatCurrency(tx.amount)}</span>
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
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">
              Setor Dana Tabungan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Nominal Setoran (Rp)</label>
              <input
                placeholder="0"
                value={savingsAmount}
                onChange={e => setSavingsAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Tanggal Setor</label>
              <input
                type="date"
                value={savingsDate}
                onChange={e => setSavingsDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Catatan (opsional)</label>
              <input
                placeholder="Contoh: Tabungan sisa gaji bulan ini"
                value={savingsNote}
                onChange={e => setSavingsNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setAddSavingsGoalId(null)}
              className="px-3.5 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 text-xs"
            >
              Batal
            </button>
            <button
              onClick={handleAddSavings}
              disabled={isPending}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Setoran'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Goal Dialog */}
      <Dialog open={showAddGoal || !!editGoal} onOpenChange={(open) => { if (!open) { setShowAddGoal(false); setEditGoal(null); resetGoalForm(); } }}>
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">
              {editGoal ? 'Ubah Target Tabungan' : 'Target Tabungan Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Nama Target</label>
              <input
                placeholder="Contoh: Dana Darurat / Laptop Baru"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Target Nominal (Rp)</label>
              <input
                placeholder="0"
                value={goalTarget}
                onChange={e => setGoalTarget(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Tenggat Waktu (opsional)</label>
              <input
                type="date"
                value={goalDeadline}
                onChange={e => setGoalDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => { setShowAddGoal(false); setEditGoal(null); resetGoalForm(); }}
              className="px-3.5 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 text-xs"
            >
              Batal
            </button>
            <button
              onClick={editGoal ? handleUpdateGoal : handleCreateGoal}
              disabled={isPending}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Target'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteGoalId} onOpenChange={(open) => { if (!open) setDeleteGoalId(null); }}>
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">
              Hapus Target
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500">Apakah kamu yakin ingin menghapus target tabungan ini?</p>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setDeleteGoalId(null)}
              className="px-3 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 text-xs"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteGoal}
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
