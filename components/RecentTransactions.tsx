import { formatCurrency } from '@/lib/currency';
import { formatDateShort } from '@/lib/dates';
import {
  Home,
  UtensilsCrossed,
  CreditCard,
  Music,
  ShoppingBag,
  Car,
  ShoppingCart,
  FileText,
  Heart,
  MoreHorizontal,
  TrendingUp,
  Banknote,
  Gift,
  Laptop,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  UtensilsCrossed,
  CreditCard,
  Music,
  ShoppingBag,
  Car,
  ShoppingCart,
  FileText,
  Heart,
  MoreHorizontal,
  TrendingUp,
  Banknote,
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
      <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="w-10 h-10 rounded-xl bg-stone-100 text-zinc-400 flex items-center justify-center mx-auto">
          <MoreHorizontal className="w-5 h-5" />
        </div>
        <p className="font-semibold text-sm text-zinc-900">Belum Ada Transaksi Tercatat</p>
        <p className="text-xs text-zinc-500">Mulai catat transaksi pertamamu untuk melacak arus kas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] divide-y divide-stone-100 overflow-hidden">
      {transactions.map((tx) => {
        const isIncome = tx.type === 'income';
        const iconName = tx.category?.icon || 'MoreHorizontal';
        const Icon = ICON_MAP[iconName] || MoreHorizontal;

        return (
          <Link
            key={tx.id}
            href="/transactions"
            className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50/70 active:bg-stone-100/70 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-zinc-700'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-sm text-zinc-900 truncate">
                  {tx.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-zinc-500">
                    {tx.category?.name || 'Umum'}
                  </span>
                  <span className="text-zinc-300 text-xs">·</span>
                  <span className="text-xs text-zinc-400">
                    {formatDateShort(tx.transactionDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p
                className={cn(
                  'font-sans font-semibold text-sm sm:text-base tabular-nums',
                  isIncome ? 'text-emerald-600' : 'text-zinc-900'
                )}
              >
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              <span className="text-[11px] text-zinc-400 font-medium">
                {isIncome ? 'Pemasukan' : 'Pengeluaran'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
