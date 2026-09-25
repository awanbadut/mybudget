'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface SavingsChartClientProps {
  data: { label: string; amount: number; monthly: number }[];
}

export function SavingsChartClient({ data }: SavingsChartClientProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 truncate">
          Perkembangan Tabungan
        </h3>
        <span className="text-[11px] sm:text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-2.5 py-0.5 rounded-full flex-shrink-0">
          6 Bulan Terakhir
        </span>
      </div>

      <div className="h-[200px] sm:h-[210px] w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#71717A' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="bg-zinc-900 text-white p-2.5 text-xs rounded-xl shadow-lg border border-zinc-800">
                      <p className="font-medium text-stone-300">{item.payload.label}</p>
                      <p className="font-semibold text-emerald-400 mt-0.5">{formatCurrency(Number(item.value))}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} name="Kumulatif" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
