'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort, toDateString } from '@/lib/dates';
import { AccountWithBalance } from '@/actions/accounts';
import { createTransaction } from '@/actions/transactions';
import { CycleOption } from '@/components/CycleSelector';
import { FilterBottomSheet } from '@/components/FilterBottomSheet';
import { PaginationBar } from '@/components/PaginationBar';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ArrowRight,
  Pencil,
  Wallet,
  Building2,
  Smartphone,
  Coins,
  Filter,
  Scale,
  PiggyBank,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  Smartphone,
  Coins,
  Wallet,
};

export interface WalletTxItem {
  id: string;
  name: string;
  amount: number;
  type: string;
  transactionDate: string;
  createdAt?: Date | string;
  note?: string | null;
  categoryId?: string | null;
  category?: { id?: string; name: string; color?: string | null; icon?: string | null } | null;
  accountId?: string | null;
  account?: { id: string; name: string; type: string } | null;
  toAccountId?: string | null;
  toAccount?: { id: string; name: string; type: string } | null;
}

interface WalletHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: AccountWithBalance | null;
  allAccounts: AccountWithBalance[];
  transactions: WalletTxItem[];
  categories?: Array<{ id: string; name: string; type: string }>;
  cycles?: CycleOption[];
  initialCycleOffset?: number | 'all';
  onEditAccount?: (account: AccountWithBalance) => void;
}

