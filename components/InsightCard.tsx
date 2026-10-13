import { formatCurrency } from '@/lib/currency';
import { Sparkle, WarningCircle, CheckCircle, Info } from '@phosphor-icons/react/dist/ssr';

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

  for (const budget of budgets) {
    if (budget.amount > 0 && budget.percentage === 100) {
      insights.push({
        type: 'success',
        text: `Pengeluaran ${budget.category?.name || 'kategori'} tepat sesuai alokasi — pas dengan rencana.`,
      });
    } else if (budget.amount > 0 && budget.percentage > 100) {
      insights.push({
        type: 'warning',
        text: `Pengeluaran ${budget.category?.name || 'kategori'} melebihi alokasi (${budget.percentage}%) — perlu diperhatikan bulan depan.`,
      });
    } else if (budget.amount > 0 && budget.percentage >= 80 && budget.percentage < 100) {
      insights.push({
        type: 'warning',
        text: `Pengeluaran ${budget.category?.name || 'kategori'} mendekati batas (${budget.percentage}%) — sisakan ruang untuk sisa siklus.`,
      });
    } else if (budget.amount > 0 && budget.percentage < 50 && budget.spent > 0) {
      insights.push({
        type: 'success',
        text: `Pengeluaran ${budget.category?.name || 'kategori'} sangat terkendali (${budget.percentage}%) — bagus.`,
      });
    }
  }

  const estimatedSavings = effectiveIncome > 0 ? effectiveIncome - totalExpense : totalIncome - totalExpense;
  if (effectiveIncome > 0 || totalIncome > 0) {
    insights.push({
      type: 'info',
      text: `Estimasi surplus siklus ini: ${formatCurrency(Math.max(0, estimatedSavings))} — bisa dialokasikan ke tabungan.`,
    });
  }

  if (pendingInstallmentsCount > 0) {
    insights.push({
      type: 'warning',
      text: `Ada ${pendingInstallmentsCount} cicilan aktif yang belum lunas — cek jadwal jatuh tempo di halaman Cicilan.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      text: 'Catat transaksi secara rutin untuk mendapatkan evaluasi keuangan otomatis.',
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5 space-y-3 transition-colors">
      <div className="flex items-center gap-2.5">
        {/* Solid icon bg — tidak lagi pastel */}
        <div className="w-7 h-7 rounded-[9px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center flex-shrink-0">
          <Sparkle size={14} weight="fill" />
        </div>
        <h3 className="font-semibold text-[13.5px] text-zinc-900 dark:text-white">
          Catatan &amp; Evaluasi
        </h3>
      </div>

      <div className="space-y-2">
        {insights.slice(0, 4).map((insight, i) => {
          const isWarn = insight.type === 'warning';
          const isSuccess = insight.type === 'success';

          return (
            <div
              key={i}
              className={`flex gap-2.5 items-start p-3 rounded-xl border text-[12px] leading-relaxed ${
                isWarn
                  ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                  : isSuccess
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isWarn
                  ? <WarningCircle size={14} weight="fill" className="text-amber-600 dark:text-amber-400" />
                  : isSuccess
                  ? <CheckCircle size={14} weight="fill" className="text-green-600 dark:text-green-400" />
                  : <Info size={14} weight="fill" className="text-zinc-500 dark:text-zinc-400" />}
              </div>
              <p>{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
