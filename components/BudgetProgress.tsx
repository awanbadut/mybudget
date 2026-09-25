import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
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
  PieChart,
} from 'lucide-react';
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
};

interface BudgetItem {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  category: {
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
}

interface BudgetProgressProps {
  budgets: BudgetItem[];
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  if (budgets.length === 0) {
    return (
      <div className="bg-white rounded-[26px] p-8 shadow-sm border border-gray-100 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <PieChart className="w-6 h-6" />
        </div>
        <p className="text-gray-800 text-sm font-bold">Belum Ada Anggaran Bulanan</p>
        <p className="text-gray-400 text-xs">Atur limit belanja bulananmu agar pengeluaran lebih terarah.</p>
        <Link
          href="/budget"
          className="inline-block mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
        >
          + Buat Budget Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[26px] shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
      {budgets.map((budget) => {
        const pct = Math.min(budget.percentage, 100);
        const iconName = budget.category?.icon || 'MoreHorizontal';
        const Icon = ICON_MAP[iconName] || MoreHorizontal;
        const color = budget.category?.color || '#3b82f6';

        const isSafe = budget.percentage < 75;
        const isWarning = budget.percentage >= 75 && budget.percentage <= 90;
        const isDanger = budget.percentage > 90;

        const barGradient = isSafe
          ? 'from-emerald-400 to-emerald-500'
          : isWarning
          ? 'from-amber-400 to-amber-500'
          : 'from-rose-500 to-red-600';

        return (
          <div key={budget.id} className="p-4 hover:bg-gray-50/50 transition-colors space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-sm font-bold text-gray-900 truncate">
                  {budget.category?.name || 'Kategori'}
                </span>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                <span className="text-sm font-extrabold text-gray-900">
                  {formatCurrency(budget.spent)}
                </span>
                <span className="text-xs text-gray-400 font-medium"> / {formatCurrency(budget.amount)}</span>
              </div>
            </div>

            {/* Custom Smooth Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', barGradient)}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Sub labels */}
            <div className="flex justify-between items-center text-xs">
              <span
                className={cn(
                  'font-bold text-[11px] px-2 py-0.5 rounded-full',
                  isSafe ? 'bg-emerald-50 text-emerald-700' : isWarning ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                )}
              >
                {budget.percentage}% terpakai
              </span>

              <span className={cn('text-xs font-semibold', budget.remaining >= 0 ? 'text-gray-500' : 'text-rose-600')}>
                {budget.remaining >= 0 ? `Sisa ${formatCurrency(budget.remaining)}` : `Overbudget ${formatCurrency(Math.abs(budget.remaining))}`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
