import { formatCurrency } from '@/lib/currency';
import { formatDateShort } from '@/lib/dates';
import {
  House, ForkKnife, CreditCard, MusicNotes, Bag, Car,
  ShoppingCart, FileText, Heart, DotsThree, TrendUp, Money, Gift, Laptop, ArrowsLeftRight,
} from '@phosphor-icons/react/dist/ssr';
import { PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ICON_MAP: Record<string, React.ElementType> = {
  Home: House,
  UtensilsCrossed: ForkKnife,
  CreditCard,
  Music: MusicNotes,
  ShoppingBag: Bag,
  Car,
  ShoppingCart,
  FileText,
  Heart,
  MoreHorizontal: DotsThree,
  TrendingUp: TrendUp,
  Banknote: Money,
  Gift,
  Laptop,
};

interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: string;
  transactionDate: string;
  category: {
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 text-center space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors">
        <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
          <DotsThree size={20} weight="bold" />
        </div>
        <div>
          <p className="font-semibold text-[14px] text-zinc-900 dark:text-white">Belum ada transaksi</p>
          <p className="text-[12.5px] text-zinc-400 dark:text-zinc-500 mt-1">Mulai catat transaksi untuk melacak arus kas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
      {transactions.map((tx, index) => {
        const isIncome = tx.type === 'income';
        const isTransfer = tx.type === 'transfer';
        const isSavingsTransfer = (isTransfer || tx.type === 'expense') && (
          tx.category?.name === 'Tabungan' ||
          tx.name.startsWith('Setor Tabungan')
        );
        const iconName = tx.category?.icon || 'MoreHorizontal';
        const PhosphorIcon = isTransfer ? ArrowsLeftRight : (ICON_MAP[iconName] || DotsThree);
        const isLast = index === transactions.length - 1;

        return (
          <Link
            key={tx.id}
            href="/transactions"
            className={cn(
              'flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors group',
              !isLast && 'border-b border-zinc-100 dark:border-zinc-800'
            )}
          >
            {/* Icon + details */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                'w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0',
                isSavingsTransfer
                  ? 'bg-emerald-600 text-white'
                  : isTransfer
                  ? 'bg-blue-600 text-white'
                  : isIncome
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              )}>
                {isSavingsTransfer ? (
                  <PiggyBank className="w-4 h-4" />
                ) : (
                  <PhosphorIcon size={16} weight={isTransfer || isIncome ? 'bold' : 'regular'} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13.5px] text-zinc-900 dark:text-white truncate leading-tight">
                  {tx.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    'text-[11px] truncate',
                    isSavingsTransfer ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400 dark:text-zinc-500'
                  )}>
                    {isSavingsTransfer ? 'Setor Tabungan' : isTransfer ? 'Transfer Antar Dompet' : (tx.category?.name || 'Umum')}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700 text-[9px] select-none">·</span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                    {formatDateShort(tx.transactionDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
              <p className={cn(
                'font-bold text-[14px] tabular-nums leading-tight',
                isSavingsTransfer
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isTransfer
                  ? 'text-blue-600 dark:text-blue-400'
                  : isIncome
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-zinc-900 dark:text-white'
              )}>
                {isSavingsTransfer ? '→ ' : isTransfer ? '⇄ ' : isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              <span className={cn(
                'text-[10px] font-medium block mt-0.5',
                isSavingsTransfer
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isTransfer
                  ? 'text-blue-600 dark:text-blue-400'
                  : isIncome
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-zinc-400 dark:text-zinc-500'
              )}>
                {isSavingsTransfer ? 'Tabungan' : isTransfer ? 'Transfer' : isIncome ? 'Masuk' : 'Keluar'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
