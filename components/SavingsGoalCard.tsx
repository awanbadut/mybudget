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
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/70 dark:border-indigo-800/60">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight">{goal.name}</h4>
            {goal.deadline && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Target: 1 tahun</p>}
          </div>
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60">
          {progress}%
        </span>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
            Terkumpul: <strong className="text-zinc-900 dark:text-white font-semibold">{formatCurrency(goal.currentAmount)}</strong>
          </span>
          <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(goal.targetAmount)}</span>
        </div>

        <div className="w-full bg-stone-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
