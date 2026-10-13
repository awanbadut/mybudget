'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { AccountWithBalance } from '@/actions/accounts';
import { TransferModal, TransferModalMode } from '@/components/TransferModal';
import { AccountModal } from '@/components/AccountModal';
import { Building2, Smartphone, Coins, Wallet, ArrowLeftRight, Plus, Pencil, Banknote, ArrowDownToLine } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  Smartphone,
  Coins,
  Wallet,
};

interface WalletCardsProps {
  accounts: AccountWithBalance[];
}

export function WalletCards({ accounts }: WalletCardsProps) {
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferModalMode>('withdraw');
  const [transferFromId, setTransferFromId] = useState<string | undefined>(undefined);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountWithBalance | null>(null);

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
    <div className="space-y-3 font-sans">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-sm">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                Dompet & Rekening
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {accounts.length} Dompet
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Saldo Semua Kas: <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(totalBalance)}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => openWithdraw()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] touch-manipulation"
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Tarik Tunai</span>
          </button>

          <button
            onClick={() => openTransfer()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] touch-manipulation"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Pindah Saldo</span>
          </button>

          <button
            onClick={() => { setSelectedAccount(null); setShowAddAccount(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] touch-manipulation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map((acc) => {
          const Icon = ICON_MAP[acc.icon || 'Wallet'] || (acc.type === 'bank' ? Building2 : acc.type === 'ewallet' ? Smartphone : Coins);
          const accentColor = acc.color || '#2563eb';

          return (
            <div
              key={acc.id}
              onClick={() => { setSelectedAccount(acc); setShowAddAccount(true); }}
              className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer touch-manipulation"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {acc.name}
                      </span>
                      {acc.isDefault && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          Utama
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 capitalize">
                      {acc.type === 'bank' ? 'Bank Rekening' : acc.type === 'ewallet' ? 'E-Wallet' : acc.type === 'cash' ? 'Uang Tunai / Cash' : 'Lainnya'}
                      {acc.accountNumber ? ` · ${acc.accountNumber}` : ''}
                    </span>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Balance & Breakdown */}
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800/80 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Saldo Dompet</span>
                  <span className={cn(
                    'text-base font-extrabold tabular-nums tracking-tight',
                    acc.balance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                  )}>
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                  <span>Saldo Awal: {formatCurrency(acc.initialBalance)}</span>
                  {((acc.totalIncome || 0) > 0 || (acc.totalExpense || 0) > 0) && (
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">
                      +{(acc.totalIncome || 0) > 0 ? formatCurrency(acc.totalIncome) : '0'} / -{(acc.totalExpense || 0) > 0 ? formatCurrency(acc.totalExpense) : '0'}
                    </span>
                  )}
                </div>

                {/* Instant Quick Action Buttons per Card */}
                <div className="pt-2 flex items-center gap-1.5">
                  {acc.type === 'bank' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openWithdraw(acc.id);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-semibold transition-colors touch-manipulation"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Tarik Tunai ATM</span>
                    </button>
                  )}

                  {acc.type === 'cash' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeposit(acc.id);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-semibold transition-colors touch-manipulation"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Setor ke Bank</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openTransfer(acc.id);
                    }}
                    className="inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg text-[11px] font-medium transition-colors touch-manipulation"
                    title="Pindah Saldo"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Pindah</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <TransferModal
        open={showTransfer}
        onOpenChange={setShowTransfer}
        accounts={accounts}
        initialMode={transferMode}
        initialFromAccountId={transferFromId}
      />

      <AccountModal
        open={showAddAccount}
        onOpenChange={setShowAddAccount}
        account={selectedAccount}
      />
    </div>
  );
}
