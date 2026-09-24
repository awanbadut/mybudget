import { getDaysInMonth, getDate, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DailyBudgetProps {
  month: number;
  year: number;
  foodBudgetTotal: number;
  foodSpent: number;
}

export function DailyBudget({ month, year, foodBudgetTotal, foodSpent }: DailyBudgetProps) {
  const today = new Date();
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const currentDay = today.getFullYear() === year && today.getMonth() + 1 === month
    ? getDate(today)
    : daysInMonth;
  const daysRemaining = daysInMonth - currentDay + 1;
  const budgetRemaining = foodBudgetTotal - foodSpent;
  const dailyTarget = foodBudgetTotal > 0 ? Math.round(foodBudgetTotal / daysInMonth) : 0;
  const dailyActual = currentDay > 0 ? Math.round(foodSpent / currentDay) : 0;
  const isOverBudget = dailyActual > dailyTarget && dailyTarget > 0;

  if (foodBudgetTotal === 0) return null;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Budget Makan Harian</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400">Budget Total</p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(foodBudgetTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Terpakai</p>
          <p className="text-sm font-semibold text-red-500">{formatCurrency(foodSpent)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Sisa</p>
          <p className={`text-sm font-semibold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(Math.abs(budgetRemaining))}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Hari Tersisa</p>
          <p className="text-sm font-semibold text-gray-900">{daysRemaining} hari</p>
        </div>
      </div>
      <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
        isOverBudget ? 'bg-orange-50' : 'bg-green-50'
      }`}>
        {isOverBudget ? (
          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        )}
        <p className={isOverBudget ? 'text-orange-700' : 'text-green-700'}>
          {isOverBudget
            ? `Rata-rata makanmu ${formatCurrency(dailyActual)}/hari, sedikit di atas target ${formatCurrency(dailyTarget)}.`
            : `Target ${formatCurrency(dailyTarget)}/hari · Kamu masih dalam budget makan.`
          }
        </p>
      </div>
    </div>
  );
}
