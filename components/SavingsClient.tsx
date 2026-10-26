'use client';

import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort, toDateString } from '@/lib/dates';
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addSavings, deleteSavingsTransaction, syncSavingsWithWallet } from '@/actions/savings';
import { AccountWithBalance } from '@/actions/accounts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Target, Plus, Pencil, Trash2, PiggyBank, ChevronDown, ChevronUp, Wallet, RefreshCw, CheckCircle2, X, Sparkles, CalendarClock } from 'lucide-react';
import { calculateProgress } from '@/lib/calculations';
import { PaginationBar } from '@/components/PaginationBar';
import { cn } from '@/lib/utils';

interface SavingsTransaction {
  id: string;
  amount: number;
  transactionDate: string;
  note: string | null;
  accountId?: string | null;
  transactionId?: string | null;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  transactions: SavingsTransaction[];
}

export function SavingsClient({
  goals,
  accounts = [],
}: {
  goals: SavingsGoal[];
  accounts?: AccountWithBalance[];
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const savingsWallet = accounts.find(a => a.type === 'savings' || /tabungan|simpanan|celengan|saving/i.test(a.name));
  const operationalAccounts = accounts.filter(a => a.id !== savingsWallet?.id);
  const defaultAccount = operationalAccounts.find(a => a.isDefault) || operationalAccounts[0] || accounts[0];
  const totalGoalsSaved = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [addSavingsGoalId, setAddSavingsGoalId] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(10);

  // Goal form
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  // Savings form
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsDate, setSavingsDate] = useState(toDateString(new Date()));
  const [savingsNote, setSavingsNote] = useState('');
  const [deductFromCash, setDeductFromCash] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccount?.id || '');

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
        deductFromCash,
        accountId: deductFromCash ? (selectedAccountId || null) : null,
      });
      if (result.success) {
        const accName = accounts.find(a => a.id === selectedAccountId)?.name;
        toast({
          title: 'Tabungan ditambahkan! ✓',
          description: deductFromCash && accName
            ? `+${formatCurrency(amount)} (Dipotong dari ${accName})`
            : `+${formatCurrency(amount)}`,
        });
        setAddSavingsGoalId(null);
        setSavingsAmount('');
        setSavingsNote('');
      }
    });
  }

  async function handleDeleteSavingsEntry(txId: string, goalId: string) {
    if (!confirm('Hapus setoran tabungan ini? Jika terpotong dari kas, saldo akan dikembalikan ke dompet.')) return;
    startTransition(async () => {
      const result = await deleteSavingsTransaction(txId, goalId);
      if (result.success) {
        toast({ title: 'Setoran tabungan dihapus & saldo kas dikembalikan ✓' });
      }
    });
  }

  function handleSyncWallet(accId: string) {
    startTransition(async () => {
      const res = await syncSavingsWithWallet(accId);
      if (res.success) {
        toast({
          title: 'Dompet Tabungan Tersinkron! ✓',
          description: `Saldo tabungan disamakan dengan dompet (${formatCurrency(res.syncedBalance || 0)}) tanpa dihitung dobel.`,
        });
      } else {
        toast({ title: res.error || 'Gagal menyinkronkan dompet', variant: 'destructive' });
      }
    });
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
            Target Tabungan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Akumulasi simpanan dan rencana dana masa depan
          </p>
        </div>

        <button
          onClick={() => { resetGoalForm(); setShowAddGoal(true); }}
          className="inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Target Baru</span>
        </button>
      </div>

      {/* Dompet Tempat Tabungan Sync Card (Anti Saldo Dobel) */}
      {accounts.length > 0 && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                    {savingsWallet
                      ? `Terhubung dengan Dompet Tabungan: ${savingsWallet.name}`
                      : 'Pilih Dompet Tempat Menyimpan Tabungan'}
                  </h3>
                  {savingsWallet && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Anti Saldo Dobel Aktif</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {savingsWallet
                    ? `Saldo di dompet "${savingsWallet.name}" (${formatCurrency(savingsWallet.balance)}) diakui sebagai tabungan yang sama dengan menu ini, sehingga tidak dihitung ganda pada Kekayaan Bersih.`
                    : 'Jika Anda menggunakan 1 dompet khusus untuk menyimpan tabungan, pilih dompet tersebut di bawah agar saldonya sinkron dan tidak terhitung dobel.'}
                </p>
              </div>
            </div>

            {savingsWallet && totalGoalsSaved !== savingsWallet.balance && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSyncWallet(savingsWallet.id)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex-shrink-0"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isPending && 'animate-spin')} />
                <span>Samakan Saldo ({formatCurrency(savingsWallet.balance)})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
              Dompet Tabungan:
            </span>
            {accounts.map(acc => {
              const isSelected = savingsWallet?.id === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSyncWallet(acc.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all touch-manipulation',
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:border-emerald-400'
                  )}
                >
                  {acc.name} ({formatCurrency(acc.balance)})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5 transition-colors">
          <PiggyBank className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto" />
          <p className="font-semibold text-sm text-zinc-900 dark:text-white">Belum Ada Target Tabungan</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Rencanakan target tabungan untuk mencapai tujuan finansialmu.</p>
          <button
            className="mt-2 text-xs font-semibold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 px-4 py-2 rounded-xl transition-all shadow-sm"
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
            const isCompleted = progress >= 100;

            let smartHint: string | null = null;
            if (!isCompleted && remaining > 0) {
              if (goal.deadline) {
                const diffMs = new Date(goal.deadline).getTime() - Date.now();
                const monthsLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
                const monthlyNeeded = Math.ceil(remaining / monthsLeft);
                smartHint = `Rekomendasi: ${formatCurrency(monthlyNeeded)} / bln (${monthsLeft} bln tersisa)`;
              } else if (goal.transactions.length > 0) {
                const avgDeposit = Math.round(
                  goal.transactions.reduce((s, t) => s + t.amount, 0) / goal.transactions.length
                );
                if (avgDeposit > 0) {
                  const estDepositsLeft = Math.ceil(remaining / avgDeposit);
                  smartHint = `Estimasi ~${estDepositsLeft}x setoran lagi (rata-rata ${formatCurrency(avgDeposit)})`;
                }
              }
            }

            return (
              <div key={goal.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-colors">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center border",
                        isCompleted
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60"
                          : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100/70 dark:border-indigo-800/60"
                      )}>
                        {isCompleted ? <Sparkles className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-base text-zinc-900 dark:text-white leading-tight">{goal.name}</h2>
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                              🎉 Tercapai!
                            </span>
                          )}
                        </div>
                        {goal.deadline && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Tenggat: {formatDateShort(goal.deadline)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditGoal(goal)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteGoalId(goal.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-900 dark:text-white font-bold tabular-nums">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-zinc-400 dark:text-zinc-500 tabular-nums">Target: {formatCurrency(goal.targetAmount)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-stone-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isCompleted ? "bg-emerald-500" : "bg-indigo-600 dark:bg-indigo-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className={cn(
                      "font-semibold",
                      isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"
                    )}>
                      {progress}% Tercapai
                    </span>
                    <span className="tabular-nums">Sisa: {formatCurrency(remaining)}</span>
                  </div>

                  {smartHint && (
                    <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      <CalendarClock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{smartHint}</span>
                    </div>
                  )}
                </div>

                {/* Actions & History */}
                <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 space-y-2.5">
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => { setAddSavingsGoalId(goal.id); setSavingsAmount(''); setSavingsNote(''); }}
                      className="flex-1 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Setor Tabungan</span>
                    </button>
                    {goal.transactions.length > 0 && (
                      <button
                        onClick={() => {
                          setExpandedGoal(isExpanded ? null : goal.id);
                          setTxPage(1);
                        }}
                        className="px-3 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
                        title="Riwayat Setoran"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded history (Paginated per 10 items) */}
                  {isExpanded && goal.transactions.length > 0 && (
                    <div className="rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/50 overflow-hidden text-xs">
                      <div className="divide-y divide-stone-100 dark:divide-zinc-800 p-2">
                      {goal.transactions
                        .slice((txPage - 1) * txPageSize, txPage * txPageSize)
                        .map(tx => {
                        const acc = tx.accountId ? accounts.find(a => a.id === tx.accountId) : null;
                        return (
                          <div key={tx.id} className="flex justify-between items-center py-2 px-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-zinc-600 dark:text-zinc-300 font-medium">{formatDateShort(tx.transactionDate)}</span>
                                {acc && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">
                                    {acc.name}
                                  </span>
                                )}
                              </div>
                              {tx.note && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{tx.note}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">+{formatCurrency(tx.amount)}</span>
                              <button
                                onClick={() => handleDeleteSavingsEntry(tx.id, goal.id)}
                                className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                title="Hapus setoran ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      </div>

                      <PaginationBar
                        currentPage={txPage}
                        totalItems={goal.transactions.length}
                        pageSize={txPageSize}
                        onPageChange={setTxPage}
                        onPageSizeChange={setTxPageSize}
                        pageSizeOptions={[10, 20, 50]}
                        itemLabel="setoran"
                      />
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
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              Setor Dana Tabungan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs pt-2">
            {/* Hero Currency Input */}
            <div className="space-y-2">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nominal Setoran</label>
              <div className="relative flex items-center bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/80 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-white transition-all">
                <span className="font-bold text-sm text-zinc-400 dark:text-zinc-500 mr-2 select-none">Rp</span>
                <input
                  placeholder="0"
                  value={savingsAmount ? Number(savingsAmount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                  onChange={e => setSavingsAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  className="w-full bg-transparent font-sans font-extrabold text-xl text-zinc-900 dark:text-white focus:outline-none tabular-nums touch-manipulation"
                />
                {savingsAmount && (
                  <button
                    type="button"
                    onClick={() => setSavingsAmount('')}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
                    title="Reset nominal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Preset Chips (Grid 3 cols, no horizontal scroll) */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {[
                  { label: '+50rb', val: 50000 },
                  { label: '+100rb', val: 100000 },
                  { label: '+250rb', val: 250000 },
                  { label: '+500rb', val: 500000 },
                  { label: '+1jt', val: 1000000 },
                  { label: '+2jt', val: 2000000 },
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      const curr = parseInt(savingsAmount.replace(/[^0-9]/g, '') || '0', 10);
                      setSavingsAmount(String(curr + p.val));
                    }}
                    className="py-1.5 px-2 rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] transition-colors active:scale-[0.98]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Setor</label>
                <input
                  type="date"
                  value={savingsDate}
                  onChange={e => setSavingsDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Catatan (opsional)</label>
                <input
                  placeholder="Mis: Sisa gaji"
                  value={savingsNote}
                  onChange={e => setSavingsNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
                />
              </div>
            </div>

            {/* Connected wallet deduction */}
            <div className="pt-2 border-t border-stone-100 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deductFromCashCheck"
                  checked={deductFromCash}
                  onChange={(e) => setDeductFromCash(e.target.checked)}
                  className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 dark:focus:ring-white border-stone-300 dark:border-zinc-700 cursor-pointer"
                />
                <label htmlFor="deductFromCashCheck" className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  Potong dari Saldo Kas / Dompet
                </label>
              </div>

              {deductFromCash && accounts.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Pilih Dompet Sumber Dana:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {accounts.map(acc => {
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setSelectedAccountId(acc.id)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all touch-manipulation',
                            isSelected
                              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs'
                              : 'bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:border-zinc-400'
                          )}
                        >
                          <span className="font-bold truncate pr-2">{acc.name}</span>
                          <span className={cn(
                            'text-[10px] font-semibold tabular-nums flex-shrink-0',
                            isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'
                          )}>
                            {formatCurrency(acc.balance)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">
                    Saldo dompet ini akan otomatis dipindahkan ke tabungan sehingga tidak dihitung sebagai pengeluaran.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setAddSavingsGoalId(null)}
              className="px-3.5 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs touch-manipulation"
            >
              Batal
            </button>
            <button
              onClick={handleAddSavings}
              disabled={isPending}
              className="px-4 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-sm transition-all touch-manipulation"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Setoran'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Goal Dialog */}
      <Dialog open={showAddGoal || !!editGoal} onOpenChange={(open) => { if (!open) { setShowAddGoal(false); setEditGoal(null); resetGoalForm(); } }}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              {editGoal ? 'Ubah Target Tabungan' : 'Target Tabungan Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs pt-2">
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nama Target</label>
              <input
                placeholder="Contoh: Dana Darurat / Laptop Baru"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
              />
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Target Nominal</label>
              <div className="relative flex items-center bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/80 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-white transition-all">
                <span className="font-bold text-sm text-zinc-400 dark:text-zinc-500 mr-2 select-none">Rp</span>
                <input
                  placeholder="0"
                  value={goalTarget ? Number(goalTarget.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                  onChange={e => setGoalTarget(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  className="w-full bg-transparent font-sans font-extrabold text-xl text-zinc-900 dark:text-white focus:outline-none tabular-nums touch-manipulation"
                />
                {goalTarget && (
                  <button
                    type="button"
                    onClick={() => setGoalTarget('')}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
                    title="Reset nominal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {[
                  { label: '+1jt', val: 1000000 },
                  { label: '+2,5jt', val: 2500000 },
                  { label: '+5jt', val: 5000000 },
                  { label: '+10jt', val: 10000000 },
                  { label: '+25jt', val: 25000000 },
                  { label: '+50jt', val: 50000000 },
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      const curr = parseInt(goalTarget.replace(/[^0-9]/g, '') || '0', 10);
                      setGoalTarget(String(curr + p.val));
                    }}
                    className="py-1.5 px-2 rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] transition-colors active:scale-[0.98]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tenggat Waktu (opsional)</label>
              <input
                type="date"
                value={goalDeadline}
                onChange={e => setGoalDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => { setShowAddGoal(false); setEditGoal(null); resetGoalForm(); }}
              className="px-3.5 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs touch-manipulation"
            >
              Batal
            </button>
            <button
              onClick={editGoal ? handleUpdateGoal : handleCreateGoal}
              disabled={isPending}
              className="px-4 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-sm transition-all touch-manipulation"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Target'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteGoalId} onOpenChange={(open) => { if (!open) setDeleteGoalId(null); }}>
        <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              Hapus Target
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Apakah kamu yakin ingin menghapus target tabungan ini?</p>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setDeleteGoalId(null)}
              className="px-3 py-1.5 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs"
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
