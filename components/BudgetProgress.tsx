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
      <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="w-10 h-10 rounded-xl bg-stone-100 text-zinc-500 flex items-center justify-center mx-auto">
          <PieChart className="w-5 h-5" />
        </div>
        <p className="font-semibold text-sm text-zinc-900">
          Belum Ada Alokasi Anggaran Bulanan
        </p>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Tetapkan batas belanja operasional untuk mencegah pengeluaran berlebih.
        </p>
        <Link
          href="/budget"
          className="inline-flex items-center justify-center font-medium text-xs text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          Buat Anggaran Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] divide-y divide-stone-100 overflow-hidden">
      {budgets.map((budget) => {
        const pct = Math.min(budget.percentage, 100);
        const iconName = budget.category?.icon || 'MoreHorizontal';
        const Icon = ICON_MAP[iconName] || MoreHorizontal;
        const isOver = budget.percentage > 90;
        const isWarning = budget.percentage >= 70 && budget.percentage <= 90;

        return (
          <div key={budget.id} className="p-4 sm:p-5 hover:bg-stone-50/50 transition-colors space-y-2.5">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-stone-100 text-zinc-700 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-zinc-900 truncate">
                  {budget.category?.name || 'Kategori'}
                </span>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-semibold text-sm text-zinc-900 tabular-nums">
                  {formatCurrency(budget.spent)}
                </span>
                <span className="text-xs text-zinc-400 tabular-nums">
                  {' '}/ {formatCurrency(budget.amount)}
                </span>
              </div>
            </div>

            {/* Modern hairline progress bar */}
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className={`font-medium ${isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                {budget.percentage}% terpakai
              </span>
              <span className={budget.remaining >= 0 ? 'text-zinc-500' : 'text-rose-600 font-medium'}>
                {budget.remaining >= 0
                  ? `Sisa: ${formatCurrency(budget.remaining)}`
                  : `Lebih: ${formatCurrency(Math.abs(budget.remaining))}`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
