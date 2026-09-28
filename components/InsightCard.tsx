import { Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
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
        text: `Pengeluaran ${budget.category?.name || 'kategori'} telah mencapai ${budget.percentage}% dari alokasi yang ditentukan.`,
      });
    }
    if (budget.amount > 0 && budget.percentage >= 100) {
      insights.push({
        type: 'warning',
        text: `Budget ${budget.category?.name || 'kategori'} telah melampaui batas yang direncanakan bulan ini.`,
      });
    }
    if (budget.amount > 0 && budget.percentage < 50 && budget.spent > 0) {
      insights.push({
        type: 'success',
        text: `Pengeluaran ${budget.category?.name || 'kategori'} terkendali sangat baik (di bawah 50%).`,
      });
    }
  }

  // Estimated savings insight
  const estimatedSavings = effectiveIncome > 0 ? effectiveIncome - totalExpense : totalIncome - totalExpense;
  if (effectiveIncome > 0 || totalIncome > 0) {
    insights.push({
      type: 'info',
      text: `Estimasi surplus dana yang dapat dialokasikan ke tabungan siklus ini: ${formatCurrency(Math.max(0, estimatedSavings))}.`,
    });
  }

  // Pending installments
  if (pendingInstallmentsCount > 0) {
    insights.push({
      type: 'warning',
      text: `Ada ${pendingInstallmentsCount} jadwal cicilan aktif yang perlu diperhatikan tanggal jatuh temponya.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      text: 'Catat transaksi secara rutin untuk menerima evaluasi dan insight keuangan otomatis.',
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5 transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
          Insight & Evaluasi Finansial
        </h3>
      </div>

      <div className="space-y-2">
        {insights.slice(0, 4).map((insight, i) => {
          const isWarn = insight.type === 'warning';
          const isSuccess = insight.type === 'success';

          return (
            <div
              key={i}
              className={`p-3 rounded-xl border flex gap-2.5 items-start text-xs ${
                isWarn
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
                  : isSuccess
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                  : 'bg-stone-50/80 dark:bg-zinc-800/50 border-stone-200/70 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isWarn ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                )}
              </div>
              <p className="leading-relaxed">
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
