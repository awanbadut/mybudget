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
      <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-6 sm:p-8 text-center space-y-3 shadow-[3px_3px_0px_#24201D]">
        <div className="w-10 h-10 border border-[#24201D] bg-[#EDE6DC] text-[#24201D] flex items-center justify-center mx-auto">
          <PieChart className="w-5 h-5" />
        </div>
        <p className="font-display font-bold text-lg text-[#24201D] uppercase">
          Belum Ada Alokasi Anggaran Bulanan
        </p>
        <p className="font-sans text-xs text-[#706860] max-w-sm mx-auto">
          Tetapkan batas belanja operasional untuk mencegah overbudget.
        </p>
        <Link
          href="/budget"
          className="inline-block mt-2 font-mono text-xs font-bold text-[#F4F0EA] bg-[#D9381E] border border-[#B82C15] px-4 py-2 hover:bg-[#24201D] transition-colors shadow-[2px_2px_0px_#24201D]"
        >
          + BUAT ANGGARAN SEKARANG
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] border-2 border-[#24201D] shadow-[3px_3px_0px_#24201D] divide-y divide-[#24201D]/20 overflow-hidden">
      {/* Table Head / Header info */}
      <div className="p-3.5 bg-[#EDE6DC] flex items-center justify-between font-mono text-xs border-b border-[#24201D]">
        <span className="font-bold text-[#24201D] uppercase tracking-wider">Kategori Pengeluaran</span>
        <span className="font-bold text-[#706860] uppercase tracking-wider">Realisasi / Target</span>
      </div>

      {budgets.map((budget, index) => {
        const pct = Math.min(budget.percentage, 100);
        const iconName = budget.category?.icon || 'MoreHorizontal';
        const Icon = ICON_MAP[iconName] || MoreHorizontal;
        const isOver = budget.percentage > 90;

        return (
          <div key={budget.id} className="p-3.5 sm:p-4 hover:bg-[#EDE6DC]/50 transition-colors space-y-2">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-xs font-bold text-[#706860]">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                <span className="font-display font-bold text-base sm:text-lg text-[#24201D] uppercase truncate">
                  {budget.category?.name || 'Kategori'}
                </span>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-mono text-xs sm:text-sm font-bold text-[#24201D] tabular-nums">
                  {formatCurrency(budget.spent)}
                </span>
                <span className="font-mono text-[11px] text-[#706860] tabular-nums">
                  {' '}/ {formatCurrency(budget.amount)}
                </span>
              </div>
            </div>

            {/* Letterpress ruler progress bar */}
            <div className="w-full bg-[#E2D7C7] h-2 border border-[#24201D] p-[0.5px]">
              <div
                className={`h-full transition-all duration-300 ${
                  isOver ? 'bg-[#D9381E]' : 'bg-[#2A7B88]'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className={`font-bold ${isOver ? 'text-[#D9381E]' : 'text-[#2A7B88]'}`}>
                {budget.percentage}% TERCAPAI
              </span>
              <span className={budget.remaining >= 0 ? 'text-[#706860]' : 'text-[#D9381E] font-bold'}>
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
