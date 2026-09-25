'use client';
import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort, toDateString } from '@/lib/dates';
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addSavings } from '@/actions/savings';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
    if (!amount) return;
    startTransition(async () => {
      const result = await addSavings({
        savingsGoalId: addSavingsGoalId, amount, transactionDate: savingsDate, note: savingsNote || null,
      });
      if (result.success) {
        toast({ title: 'Tabungan berhasil ditambahkan! 💰' });
        setAddSavingsGoalId(null); setSavingsAmount(''); setSavingsNote('');
      }
    });
  }

  const totalSavings = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tabungan</h1>
        <Button size="sm" onClick={() => setShowAddGoal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Target
        </Button>
      </div>

      {/* Total savings */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3 mb-1">
          <PiggyBank className="w-6 h-6" />
          <span className="text-sm font-medium opacity-90">Total Tabungan</span>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(totalSavings)}</p>
        <p className="text-sm opacity-70 mt-1">{goals.length} target aktif</p>
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada target tabungan</p>
          <Button className="mt-4" onClick={() => setShowAddGoal(true)}>+ Tambah target</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const isExpanded = expandedGoal === goal.id;
            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{goal.name}</h3>
                        {goal.deadline && <p className="text-xs text-gray-400">Target: {formatDateShort(goal.deadline)}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditGoal(goal)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button onClick={() => setDeleteGoalId(goal.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{formatCurrency(goal.currentAmount)}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 bg-blue-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-600 font-medium">{progress}%</span>
                      <span className="text-gray-400">Sisa {formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => { setAddSavingsGoalId(goal.id); setSavingsDate(toDateString(new Date())); }}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Tambah Tabungan
                    </Button>
                    {goal.transactions.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Transaction history */}
                {isExpanded && goal.transactions.length > 0 && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {goal.transactions.slice(0, 10).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm text-gray-600">{formatDateShort(tx.transactionDate)}</p>
                          {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                        </div>
                        <span className="text-sm font-semibold text-green-600">+{formatCurrency(tx.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoal} onOpenChange={(open) => { if (!open) { setShowAddGoal(false); resetGoalForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah Target Tabungan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nama Target</Label>
              <Input placeholder="Contoh: Dana Darurat" value={goalName} onChange={e => setGoalName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Target (Rp)</Label>
              <Input placeholder="0" value={goalTarget} onChange={e => setGoalTarget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label>Deadline (opsional)</Label>
              <Input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddGoal(false); resetGoalForm(); }}>Batal</Button>
            <Button onClick={handleCreateGoal} disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editGoal} onOpenChange={(open) => { if (!open) { setEditGoal(null); resetGoalForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Target</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nama Target</Label>
              <Input value={goalName} onChange={e => setGoalName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Target (Rp)</Label>
              <Input value={goalTarget} onChange={e => setGoalTarget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label>Deadline (opsional)</Label>
              <Input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditGoal(null); resetGoalForm(); }}>Batal</Button>
            <Button onClick={handleUpdateGoal} disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Savings Dialog */}
      <Dialog open={!!addSavingsGoalId} onOpenChange={(open) => { if (!open) { setAddSavingsGoalId(null); setSavingsAmount(''); setSavingsNote(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah Tabungan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nominal (Rp)</Label>
              <Input
                placeholder="0"
                value={savingsAmount}
                onChange={e => setSavingsAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="text-base font-bold text-gray-900"
              />
              {savingsAmount && (
                <p className="text-xs font-bold text-blue-600">
                  {formatCurrency(parseInt(savingsAmount, 10) || 0)}
                </p>
              )}
              <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
                {[50000, 100000, 200000, 500000, 1000000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      const cur = parseInt(savingsAmount || '0', 10);
                      setSavingsAmount(String(cur + amt));
                    }}
                    className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-semibold text-gray-600 active:scale-95 transition-all flex-shrink-0"
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tanggal</Label>
              <Input type="date" value={savingsDate} onChange={e => setSavingsDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Catatan (opsional)</Label>
              <Textarea placeholder="Dari mana tabungan ini?" value={savingsNote} onChange={e => setSavingsNote(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddSavingsGoalId(null); }}>Batal</Button>
            <Button onClick={handleAddSavings} disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteGoalId} onOpenChange={(open) => { if (!open) setDeleteGoalId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Hapus Target</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Apakah kamu yakin ingin menghapus target tabungan ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGoalId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteGoal} disabled={isPending}>{isPending ? 'Menghapus...' : 'Hapus'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
