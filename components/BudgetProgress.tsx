import { formatCurrency } from '@/lib/currency';
import {
  House, ForkKnife, CreditCard, MusicNotes, Bag, Car,
  ShoppingCart, FileText, Heart, DotsThree, ChartPie,
} from '@phosphor-icons/react/dist/ssr';
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors">
        <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
          <ChartPie size={20} weight="regular" />
        </div>
        <div>
          <p className="font-semibold text-[14px] text-zinc-900 dark:text-white">Belum ada anggaran</p>
          <p className="text-[12.5px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto leading-snug">
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
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
      {budgets.map((budget, index) => {
        const pct = Math.min(budget.percentage, 100);
        const iconName = budget.category?.icon || 'MoreHorizontal';
        const Icon = ICON_MAP[iconName] || DotsThree;

        // Fixed threshold: 100% = success, >100% = over, 75-99% = warning, <75% = safe
        const isExact   = budget.percentage === 100;
        const isOver    = budget.percentage > 100;
        const isWarning = budget.percentage >= 75 && budget.percentage < 100;

        // Solid colors — no pastel opacity variants
        const barColor    = isOver ? 'bg-red-600' : isExact ? 'bg-green-600' : isWarning ? 'bg-amber-500' : 'bg-green-600';
        const statusText  = isOver ? `Melebihi ${budget.percentage - 100}%` : isExact ? 'Tepat target' : `${budget.percentage}% terpakai`;
        const statusColor = isOver
          ? 'text-red-600 dark:text-red-500'
          : isExact
          ? 'text-green-600 dark:text-green-500'
          : isWarning
          ? 'text-amber-600 dark:text-amber-500'
          : 'text-green-600 dark:text-green-500';

        const isLast = index === budgets.length - 1;

        return (
          <div
            key={budget.id}
            className={cn(
              'px-4 sm:px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors',
              !isLast && 'border-b border-zinc-100 dark:border-zinc-800'
            )}
          >
            {/* Row 1: icon + name + amounts */}
            <div className="flex justify-between items-center gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} weight="regular" />
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
            <div className="w-full h-[4px] bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div
                className={cn('h-full rounded-full transition-all duration-500', barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Row 3: status + remaining */}
            <div className="flex justify-between items-center">
              <span className={cn('text-[11px] font-semibold', statusColor)}>
                {statusText}
              </span>
              <span className={cn(
                'text-[11px] tabular-nums',
                budget.remaining >= 0 ? 'text-zinc-400 dark:text-zinc-500' : 'text-red-600 dark:text-red-500 font-semibold'
              )}>
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
