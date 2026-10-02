import { formatCurrency } from '@/lib/currency';
import { formatDateShort } from '@/lib/dates';
import {
  Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car,
  ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ICON_MAP: Record<string, React.ElementType> = {
  Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car,
  ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop,
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
      <div className="
        bg-white dark:bg-[#1c1c1e]
        rounded-2xl
        border border-zinc-200/80 dark:border-zinc-700/50
        p-8 text-center space-y-3
        shadow-[0_1px_4px_rgba(0,0,0,0.03)]
        transition-colors
      ">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
          <MoreHorizontal className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="font-semibold text-[15px] text-zinc-900 dark:text-white">Belum Ada Transaksi</p>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-1">Mulai catat transaksi untuk melacak arus kas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="
      bg-white dark:bg-[#1c1c1e]
      rounded-2xl
      border border-zinc-200/80 dark:border-zinc-700/50
      shadow-[0_1px_4px_rgba(0,0,0,0.03)]
      dark:shadow-[0_1px_4px_rgba(0,0,0,0.20)]
      divide-y divide-zinc-100 dark:divide-zinc-800/80
      overflow-hidden
      transition-colors
    ">
      {transactions.map((tx) => {
        const isIncome = tx.type === 'income';
        const iconName = tx.category?.icon || 'MoreHorizontal';
        const Icon = ICON_MAP[iconName] || MoreHorizontal;

        return (
          <Link
            key={tx.id}
            href="/transactions"
            className="
              flex items-center justify-between gap-3
              px-4 sm:px-5 py-3.5
              hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30
              active:bg-zinc-100/60 dark:active:bg-zinc-800/50
              transition-colors group
            "
          >
            {/* Icon + details */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-active:scale-95',
                  isIncome
                    ? 'bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                )}
              >
                <Icon className="w-[15px] h-[15px]" strokeWidth={1.9} />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-[13.5px] text-zinc-900 dark:text-white truncate leading-tight">
                  {tx.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
                    {tx.category?.name || 'Umum'}
                  </span>
                  <span className="text-zinc-200 dark:text-zinc-700 text-[10px]">·</span>
                  <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
                    {formatDateShort(tx.transactionDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
              <p
                className={cn(
                  'font-bold text-[14px] tabular-nums leading-tight',
                  isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-900 dark:text-white'
                )}
              >
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium">
                {isIncome ? 'Masuk' : 'Keluar'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
