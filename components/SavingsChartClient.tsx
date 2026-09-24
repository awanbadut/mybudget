'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface SavingsChartClientProps {
  data: { label: string; amount: number; monthly: number }[];
}

export function SavingsChartClient({ data }: SavingsChartClientProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Perkembangan Tabungan</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`} />
          <Tooltip formatter={(value: number) => [formatCurrency(value), 'Tabungan']} />
          <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} name="Kumulatif" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
