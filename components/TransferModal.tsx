'use client';

import { useState, useTransition } from 'react';
import { formatCurrency } from '@/lib/currency';
import { toDateString } from '@/lib/dates';
import { transferBetweenAccounts, AccountWithBalance } from '@/actions/accounts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeftRight, ArrowRight, Building2, Smartphone, Coins, Wallet } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  Smartphone,
  Coins,
  Wallet,
};

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountWithBalance[];
  onSuccess?: () => void;
}

export function TransferModal({ open, onOpenChange, accounts, onSuccess }: TransferModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(toDateString(new Date()));
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

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

    startTransition(async () => {
      const res = await transferBetweenAccounts({
        fromAccountId,
        toAccountId,
        amount: numAmount,
        transactionDate: date,
        note: note.trim() || undefined,
      });

      if (res.success) {
        toast({
          title: 'Transfer Berhasil! ✓',
          description: `${formatCurrency(numAmount)} dipindahkan dari ${fromAccount?.name} ke ${toAccount?.name}`,
        });
        setAmount('');
        setNote('');
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Gagal memproses transfer.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
                Transfer Antar Dompet
              </DialogTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pindahkan saldo tanpa mempengaruhi budget pengeluaran
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* From & To Grid */}
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

          {/* Amount */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nominal Transfer (Rp)</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-sans font-bold text-base sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white tabular-nums touch-manipulation"
            />
            {numAmount > 0 && fromAccount && toAccount && (
              <div className="mt-2 p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 space-y-1">
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{fromAccount.name}:</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    {formatCurrency(fromAccount.balance)} → {formatCurrency(fromAccount.balance - numAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{toAccount.name}:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(toAccount.balance)} → {formatCurrency(toAccount.balance + numAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Date & Note */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Transfer</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">Catatan (opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Tarik tunai ATM / Top up e-wallet"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
            />
          </div>

          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3.5 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 touch-manipulation"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-sm transition-all touch-manipulation flex items-center gap-1.5"
            >
              {isPending ? 'Memproses...' : 'Kirim Transfer'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
