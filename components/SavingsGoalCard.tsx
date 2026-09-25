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
    <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/70">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-900 leading-tight">{goal.name}</h4>
            {goal.deadline && <p className="text-xs text-zinc-400 mt-0.5">Target: 1 tahun</p>}
          </div>
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/80">
          {progress}%
        </span>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500 tabular-nums">
            Terkumpul: <strong className="text-zinc-900 font-semibold">{formatCurrency(goal.currentAmount)}</strong>
          </span>
          <span className="font-semibold text-zinc-900 tabular-nums">{formatCurrency(goal.targetAmount)}</span>
        </div>

        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
