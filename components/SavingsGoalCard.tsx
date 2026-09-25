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
    <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 sm:p-5 shadow-[3px_3px_0px_#24201D]">
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#24201D]/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 border border-[#24201D] bg-[#EDE6DC] flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-[#24201D]" />
          </div>
          <div>
            <h4 className="font-display font-bold text-base text-[#24201D] uppercase leading-tight">{goal.name}</h4>
            {goal.deadline && <p className="font-mono text-[10px] text-[#706860]">Target: 1 tahun</p>}
          </div>
        </div>

        <span className="font-mono text-xs font-bold text-[#2A7B88] px-2 py-0.5 bg-[#EAF4F5] border border-[#2A7B88]">
          {progress}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-[#706860] tabular-nums">Terkumpul: <strong className="text-[#24201D]">{formatCurrency(goal.currentAmount)}</strong></span>
          <span className="font-bold text-[#24201D] tabular-nums">{formatCurrency(goal.targetAmount)}</span>
        </div>

        <div className="w-full bg-[#E2D7C7] h-2.5 border border-[#24201D] p-[0.5px]">
          <div
            className="h-full bg-[#2A7B88] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
