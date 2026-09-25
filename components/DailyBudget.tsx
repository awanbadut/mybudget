import { formatCurrency } from '@/lib/currency';
import { AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { getPayrollCycle } from '@/lib/dates';

interface DailyBudgetProps {
  foodBudgetTotal: number;
  foodSpent: number;
  salaryDate?: number;
}

export function DailyBudget({
  foodBudgetTotal,
  foodSpent,
  salaryDate = 25,
}: DailyBudgetProps) {
  const cycle = getPayrollCycle(salaryDate, new Date());
  const { totalDays, elapsedDays, daysRemaining, label } = cycle;

  const budgetRemaining = foodBudgetTotal - foodSpent;
  // Daily target is total food budget divided by cycle duration (e.g. Rp900,000 / 30 = Rp30,000/day)
  const dailyTarget = foodBudgetTotal > 0 ? Math.round(foodBudgetTotal / totalDays) : 0;
  
  // Safe allowance per remaining day
  const dailyAllowance = daysRemaining > 0
    ? Math.max(0, Math.round(budgetRemaining / daysRemaining))
    : 0;

  // Actual daily average spent so far
  const dailyActual = elapsedDays > 0 ? Math.round(foodSpent / elapsedDays) : 0;
  const isOverBudget = (dailyActual > dailyTarget && dailyTarget > 0) || budgetRemaining < 0;

  if (foodBudgetTotal === 0) return null;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Budget Makan Harian</h3>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Periode Gajian: <span className="font-medium text-gray-700">{label}</span>
          </p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold">
          Gajian Tgl {salaryDate}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400">Budget Total</p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(foodBudgetTotal)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{totalDays} hari siklus</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400">Terpakai</p>
          <p className="text-sm font-semibold text-red-500">{formatCurrency(foodSpent)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{elapsedDays} hari berjalan</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400">Sisa Budget</p>
          <p className={`text-sm font-semibold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(Math.abs(budgetRemaining))}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{budgetRemaining >= 0 ? 'Tersedia' : 'Overbudget'}</p>
        </div>
        <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
          <p className="text-xs text-blue-600 font-medium">Hari Tersisa</p>
          <p className="text-sm font-bold text-blue-900">{daysRemaining} hari lagi</p>
          <p className="text-[11px] text-blue-500 mt-0.5">hingga gajian tgl {salaryDate}</p>
        </div>
      </div>

      {/* Target & Allowance Recommendation */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-3 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <div>
          <span className="text-gray-500">Target Ideal: </span>
          <span className="font-semibold text-gray-900">{formatCurrency(dailyTarget)}/hari</span>
          <span className="text-gray-400"> ({formatCurrency(foodBudgetTotal)} / {totalDays} hari)</span>
        </div>
        {budgetRemaining > 0 && daysRemaining > 0 && (
          <div>
            <span className="text-blue-600">Jatah sisa hari: </span>
            <span className="font-bold text-blue-700">{formatCurrency(dailyAllowance)}/hari</span>
          </div>
        )}
      </div>

      {/* Dynamic Status Alert */}
      <div className={`flex items-start gap-2.5 p-3 rounded-xl text-sm ${
        isOverBudget ? 'bg-orange-50 border border-orange-100' : 'bg-green-50 border border-green-100'
      }`}>
        {isOverBudget ? (
          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="space-y-0.5">
          <p className={`font-medium ${isOverBudget ? 'text-orange-800' : 'text-green-800'}`}>
            {isOverBudget
              ? `Rata-rata makanmu ${formatCurrency(dailyActual)}/hari, sedikit di atas target ${formatCurrency(dailyTarget)}.`
              : `Rata-rata makanmu masih aman dalam target ${formatCurrency(dailyTarget)}/hari.`
            }
          </p>
          <p className={`text-xs ${isOverBudget ? 'text-orange-600' : 'text-green-600'}`}>
            {daysRemaining > 0
              ? `Masih ada ${daysRemaining} hari sampai gajian tanggal ${salaryDate} berikutnya. Jaga ritme pengeluaran makanmu!`
              : `Hari ini adalah tanggal gajian! Siapkan budget makan untuk siklus bulan baru.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
