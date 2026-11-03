'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { AccountWithBalance } from '@/actions/accounts';
import { TransferModal, TransferModalMode } from '@/components/TransferModal';
import { AccountModal } from '@/components/AccountModal';
import { WalletHistoryModal, WalletTxItem } from '@/components/WalletHistoryModal';
import { CycleOption } from '@/components/CycleSelector';
import { useBalanceVisibility } from '@/context/BalanceVisibilityContext';
import { Building2, Smartphone, Coins, Wallet, ArrowLeftRight, Plus, Pencil, Banknote, ArrowDownToLine, Eye, EyeOff, History, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  Smartphone,
  Coins,
  Wallet,
  PiggyBank,
};

interface WalletCardsProps {
  accounts: AccountWithBalance[];
  transactions?: WalletTxItem[];
  categories?: Array<{ id: string; name: string; type: string }>;
  cycles?: CycleOption[];
  currentCycleOffset?: number;
}

export function WalletCards({
  accounts,
  transactions = [],
  categories = [],
  cycles = [],
  currentCycleOffset = 0,
}: WalletCardsProps) {
  const router = useRouter();
  const { showBalance, toggleBalance, formatMasked } = useBalanceVisibility();

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferModalMode>('withdraw');
  const [transferFromId, setTransferFromId] = useState<string | undefined>(undefined);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountWithBalance | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historyAccount, setHistoryAccount] = useState<AccountWithBalance | null>(null);

  const savingsAccounts = accounts.filter(a => a.type === 'savings' || /tabungan|simpanan|celengan|saving/i.test(a.name));
  const operationalAccounts = accounts.filter(a => !savingsAccounts.some(s => s.id === a.id));
  const operationalBalance = operationalAccounts.reduce((sum, a) => sum + a.balance, 0);
  const savingsWalletsBalance = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  function openWithdraw(accId?: string) {
    setTransferMode('withdraw');
    setTransferFromId(accId);
    setShowTransfer(true);
  }

  function openTransfer(accId?: string) {
    setTransferMode('transfer');
    setTransferFromId(accId);
    setShowTransfer(true);
  }

  function openDeposit(accId?: string) {
    setTransferMode('deposit');
    setTransferFromId(accId);
    setShowTransfer(true);
  }

  return (
    <div className="space-y-2.5 font-sans">
      {/* Compact Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-[15px] sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight truncate">
            Dompet &amp; Rekening
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {accounts.length}
          </span>
        </div>

        {/* Sleek Action Pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => openWithdraw()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-[11px] font-bold transition-all active:scale-95 touch-manipulation"
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Tarik</span>
          </button>

          <button
            type="button"
            onClick={() => openTransfer()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-[11px] font-bold transition-all active:scale-95 touch-manipulation"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Pindah</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedAccount(null); setShowAddAccount(true); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-[11px] font-bold transition-all active:scale-95 touch-manipulation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dompet</span>
          </button>
        </div>
      </div>

      {/* Clean 2-Column Mobile Grid (DANA Pocket Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {accounts.map((acc) => {
          const isSavingsAcc = acc.type === 'savings' || /tabungan|simpanan|celengan|saving/i.test(acc.name);
          const Icon = isSavingsAcc ? PiggyBank : (ICON_MAP[acc.icon || 'Wallet'] || (acc.type === 'bank' ? Building2 : acc.type === 'ewallet' ? Smartphone : Coins));
          const accentColor = isSavingsAcc ? '#16a34a' : (acc.color || '#2563eb');
          const typeLabel = isSavingsAcc
            ? 'Tabungan'
            : acc.type === 'bank'
            ? 'Bank'
            : acc.type === 'ewallet'
            ? 'E-Wallet'
            : acc.type === 'cash'
            ? 'Tunai'
            : 'Dompet';

          return (
            <div
              key={acc.id}
              onClick={() => { setHistoryAccount(acc); setShowHistory(true); }}
              className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer active:scale-[0.98] touch-manipulation flex flex-col justify-between gap-2.5 min-w-0"
              title="Ketuk untuk riwayat & penyesuaian saldo"
            >
              {/* Top Row: Icon & Edit Button */}
              <div className="flex items-start justify-between gap-1.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1">
                  {acc.isDefault && (
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      Utama
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAccount(acc);
                      setShowAddAccount(true);
                    }}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Edit Dompet"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Name & Balance */}
              <div className="min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-bold text-xs sm:text-[13px] text-zinc-900 dark:text-white truncate">
                    {acc.name}
                  </p>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                    · {typeLabel}
                  </span>
                </div>
                <p
                  className={cn(
                    'text-sm sm:text-[15px] font-extrabold tabular-nums tracking-tight truncate mt-0.5',
                    acc.balance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {formatMasked(acc.balance)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <WalletHistoryModal
        open={showHistory}
        onOpenChange={setShowHistory}
        account={historyAccount}
        allAccounts={accounts}
        transactions={transactions}
        categories={categories}
        cycles={cycles}
        initialCycleOffset={currentCycleOffset < 0 ? currentCycleOffset : 'all'}
        onEditAccount={(acc) => {
          setSelectedAccount(acc);
          setShowAddAccount(true);
        }}
      />

      <TransferModal
        open={showTransfer}
        onOpenChange={setShowTransfer}
        accounts={accounts}
        initialMode={transferMode}
        initialFromAccountId={transferFromId}
        onSuccess={() => router.refresh()}
      />

      <AccountModal
        open={showAddAccount}
        onOpenChange={setShowAddAccount}
        account={selectedAccount}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
