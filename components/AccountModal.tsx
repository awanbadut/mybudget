'use client';

import { useState, useTransition, useEffect } from 'react';
import { createAccount, updateAccount, deleteAccount, AccountWithBalance } from '@/actions/accounts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, Smartphone, Coins, Wallet, CreditCard, Trash2 } from 'lucide-react';

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountWithBalance | null;
  onSuccess?: () => void;
}

const COLOR_OPTIONS = [
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#16a34a' },
  { name: 'Cyan', hex: '#0284c7' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Zinc', hex: '#3f3f46' },
];

export function AccountModal({ open, onOpenChange, account, onSuccess }: AccountModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState<'bank' | 'ewallet' | 'cash' | 'other'>((account?.type as any) || 'bank');
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber || '');
  const [initialBalance, setInitialBalance] = useState(account ? String(account.initialBalance) : '0');
  const [color, setColor] = useState(account?.color || '#2563eb');
  const [icon, setIcon] = useState(account?.icon || 'Building2');
  const [isDefault, setIsDefault] = useState(account?.isDefault || false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(account?.name || '');
      setType((account?.type as any) || 'bank');
      setAccountNumber(account?.accountNumber || '');
      setInitialBalance(account ? String(account.initialBalance) : '0');
      setColor(account?.color || '#2563eb');
      setIcon(account?.icon || (account?.type === 'ewallet' ? 'Smartphone' : account?.type === 'cash' ? 'Coins' : 'Building2'));
      setIsDefault(account?.isDefault || false);
      setError('');
    }
  }, [open, account]);

  const numBalance = parseInt(initialBalance.replace(/[^0-9]/g, ''), 10) || 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama dompet/rekening harus diisi.');
      return;
    }

    startTransition(async () => {
      if (account) {
        const res = await updateAccount(account.id, {
          name: name.trim(),
          type,
          accountNumber: accountNumber.trim() || null,
          initialBalance: numBalance,
          color,
          icon,
          isDefault,
        });

        if (res.success) {
          toast({ title: 'Dompet Diperbarui! ✓' });
          onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          setError(res.error || 'Gagal memperbarui dompet.');
        }
      } else {
        const res = await createAccount({
          name: name.trim(),
          type,
          accountNumber: accountNumber.trim() || null,
          initialBalance: numBalance,
          color,
          icon,
          isDefault,
        });

        if (res.success) {
          toast({ title: 'Dompet Baru Ditambahkan! ✓' });
          onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          setError(res.error || 'Gagal membuat dompet baru.');
        }
      }
    });
  }

  function handleDelete() {
    if (!account) return;
    if (!confirm(`Hapus dompet "${account.name}"?`)) return;

    startTransition(async () => {
      const res = await deleteAccount(account.id);
      if (res.success) {
        toast({ title: 'Dompet Dihapus' });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Gagal menghapus dompet.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              {account ? 'Kelola Dompet / Rekening' : 'Tambah Dompet / Rekening'}
            </DialogTitle>
            {account && !account.isDefault && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Hapus Dompet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nama Dompet</label>
            <input
              type="text"
              placeholder="Contoh: BCA, Mandiri, GoPay, Dompet Saku"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tipe</label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as any;
                  setType(t);
                  if (t === 'bank') setIcon('Building2');
                  else if (t === 'ewallet') setIcon('Smartphone');
                  else if (t === 'cash') setIcon('Coins');
                  else setIcon('Wallet');
                }}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
              >
                <option value="bank">Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="cash">Tunai / Cash</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nomor Rekening / Akun</label>
              <input
                type="text"
                placeholder="Opsional (mis: 123456789)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">Saldo Awal (Rp)</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-medium text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white tabular-nums touch-manipulation"
            />
          </div>

          {/* Color & Icon Picker */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">Warna Aksen</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c.hex ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultAccount"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 dark:focus:ring-white border-stone-300 dark:border-zinc-700"
            />
            <label htmlFor="isDefaultAccount" className="font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
              Jadikan Dompet Utama (Default)
            </label>
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
              className="px-4 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-sm transition-all touch-manipulation"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Dompet'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
