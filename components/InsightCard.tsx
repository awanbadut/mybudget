import { Lightbulb, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface BudgetItem {
  categoryId: string;
  amount: number;
  spent: number;
  percentage: number;
  category: { name: string } | null;
}

interface InsightCardProps {
  totalIncome: number;
  totalExpense: number;
  budgets: BudgetItem[];
  effectiveIncome: number;
  foodSpent: number;
  foodBudgetTotal: number;
  month: number;
  year: number;
  pendingInstallmentsCount: number;
}

export function InsightCard({
  totalIncome, totalExpense, budgets, effectiveIncome,
  foodSpent, foodBudgetTotal, month, year, pendingInstallmentsCount
}: InsightCardProps) {
  const insights: { type: 'info' | 'warning' | 'success'; text: string }[] = [];

  // Check budget usage insights
  for (const budget of budgets) {
    if (budget.amount > 0 && budget.percentage >= 85 && budget.percentage < 100) {
      insights.push({
        type: 'warning',
        text: `Pengeluaran ${budget.category?.name || 'kategori'} sudah mencapai ${budget.percentage}% dari budget.`,
      });
    }
    if (budget.amount > 0 && budget.percentage >= 100) {
      insights.push({
        type: 'warning',
        text: `Budget ${budget.category?.name || 'kategori'} sudah melebihi batas!`,
      });
    }
    if (budget.amount > 0 && budget.percentage < 50 && budget.spent > 0) {
      insights.push({
        type: 'success',
        text: `Pengeluaran ${budget.category?.name || 'kategori'} masih dalam batas budget. Bagus!`,
      });
    }
  }

  // Estimated savings insight
  const estimatedSavings = effectiveIncome > 0 ? effectiveIncome - totalExpense : totalIncome - totalExpense;
  if (effectiveIncome > 0 || totalIncome > 0) {
    insights.push({
      type: 'info',
      text: `Dengan pola pengeluaran saat ini, estimasi tabungan bulan ini: ${formatCurrency(Math.max(0, estimatedSavings))}.`,
    });
  }

  // Pending installments
  if (pendingInstallmentsCount > 0) {
    insights.push({
      type: 'warning',
      text: `Ada ${pendingInstallmentsCount} cicilan yang perlu dibayar bulan ini.`,
    });
  }

  // No insights case
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      text: 'Mulai tambah transaksi untuk melihat insight keuanganmu.',
    });
  }

  const iconMap = {
    info: { Icon: Lightbulb, color: 'text-blue-500', bg: 'bg-blue-50' },
    warning: { Icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
    success: { Icon: Target, color: 'text-green-500', bg: 'bg-green-50' },
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Insight Keuangan</h3>
      <div className="space-y-3">
        {insights.slice(0, 4).map((insight, i) => {
          const { Icon, color, bg } = iconMap[insight.type];
          return (
            <div key={i} className={`flex gap-3 p-3 rounded-lg ${bg}`}>
              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} />
              <p className="text-sm text-gray-700 leading-relaxed">{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