export function WalletHistoryModal({
  open,
  onOpenChange,
  account,
  allAccounts,
  transactions,
  categories = [],
  cycles = [],
  initialCycleOffset = 'all',
  onEditAccount,
}: WalletHistoryModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [selectedCycle, setSelectedCycle] = useState<string>(
    initialCycleOffset === 'all' ? 'all' : String(initialCycleOffset)
  );
  const [directionFilter, setDirectionFilter] = useState<'all' | 'out' | 'in' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showReconcile, setShowReconcile] = useState<boolean>(false);
  const [actualBalanceInput, setActualBalanceInput] = useState<string>('');

  // Compute chronological running balance across all transactions for this account
  const ledgerWithRunningBalance = useMemo(() => {
    if (!account) return [];

    // Filter transactions involving this account
    const accountTxs = transactions.filter(
      tx => tx.accountId === account.id || (tx.type === 'transfer' && tx.toAccountId === account.id)
    );

    // Sort oldest -> newest to compute exact running balance step by step
    const chronological = [...accountTxs].sort((a, b) => {
      if (a.transactionDate !== b.transactionDate) {
        return a.transactionDate.localeCompare(b.transactionDate);
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    let running = account.initialBalance || 0;

    const mapped = chronological.map(tx => {
      const balanceBefore = running;
      let delta = 0;
      let mutationType: 'in' | 'out' = 'out';
      let subtitle = tx.category?.name || 'Umum';

      const fromAccName =
        tx.account?.name || allAccounts.find(a => a.id === tx.accountId)?.name || 'Dompet';
      const toAccName =
        tx.toAccount?.name || allAccounts.find(a => a.id === tx.toAccountId)?.name || 'Dompet';

      if (tx.type === 'transfer') {
        const isSavings = !tx.toAccountId || tx.category?.name === 'Tabungan' || tx.name.startsWith('Setor Tabungan');
        if (tx.accountId === account.id) {
          delta = -tx.amount;
          mutationType = 'out';
          subtitle = isSavings ? 'Setor ke Tabungan' : `Keluar ke ${toAccName}`;
        } else if (tx.toAccountId === account.id) {
          delta = tx.amount;
          mutationType = 'in';
          subtitle = `Masuk dari ${fromAccName}`;
        }
      } else if (tx.type === 'income') {
        delta = tx.amount;
        mutationType = 'in';
        subtitle = tx.category?.name || 'Pemasukan';
      } else {
        delta = -tx.amount;
        mutationType = 'out';
        subtitle = tx.category?.name || 'Pengeluaran';
      }

      const balanceAfter = balanceBefore + delta;
      running = balanceAfter;

      return {
        ...tx,
        delta,
        mutationType,
        subtitle,
        balanceBefore,
        balanceAfter,
      };
    });

    // Return newest first for display
    return mapped.reverse();
  }, [account, transactions, allAccounts]);

  // Apply user filters (cycle, direction, category, search)
  const filteredLedger = useMemo(() => {
    const activeCycleObj =
      selectedCycle !== 'all'
        ? cycles.find(c => String(c.offset) === selectedCycle)
        : undefined;

    return ledgerWithRunningBalance.filter(item => {
      if (activeCycleObj) {
        if (
          item.transactionDate < activeCycleObj.startDateStr ||
          item.transactionDate > activeCycleObj.endDateStr
        ) {
          return false;
        }
      }

      if (directionFilter === 'out' && item.delta >= 0) return false;
      if (directionFilter === 'in' && item.delta <= 0) return false;
      if (directionFilter === 'transfer' && item.type !== 'transfer') return false;

      if (categoryFilter !== 'all') {
        if (item.categoryId !== categoryFilter && item.category?.name !== categoryFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSub = item.subtitle.toLowerCase().includes(q);
        const matchNote = (item.note || '').toLowerCase().includes(q);
        if (!matchName && !matchSub && !matchNote) return false;
      }

      return true;
    });
  }, [ledgerWithRunningBalance, selectedCycle, cycles, directionFilter, categoryFilter, searchQuery]);

  const filteredSummary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const item of filteredLedger) {
      if (item.delta > 0) totalIn += item.delta;
      else if (item.delta < 0) totalOut += Math.abs(item.delta);
    }
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [filteredLedger]);

  // Unique categories present in this wallet's transactions
  const availableCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    const map = new Map<string, string>();
    ledgerWithRunningBalance.forEach(item => {
      if (item.category?.name) {
        map.set(item.categoryId || item.category.name, item.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name, type: 'expense' }));
  }, [categories, ledgerWithRunningBalance]);

  if (!account) return null;

  const Icon =
    ICON_MAP[account.icon || 'Wallet'] ||
    (account.type === 'bank' ? Building2 : account.type === 'ewallet' ? Smartphone : Coins);
  const accentColor = account.color || '#2563eb';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-stone-100 dark:border-zinc-800 bg-stone-50/60 dark:bg-zinc-900/60">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2 truncate">
                  <span>Riwayat Saldo {account.name}</span>
                  {account.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      Utama
                    </span>
                  )}
                </DialogTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Mutasi lengkap uang masuk (+), pengeluaran (-), tarik tunai & perubahan saldo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowReconcile(v => !v);
                  if (!showReconcile) {
                    setActualBalanceInput(String(Math.max(0, account.balance)));
                  }
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors touch-manipulation',
                  showReconcile
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                    : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-stone-100'
                )}
                title="Sesuaikan saldo aplikasi dengan uang nyata di dompet/ATM"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Sesuaikan Saldo</span>
              </button>

              {onEditAccount && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onEditAccount(account);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* 1-Click Balance Reconciliation Drawer ("Sesuaikan Saldo Nyata") */}
          {showReconcile && (
            <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-2.5 text-xs animate-in fade-in-50">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">
                    Opname / Sesuaikan Saldo Nyata {account.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Ketik jumlah uang nyata yang ada di {account.name} saat ini, sistem akan otomatis mencatat selisihnya.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    Rp
                  </span>
                  <input
                    value={
                      actualBalanceInput
                        ? Number(actualBalanceInput.replace(/[^0-9]/g, '')).toLocaleString('id-ID')
                        : ''
                    }
                    onChange={e => setActualBalanceInput(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    placeholder="Ketik saldo nyata..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 font-bold text-sm text-zinc-900 dark:text-white tabular-nums focus:outline-none"
                  />
                </div>

                {(() => {
                  const targetBal = parseInt(actualBalanceInput.replace(/[^0-9]/g, '') || '0', 10);
                  const diff = targetBal - account.balance;
                  return (
                    <button
                      type="button"
                      disabled={isPending || diff === 0}
                      onClick={() => {
                        if (diff === 0) return;
                        startTransition(async () => {
                          const isIncome = diff > 0;
                          const matchedCat =
                            categories.find(
                              c =>
                                c.type === (isIncome ? 'income' : 'expense') &&
                                (c.name.toLowerCase().includes('lain') || c.name.toLowerCase().includes('umum'))
                            ) || categories.find(c => c.type === (isIncome ? 'income' : 'expense'));

                          const res = await createTransaction({
                            type: isIncome ? 'income' : 'expense',
                            name: `Penyesuaian Saldo: ${account.name}`,
                            categoryId: matchedCat?.id || null,
                            accountId: account.id,
                            amount: Math.abs(diff),
                            transactionDate: toDateString(new Date()),
                            note: `Penyesuaian saldo dari ${formatCurrency(account.balance)} menjadi ${formatCurrency(targetBal)}`,
                          });

                          if (res.success) {
                            toast({
                              title: 'Saldo Dompet Berhasil Disesuaikan! ✓',
                              description: `${account.name} kini ${formatCurrency(targetBal)} (${diff > 0 ? '+' : '-'}${formatCurrency(Math.abs(diff))})`,
                            });
                            setShowReconcile(false);
                            router.refresh();
                          } else {
                            toast({
                              title: res.error || 'Gagal menyesuaikan saldo',
                              variant: 'destructive',
                            });
                          }
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs disabled:opacity-40 active:scale-95 transition-all touch-manipulation whitespace-nowrap"
                    >
                      {isPending
                        ? 'Menyimpan...'
                        : diff === 0
                        ? 'Saldo Sudah Sama'
                        : `Sesuaikan (${diff > 0 ? '+' : '-'}${formatCurrency(Math.abs(diff))})`}
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 4 Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            <div className="bg-white dark:bg-zinc-800/90 rounded-xl p-2.5 border border-stone-200/70 dark:border-zinc-700/70">
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 block">
                Saldo Awal
              </span>
              <span className="font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 tabular-nums">
                {formatCurrency(account.initialBalance || 0)}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-800/90 rounded-xl p-2.5 border border-stone-200/70 dark:border-zinc-700/70">
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 block">
                Total Masuk (+)
              </span>
              <span className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatCurrency(filteredSummary.totalIn)}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-800/90 rounded-xl p-2.5 border border-stone-200/70 dark:border-zinc-700/70">
              <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 block">
                Total Berkurang (-)
              </span>
              <span className="font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400 tabular-nums">
                -{formatCurrency(filteredSummary.totalOut)}
              </span>
            </div>

            <div className="bg-zinc-900 dark:bg-white rounded-xl p-2.5 text-white dark:text-zinc-900">
              <span className="text-[10px] font-medium opacity-75 block">
                Saldo Saat Ini
              </span>
              <span className="font-extrabold text-xs sm:text-sm tabular-nums">
                {formatCurrency(account.balance)}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Bar (Bottom Sheet Mobile-First, No Native Select) */}
        <div className="p-3.5 sm:px-5 border-b border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <FilterBottomSheet
            searchQuery={searchQuery}
            onSearchChange={q => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
            searchPlaceholder={`Cari transaksi di ${account.name}...`}
            filterType={directionFilter}
            onFilterTypeChange={t => {
              setDirectionFilter(t);
              setCurrentPage(1);
            }}
            typeOptions={[
              { id: 'all', label: 'Semua' },
              { id: 'out', label: 'Berkurang', icon: 'out' },
              { id: 'in', label: 'Bertambah', icon: 'in' },
              { id: 'transfer', label: 'Transfer', icon: 'transfer' },
            ]}
            categories={availableCategories}
            filterCategory={categoryFilter}
            onFilterCategoryChange={c => {
              setCategoryFilter(c);
              setCurrentPage(1);
            }}
            cycles={cycles}
            filterCycle={selectedCycle}
            onFilterCycleChange={cyc => {
              setSelectedCycle(cyc);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Scrollable Mutation List (Paginated per 10 items by default) */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-zinc-800/80 p-2 sm:p-3">
          {filteredLedger.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Filter className="w-7 h-7 text-zinc-300 dark:text-zinc-600 mx-auto" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Belum ada riwayat mutasi saldo untuk filter ini
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Semua transaksi pemasukan, pengeluaran, dan tarik tunai pada {account.name} akan tercatat di sini.
              </p>
            </div>
          ) : (
            filteredLedger
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map(item => {
              const isOut = item.delta < 0;
              const isTransfer = item.type === 'transfer';

              const isSavings = item.subtitle === 'Setor ke Tabungan';

              return (
                <div
                  key={item.id}
                  className="p-3 sm:px-3.5 rounded-xl hover:bg-stone-50/80 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                        isSavings
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : isOut
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {isSavings ? (
                        <PiggyBank className="w-4 h-4" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="w-4 h-4" />
                      ) : isOut ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span
                          className={cn(
                            'font-medium px-1.5 py-0.5 rounded text-[10px]',
                            isTransfer
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                              : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                          )}
                        >
                          {item.subtitle}
                        </span>
                        <span>·</span>
                        <span>{formatDateShort(item.transactionDate)}</span>
                        {item.note && item.note !== item.name && (
                          <span className="italic text-zinc-400 truncate max-w-[160px]">
                            · {item.note}
                          </span>
                        )}
                      </div>

                      {/* Running Balance Step ("history saldo2 kurangnya") */}
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100/80 dark:bg-zinc-800/80 text-[10.5px] tabular-nums text-zinc-500 dark:text-zinc-400">
                        <span>Saldo: {formatCurrency(item.balanceBefore)}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-400" />
                        <strong
                          className={cn(
                            'font-bold',
                            isOut
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          {formatCurrency(item.balanceAfter)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Amount Delta */}
                  <div className="text-right flex-shrink-0">
                    <span
                      className={cn(
                        'font-extrabold text-xs sm:text-sm tabular-nums block',
                        isOut
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {isOut ? '-' : '+'}
                      {formatCurrency(Math.abs(item.delta))}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {isOut ? 'Saldo Berkurang' : 'Saldo Masuk'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Pagination Footer */}
        <PaginationBar
          currentPage={currentPage}
          totalItems={filteredLedger.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
          itemLabel="mutasi"
        />
      </DialogContent>
    </Dialog>
  );
}
