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
  ArrowUpRight,
  ArrowDownLeft,
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
      <div className="bg-white rounded-[26px] p-8 shadow-sm border border-gray-100 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
          <MoreHorizontal className="w-6 h-6" />
        </div>
        <p className="text-gray-700 text-sm font-bold">Belum Ada Transaksi</p>
        <p className="text-gray-400 text-xs mt-1">Tekan tombol (+) di bawah untuk mencatat pengeluaran pertamamu.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[26px] shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
      {transactions.map((tx) => {
        const iconName = tx.category?.icon || 'MoreHorizontal';
        const Icon = ICON_MAP[iconName] || MoreHorizontal;
        const color = tx.category?.color || '#2563eb';
        const isIncome = tx.type === 'income';

        return (
          <Link
            key={tx.id}
            href="/transactions"
            className="flex items-center gap-3.5 p-4 hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: `${color}18` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{tx.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-400 truncate">{tx.category?.name || 'Umum'}</span>
                <span className="text-[10px] text-gray-300">•</span>
                <span className="text-[11px] text-gray-400">{formatDateShort(tx.transactionDate)}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0 pl-2">
              <p className={cn('text-sm font-extrabold flex items-center justify-end gap-0.5', isIncome ? 'text-emerald-600' : 'text-gray-900')}>
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {isIncome ? 'Pemasukan' : 'Pengeluaran'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
