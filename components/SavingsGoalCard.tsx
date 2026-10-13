import { formatCurrency } from '@/lib/currency';
import { calculateProgress } from '@/lib/calculations';
import { Target } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

export function SavingsGoalCard({ goal }: { goal: SavingsGoal }) {
  const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <Link href="/savings" className="block group">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3.5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99]">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[10px] bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <Target size={15} weight="fill" />
            </div>
            <h4 className="font-semibold text-[13px] text-zinc-900 dark:text-white leading-tight truncate">
              {goal.name}
            </h4>
          </div>
          <span className="flex-shrink-0 text-[11px] font-bold tabular-nums px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
            {progress}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-[5px] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[12px] font-bold text-zinc-900 dark:text-white tabular-nums">
              {formatCurrency(goal.currentAmount)}
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
              Sisa {formatCurrency(remaining)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
