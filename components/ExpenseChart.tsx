'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/currency';

const COLORS = [
  '#18181B', // Zinc 900
  '#2563EB', // Blue 600
  '#059669', // Emerald 600
  '#D97706', // Amber 600
  '#7C3AED', // Violet 600
  '#DB2777', // Pink 600
  '#0891B2', // Cyan 600
  '#71717A', // Zinc 500
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
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] w-full min-w-0">
        <h3 className="font-semibold text-sm text-zinc-900 mb-3">
          Pengeluaran per Kategori
        </h3>
        <div className="flex items-center justify-center h-44 text-zinc-400 text-xs">
          Belum ada catatan pengeluaran bulan ini
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 truncate">
          Pengeluaran per Kategori
        </h3>
        <span className="text-[11px] sm:text-xs font-semibold text-zinc-900 tabular-nums bg-stone-100 px-2.5 py-1 rounded-full flex-shrink-0">
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
              stroke="#FFFFFF"
              strokeWidth={2}
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
                    <div className="bg-zinc-900 text-white p-2.5 text-xs rounded-xl shadow-lg border border-zinc-800">
                      <p className="font-medium">{item.name}</p>
                      <p className="font-semibold text-stone-200 mt-0.5">{formatCurrency(Number(item.value))}</p>
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
      <div className="space-y-2 pt-2 border-t border-stone-100 min-w-0">
        {chartData.slice(0, 5).map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-xs gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-zinc-600 truncate">{item.name}</span>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-semibold text-zinc-900 tabular-nums">{formatCurrency(item.value)}</span>
              <span className="text-zinc-400 ml-1">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
