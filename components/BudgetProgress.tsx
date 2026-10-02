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
      <div className="
        bg-white dark:bg-[#1c1c1e]
        rounded-2xl
        border border-zinc-200/80 dark:border-zinc-700/50
        p-8 text-center space-y-4
        shadow-[0_1px_4px_rgba(0,0,0,0.03)]
        transition-colors
      ">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
          <PieChart className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="font-semibold text-[15px] text-zinc-900 dark:text-white">
            Belum Ada Anggaran
          </p>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
            Tetapkan batas belanja per kategori untuk mengontrol pengeluaran.
          </p>
        </div>
        <Link
          href="/budget"
          className="inline-flex items-center justify-center font-semibold text-[13px] text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 px-5 py-2.5 rounded-xl transition-colors shadow-sm active:scale-95"
        >
          Buat Anggaran
        </Link>
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
      {budgets.map((budget) => {
        const pct     = Math.min(budget.percentage, 100);
        const iconName = budget.category?.icon || 'MoreHorizontal';
        const Icon    = ICON_MAP[iconName] || MoreHorizontal;
        const isOver     = budget.percentage > 90;
        const isWarning  = budget.percentage >= 70 && budget.percentage <= 90;

        const barColor = isOver
          ? 'bg-rose-500'
          : isWarning
            ? 'bg-amber-500'
            : 'bg-emerald-500';

        const statusColor = isOver
          ? 'text-rose-600 dark:text-rose-400'
          : isWarning
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-emerald-600 dark:text-emerald-400';

        return (
          <div
            key={budget.id}
            className="px-4 sm:px-5 py-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors space-y-3"
          >
            {/* Row 1: icon + name + amounts */}
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-[15px] h-[15px]" strokeWidth={1.8} />
                </div>
                <span className="font-semibold text-[13.5px] text-zinc-900 dark:text-white truncate">
                  {budget.category?.name || 'Kategori'}
                </span>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-bold text-[13.5px] text-zinc-900 dark:text-white tabular-nums">
                  {formatCurrency(budget.spent)}
                </span>
                <span className="text-[12px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                  {' '}/ {formatCurrency(budget.amount)}
                </span>
              </div>
            </div>

            {/* Row 2: progress track */}
            <div className="w-full h-[3px] bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Row 3: status */}
            <div className="flex justify-between items-center">
              <span className={cn('text-[11.5px] font-semibold', statusColor)}>
                {budget.percentage}% terpakai
              </span>
              <span
                className={cn(
                  'text-[11.5px] tabular-nums',
                  budget.remaining >= 0
                    ? 'text-zinc-400 dark:text-zinc-500'
                    : 'text-rose-600 dark:text-rose-400 font-semibold'
                )}
              >
                {budget.remaining >= 0
                  ? `Sisa ${formatCurrency(budget.remaining)}`
                  : `Lebih ${formatCurrency(Math.abs(budget.remaining))}`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
