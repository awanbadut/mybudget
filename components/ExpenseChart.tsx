'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/currency';

const COLORS = [
  '#24201D', // Deep iron
  '#D9381E', // Riso vermilion
  '#2A7B88', // Mineral teal
  '#276738', // Forest green
  '#706860', // Mute ink
  '#B82C15', // Deep vermilion
  '#1E5E69', // Deep teal
  '#4A433D', // Charcoal
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
      <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-5 shadow-[3px_3px_0px_#24201D]">
        <div className="border-b border-[#24201D]/20 pb-2 mb-3">
          <h3 className="font-mono text-xs font-bold text-[#24201D] uppercase tracking-wider">
            Distribusi Belanja
          </h3>
        </div>
        <div className="flex items-center justify-center h-40 text-[#706860] font-mono text-xs">
          Belum ada catatan pengeluaran
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 sm:p-5 shadow-[3px_3px_0px_#24201D]">
      <div className="border-b border-[#24201D]/20 pb-2.5 mb-3 flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold text-[#24201D] uppercase tracking-wider">
          Distribusi Belanja Kategori
        </h3>
        <span className="font-mono text-xs font-bold text-[#D9381E] tabular-nums">
          TOTAL: {formatCurrency(total)}
        </span>
      </div>

      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="#24201D"
              strokeWidth={1}
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
                    <div className="bg-[#24201D] text-[#F4F0EA] p-2 text-xs font-mono border border-[#F4F0EA]/20 shadow-md">
                      <p className="font-bold uppercase">{item.name}</p>
                      <p className="text-[#E2D7C7]">{formatCurrency(Number(item.value))}</p>
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
      <div className="space-y-1.5 mt-3 pt-3 border-t border-[#24201D]/20">
        {chartData.slice(0, 5).map((item, i) => (
          <div key={item.name} className="flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 border border-[#24201D] flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-[#3D3834] truncate">{item.name}</span>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-bold text-[#24201D] tabular-nums">{formatCurrency(item.value)}</span>
              <span className="text-[#706860] ml-1">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
