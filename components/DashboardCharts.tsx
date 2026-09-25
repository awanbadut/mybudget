'use client';

import dynamic from 'next/dynamic';

const ExpenseChart = dynamic(
  () => import('@/components/ExpenseChart').then((mod) => mod.ExpenseChart),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 h-[320px] flex flex-col justify-between animate-pulse">
        <div className="h-4 w-40 bg-stone-200 rounded" />
        <div className="w-32 h-32 mx-auto rounded-full border-4 border-stone-100" />
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-stone-100 rounded" />
          <div className="h-2.5 w-3/4 bg-stone-100 rounded" />
        </div>
      </div>
    ),
  }
);

const SavingsChartClient = dynamic(
  () => import('@/components/SavingsChartClient').then((mod) => mod.SavingsChartClient),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 h-[320px] flex flex-col justify-between animate-pulse">
        <div className="h-4 w-40 bg-stone-200 rounded" />
        <div className="h-36 w-full bg-stone-100 rounded-xl" />
        <div className="h-2.5 w-28 bg-stone-100 rounded" />
      </div>
    ),
  }
);

interface DashboardChartsProps {
  expenseByCategory: Record<string, number>;
  totalExpense: number;
  savingsChartData: { label: string; amount: number; monthly: number }[];
}

export function DashboardCharts({
  expenseByCategory,
  totalExpense,
  savingsChartData,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full min-w-0 overflow-hidden">
      <div className="w-full min-w-0 overflow-hidden">
        <ExpenseChart data={expenseByCategory} total={totalExpense} />
      </div>
      <div className="w-full min-w-0 overflow-hidden">
        <SavingsChartClient data={savingsChartData} />
      </div>
    </div>
  );
}
