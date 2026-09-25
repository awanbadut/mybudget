import { Lightbulb, AlertTriangle, Target } from 'lucide-react';
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
        text: `Pengeluaran ${budget.category?.name || 'kategori'} telah mencapai ${budget.percentage}% dari pagu alokasi.`,
      });
    }
    if (budget.amount > 0 && budget.percentage >= 100) {
      insights.push({
        type: 'warning',
        text: `Budget ${budget.category?.name || 'kategori'} telah melampaui batas yang direncanakan.`,
      });
    }
    if (budget.amount > 0 && budget.percentage < 50 && budget.spent > 0) {
      insights.push({
        type: 'success',
        text: `Pengeluaran ${budget.category?.name || 'kategori'} terkendali sangat baik di bawah 50%.`,
      });
    }
  }

  // Estimated savings insight
  const estimatedSavings = effectiveIncome > 0 ? effectiveIncome - totalExpense : totalIncome - totalExpense;
  if (effectiveIncome > 0 || totalIncome > 0) {
    insights.push({
      type: 'info',
      text: `Estimasi surplus dana yang dapat disisihkan pada siklus ini: ${formatCurrency(Math.max(0, estimatedSavings))}.`,
    });
  }

  // Pending installments
  if (pendingInstallmentsCount > 0) {
    insights.push({
      type: 'warning',
      text: `Terdapat ${pendingInstallmentsCount} jadwal cicilan jatuh tempo yang perlu diselesaikan.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      text: 'Catat transaksi operasional secara berkala untuk menerima analisis disiplin anggaran.',
    });
  }

  return (
    <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 sm:p-6 shadow-[3px_3px_0px_#24201D] space-y-3">
      <div className="flex items-center gap-2 border-b border-[#24201D]/20 pb-2.5">
        <span className="font-mono text-xs font-bold text-[#D9381E] uppercase">PLANK 05</span>
        <span className="text-[#24201D]/30">/</span>
        <h3 className="font-mono text-xs font-bold text-[#24201D] uppercase tracking-wider">
          Audit & Evaluasi Finansial
        </h3>
      </div>

      <div className="space-y-2">
        {insights.slice(0, 4).map((insight, i) => {
          const isWarn = insight.type === 'warning';
          const isSuccess = insight.type === 'success';

          return (
            <div
              key={i}
              className={`p-3 border flex gap-3 items-start ${
                isWarn
                  ? 'bg-[#FBEBE8] border-[#D9381E]/40 text-[#24201D]'
                  : isSuccess
                  ? 'bg-[#EAF4F5] border-[#2A7B88]/40 text-[#24201D]'
                  : 'bg-[#EDE6DC] border-[#24201D]/20 text-[#24201D]'
              }`}
            >
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border flex-shrink-0 mt-0.5 ${
                  isWarn
                    ? 'border-[#D9381E] text-[#D9381E] bg-[#FAF7F2]'
                    : isSuccess
                    ? 'border-[#2A7B88] text-[#2A7B88] bg-[#FAF7F2]'
                    : 'border-[#24201D] text-[#24201D] bg-[#FAF7F2]'
                }`}
              >
                {isWarn ? 'PERHATIAN' : isSuccess ? 'BAGUS' : 'CATATAN'}
              </span>
              <p className="font-sans text-xs text-[#3D3834] leading-relaxed">
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
