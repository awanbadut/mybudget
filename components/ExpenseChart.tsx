'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/currency';

const COLORS = [
  '#3b82f6', // Blue 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#8b5cf6', // Violet 500
  '#ec4899', // Pink 500
  '#06b6d4', // Cyan 500
  '#f97316', // Orange 500
  '#64748b', // Slate 500
];

interface ExpenseChartProps {
  data: Record<string, number>;
  total: number;
}

export function ExpenseChart({ data, total }: ExpenseChartProps) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] w-full min-w-0 transition-colors">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mb-3">
          Pengeluaran per Kategori
        </h3>
        <div className="flex items-center justify-center h-44 text-zinc-400 dark:text-zinc-500 text-xs">
          Belum ada catatan pengeluaran bulan ini
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 w-full min-w-0 overflow-hidden transition-colors">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
          Pengeluaran per Kategori
        </h3>
        <span className="text-[11px] sm:text-xs font-semibold text-zinc-900 dark:text-white tabular-nums bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full flex-shrink-0">
          Total: {formatCurrency(total)}
        </span>
      </div>

      <div className="h-[200px] sm:h-[210px] w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={74}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="bg-zinc-900 dark:bg-zinc-800 text-white p-2.5 text-xs rounded-xl shadow-lg border border-zinc-800 dark:border-zinc-700">
                      <p className="font-medium">{item.name}</p>
                      <p className="font-semibold text-stone-200 dark:text-zinc-200 mt-0.5">{formatCurrency(Number(item.value))}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-zinc-800 min-w-0">
        {chartData.slice(0, 5).map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-xs gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-zinc-600 dark:text-zinc-300 truncate">{item.name}</span>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(item.value)}</span>
              <span className="text-zinc-400 dark:text-zinc-500 ml-1">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
