import { formatCurrency } from '@/lib/currency';
import { formatDateShort } from '@/lib/dates';
import { Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car, ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Home, UtensilsCrossed, CreditCard, Music, ShoppingBag, Car, ShoppingCart, FileText, Heart, MoreHorizontal, TrendingUp, Banknote, Gift, Laptop,
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
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500 text-sm font-medium">Belum ada transaksi</p>
        <p className="text-gray-400 text-xs mt-1">Yuk mulai catat pengeluaran pertamamu.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
      {transactions.map((tx) => {
        const iconName = tx.category?.icon || 'MoreHorizontal';
        const Icon = ICON_MAP[iconName] || MoreHorizontal;
        const color = tx.category?.color || '#94a3b8';
        const isIncome = tx.type === 'income';

        return (
          <div key={tx.id} className="flex items-center gap-3 p-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{tx.name}</p>
              <p className="text-xs text-gray-400">{tx.category?.name} · {formatDateShort(tx.transactionDate)}</p>
            </div>
            <div className={cn('text-sm font-semibold', isIncome ? 'text-green-600' : 'text-gray-900')}>
              {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
