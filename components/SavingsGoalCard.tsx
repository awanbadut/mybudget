import { formatCurrency } from '@/lib/currency';
import { calculateProgress } from '@/lib/calculations';
import { Target } from 'lucide-react';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

export function SavingsGoalCard({ goal }: { goal: SavingsGoal }) {
  const progress = calculateProgress(goal.currentAmount, goal.targetAmount);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{goal.name}</h4>
          {goal.deadline && <p className="text-xs text-gray-400">Target: 1 tahun</p>}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{formatCurrency(goal.currentAmount)}</span>
          <span className="font-medium text-gray-900">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 text-right">{progress}% tercapai</p>
      </div>
    </div>
  );
}
