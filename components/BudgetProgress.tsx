import { formatCurrency } from '@/lib/currency';
import { getBudgetColor } from '@/lib/calculations';
import { cn } from '@/lib/utils';

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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500 text-sm">Belum ada budget</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
      {budgets.map((budget) => {
        const pct = Math.min(budget.percentage, 100);
        const barColor = budget.percentage < 70
          ? 'bg-green-500'
          : budget.percentage <= 90
          ? 'bg-yellow-500'
          : 'bg-red-500';

        return (
          <div key={budget.id} className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-800">
                {budget.category?.name || 'Kategori'}
              </span>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(budget.spent)}</span>
                <span className="text-xs text-gray-400"> / {formatCurrency(budget.amount)}</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
              <div
                className={cn('h-2 rounded-full transition-all', barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className={cn('text-xs font-medium',
                budget.percentage < 70 ? 'text-green-600' :
                budget.percentage <= 90 ? 'text-yellow-600' : 'text-red-600'
              )}>{budget.percentage}%</span>
              <span className={cn('text-xs', budget.remaining >= 0 ? 'text-gray-400' : 'text-red-500')}>
                {budget.remaining >= 0 ? `Sisa ${formatCurrency(budget.remaining)}` : `Lebih ${formatCurrency(Math.abs(budget.remaining))}`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
