'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { toDateString } from '@/lib/dates';
import { transferBetweenAccounts, AccountWithBalance } from '@/actions/accounts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeftRight, Building2, Smartphone, Coins, Wallet, Banknote, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  Smartphone,
  Coins,
  Wallet,
};

const ATM_PRESETS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export type TransferModalMode = 'withdraw' | 'deposit' | 'transfer';

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountWithBalance[];
  initialMode?: TransferModalMode;
  initialFromAccountId?: string;
  onSuccess?: () => void;
}

export function TransferModal({
  open,
  onOpenChange,
  accounts,
  initialMode = 'withdraw',
  initialFromAccountId,
  onSuccess,
}: TransferModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<TransferModalMode>(initialMode);
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(toDateString(new Date()));
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  const cashAccount = accounts.find(a => a.type === 'cash') || accounts[0];
  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const defaultBank = bankAccounts[0] || accounts.find(a => a.id !== cashAccount?.id) || accounts[0];

  // Sync state whenever modal is opened or mode/account props change
  useEffect(() => {
    if (open) {
      setError('');
      setAmount('');
      setNote('');
      setDate(toDateString(new Date()));
      const activeMode = initialMode || 'withdraw';
      setMode(activeMode);

      if (activeMode === 'withdraw') {
        // Tarik Tunai: Dari Bank ke Kas Tunai
        const from = initialFromAccountId
          ? accounts.find(a => a.id === initialFromAccountId)
          : defaultBank;
        setFromAccountId(from?.id || accounts[0]?.id || '');
        setToAccountId(cashAccount?.id || '');
      } else if (activeMode === 'deposit') {
        // Setor Tunai: Dari Kas Tunai ke Bank
        setFromAccountId(cashAccount?.id || '');
        const to = initialFromAccountId && initialFromAccountId !== cashAccount?.id
          ? accounts.find(a => a.id === initialFromAccountId)
          : defaultBank;
        setToAccountId(to?.id || accounts[0]?.id || '');
      } else {
        // Transfer Bebas
        const from = initialFromAccountId
          ? accounts.find(a => a.id === initialFromAccountId)
          : accounts[0];
        setFromAccountId(from?.id || accounts[0]?.id || '');
        const to = accounts.find(a => a.id !== (from?.id || accounts[0]?.id));
        setToAccountId(to?.id || accounts[1]?.id || accounts[0]?.id || '');
      }
    }
  }, [open, initialMode, initialFromAccountId, accounts, cashAccount?.id, defaultBank]);

  // Handle switching tabs
  function handleModeChange(newMode: TransferModalMode) {
    setMode(newMode);
    setError('');

    if (newMode === 'withdraw') {
      const from = accounts.find(a => a.id === fromAccountId && a.type === 'bank') || defaultBank;
      setFromAccountId(from?.id || accounts[0]?.id || '');
      setToAccountId(cashAccount?.id || '');
    } else if (newMode === 'deposit') {
      setFromAccountId(cashAccount?.id || '');
      const to = accounts.find(a => a.id === toAccountId && a.id !== cashAccount?.id) || defaultBank;
      setToAccountId(to?.id || accounts[0]?.id || '');
    } else {
      if (fromAccountId === toAccountId) {
        const other = accounts.find(a => a.id !== fromAccountId);
        if (other) setToAccountId(other.id);
      }
    }
  }

  const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fromAccountId || !toAccountId) {
      setError('Pilih dompet asal dan tujuan.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Dompet asal dan tujuan tidak boleh sama.');
      return;
    }

    if (numAmount <= 0) {
      setError('Nominal transfer harus lebih dari 0.');
      return;
    }

    // Default note based on mode
    let defaultNote = note.trim();
    if (!defaultNote) {
      if (mode === 'withdraw') {
        defaultNote = `Tarik tunai ATM dari ${fromAccount?.name || 'Bank'}`;
      } else if (mode === 'deposit') {
        defaultNote = `Setor tunai ke ${toAccount?.name || 'Bank'}`;
      } else {
        defaultNote = `Pindah saldo dari ${fromAccount?.name} ke ${toAccount?.name}`;
      }
    }

    startTransition(async () => {
      const res = await transferBetweenAccounts({
        fromAccountId,
        toAccountId,
        amount: numAmount,
        transactionDate: date,
        note: defaultNote,
      });

      if (res.success) {
        toast({
          title: mode === 'withdraw' ? 'Tarik Tunai Berhasil! ✓' : mode === 'deposit' ? 'Setor Tunai Berhasil! ✓' : 'Transfer Berhasil! ✓',
          description: `${formatCurrency(numAmount)} dipindahkan dari ${fromAccount?.name} ke ${toAccount?.name}`,
        });
        setAmount('');
        setNote('');
        onOpenChange(false);
        router.refresh();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Gagal memproses transaksi.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl p-5 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm',
              mode === 'withdraw' ? 'bg-emerald-600' : mode === 'deposit' ? 'bg-blue-600' : 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
            )}>
              {mode === 'withdraw' ? <Banknote className="w-5 h-5" /> : mode === 'deposit' ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white">
                {mode === 'withdraw' ? 'Tarik Tunai ATM' : mode === 'deposit' ? 'Setor Tunai ke Bank' : 'Transfer Antar Dompet'}
              </DialogTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {mode === 'withdraw'
                  ? 'Konversi saldo bank menjadi uang tunai di saku'
                  : mode === 'deposit'
                  ? 'Setor uang tunai fisik ke rekening bank'
                  : 'Pindahkan saldo tanpa mempengaruhi budget pengeluaran'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Mode Tabs */}
        <div className="flex items-center bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => handleModeChange('withdraw')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all touch-manipulation',
              mode === 'withdraw'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            )}
          >
            <Banknote className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Tarik Tunai</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('transfer')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all touch-manipulation',
              mode === 'transfer'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            )}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Transfer Bebas</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('deposit')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all touch-manipulation',
              mode === 'deposit'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            )}
          >
            <ArrowDownToLine className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Setor Tunai</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Account Selection Section */}
          {mode === 'withdraw' ? (
            <div className="space-y-2">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Pilih Bank Penarikan (Sumber Uang)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {accounts.filter(a => a.id !== toAccountId).map((acc) => {
                  const isSelected = fromAccountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setFromAccountId(acc.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all touch-manipulation',
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-600'
                          : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-400'
                      )}
                    >
                      <div className="font-bold text-xs truncate">{acc.name}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                        Saldo: {formatCurrency(acc.balance)}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400">
                <Coins className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px]">
                  Tujuan otomatis: <strong className="text-zinc-900 dark:text-white">{toAccount?.name || cashAccount?.name || 'Kas Tunai'}</strong> (Saldo: {formatCurrency(toAccount?.balance || cashAccount?.balance || 0)})
                </span>
              </div>
            </div>
          ) : mode === 'deposit' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400">
                <Coins className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-[11px]">
                  Sumber uang tunai: <strong className="text-zinc-900 dark:text-white">{fromAccount?.name || cashAccount?.name || 'Kas Tunai'}</strong> (Saldo: {formatCurrency(fromAccount?.balance || cashAccount?.balance || 0)})
                </span>
              </div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Pilih Rekening Bank Tujuan Setoran
              </label>
              <div className="grid grid-cols-2 gap-2">
                {accounts.filter(a => a.id !== fromAccountId).map((acc) => {
                  const isSelected = toAccountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setToAccountId(acc.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all touch-manipulation',
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600'
                          : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-400'
                      )}
                    >
                      <div className="font-bold text-xs truncate">{acc.name}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                        Saldo: {formatCurrency(acc.balance)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Dari Dompet (Asal)</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Ke Dompet (Tujuan)</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Amount Section with Quick ATM Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                {mode === 'withdraw' ? 'Nominal Tarik Tunai' : mode === 'deposit' ? 'Nominal Setor Tunai' : 'Nominal Transfer'}
              </label>
              {numAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="text-[11px] text-zinc-400 hover:text-rose-600 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount ? Number(amount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-sans font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white tabular-nums touch-manipulation"
              />
            </div>

            {/* Quick ATM Chips */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-zinc-400 font-medium">Pilihan Cepat ATM:</span>
              <div className="flex flex-wrap gap-1.5">
                {ATM_PRESETS.map((preset) => {
                  const isSelected = numAmount === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation',
                        isSelected
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                          : 'bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      )}
                    >
                      {preset >= 1000000 ? `${preset / 1000000} Juta` : `${preset / 1000}rb`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Balance Impact Preview */}
            {numAmount > 0 && fromAccount && toAccount && (
              <div className="mt-2.5 p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/80 dark:border-zinc-700 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Preview Perubahan Saldo</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">{fromAccount.name} (Berkurang):</span>
                  <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                    {formatCurrency(fromAccount.balance)} → {formatCurrency(fromAccount.balance - numAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">{toAccount.name} (Bertambah):</span>
                  <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(toAccount.balance)} → {formatCurrency(toAccount.balance + numAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Date & Optional Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Catatan Tambahan</label>
              <input
                type="text"
                placeholder={mode === 'withdraw' ? 'Tarik tunai ATM...' : 'Opsional...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3.5 py-2.5 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 touch-manipulation"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || numAmount <= 0}
              className={cn(
                'px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all touch-manipulation flex items-center justify-center gap-2',
                mode === 'withdraw'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : mode === 'deposit'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900'
              )}
            >
              {isPending
                ? 'Memproses...'
                : mode === 'withdraw'
                ? `Konfirmasi Tarik Tunai ${numAmount > 0 ? formatCurrency(numAmount) : ''}`
                : mode === 'deposit'
                ? `Konfirmasi Setor Tunai ${numAmount > 0 ? formatCurrency(numAmount) : ''}`
                : `Kirim Transfer ${numAmount > 0 ? formatCurrency(numAmount) : ''}`}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
