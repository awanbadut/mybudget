'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface SavingsChartClientProps {
  data: { label: string; amount: number; monthly: number }[];
}

export function SavingsChartClient({ data }: SavingsChartClientProps) {
  return (
    <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 sm:p-5 shadow-[3px_3px_0px_#24201D]">
      <div className="border-b border-[#24201D]/20 pb-2.5 mb-3 flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold text-[#24201D] uppercase tracking-wider">
          Perkembangan Tabungan
        </h3>
        <span className="font-mono text-xs font-bold text-[#2A7B88] uppercase">
          6 Bulan Terakhir
        </span>
      </div>

      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="2 2" stroke="#24201D" strokeOpacity={0.12} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#706860' }} />
            <YAxis tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#706860' }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="bg-[#24201D] text-[#F4F0EA] p-2 text-xs font-mono border border-[#F4F0EA]/20 shadow-md">
                      <p className="font-bold uppercase">{item.payload.label}</p>
                      <p className="text-[#2A7B88] font-bold">{formatCurrency(Number(item.value))}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="amount" fill="#2A7B88" stroke="#24201D" strokeWidth={1} name="Kumulatif" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
