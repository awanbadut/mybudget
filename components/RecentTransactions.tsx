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
      <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-6 sm:p-8 text-center space-y-2 shadow-[3px_3px_0px_#24201D]">
        <div className="w-9 h-9 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] flex items-center justify-center mx-auto">
          <MoreHorizontal className="w-5 h-5" />
        </div>
        <p className="font-display font-bold text-lg text-[#24201D] uppercase">Belum Ada Transaksi Tercatat</p>
        <p className="font-sans text-xs text-[#706860]">Mulai catat transaksi pertamamu untuk melacak buku kas.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] border-2 border-[#24201D] shadow-[3px_3px_0px_#24201D] divide-y divide-[#24201D]/20 overflow-hidden">
      {/* Table Head */}
      <div className="p-3 bg-[#EDE6DC] flex items-center justify-between font-mono text-xs border-b border-[#24201D]">
        <span className="font-bold text-[#24201D] uppercase tracking-wider">Entri Buku Kas</span>
        <span className="font-bold text-[#706860] uppercase tracking-wider">Nominal Rupiah</span>
      </div>

      {transactions.map((tx) => {
        const isIncome = tx.type === 'income';

        return (
          <Link
            key={tx.id}
            href="/transactions"
            className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-[#EDE6DC]/60 active:bg-[#EDE6DC] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="font-display font-bold text-base sm:text-lg text-[#24201D] uppercase truncate leading-tight">
                  {tx.name}
                </p>
                <span className="font-mono text-[10px] uppercase px-1.5 py-0.2 bg-[#EDE6DC] border border-[#24201D]/25 text-[#706860]">
                  {tx.category?.name || 'Umum'}
                </span>
              </div>
              <p className="font-mono text-xs text-[#706860] mt-0.5">
                {formatDateShort(tx.transactionDate)}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className={cn(
                'font-mono font-bold text-sm sm:text-base tabular-nums',
                isIncome ? 'text-[#2A7B88]' : 'text-[#24201D]'
              )}>
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              <span className={cn(
                'font-mono text-[10px] font-bold uppercase tracking-wider',
                isIncome ? 'text-[#2A7B88]' : 'text-[#706860]'
              )}>
                {isIncome ? 'MASUK' : 'KELUAR'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
