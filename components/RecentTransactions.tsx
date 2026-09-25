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
      <div className="bg-white rounded-3xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-zinc-200/90 text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
          <MoreHorizontal className="w-5 h-5" />
        </div>
        <p className="text-zinc-800 text-sm font-bold">Belum Ada Transaksi</p>
        <p className="text-zinc-400 text-xs">Tekan tombol (+) di bawah untuk mencatat pengeluaran pertamamu.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-zinc-200/90 divide-y divide-zinc-100 overflow-hidden">
      {transactions.map((tx) => {
        const iconName = tx.category?.icon || 'MoreHorizontal';
        const Icon = ICON_MAP[iconName] || MoreHorizontal;
        const isIncome = tx.type === 'income';

        return (
          <Link
            key={tx.id}
            href="/transactions"
            className="flex items-center gap-3.5 p-3.5 sm:p-4 hover:bg-zinc-50/70 active:bg-zinc-100/70 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/70 text-zinc-700 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate leading-snug">{tx.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[11px] text-zinc-400">
                <span className="truncate">{tx.category?.name || 'Umum'}</span>
                <span>•</span>
                <span>{formatDateShort(tx.transactionDate)}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0 pl-2">
              <p className={cn('text-sm font-bold font-mono tabular-nums', isIncome ? 'text-emerald-600' : 'text-zinc-900')}>
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {isIncome ? 'Masuk' : 'Keluar'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
