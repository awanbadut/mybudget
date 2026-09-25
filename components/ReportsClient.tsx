'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { calculateSavingRate } from '@/lib/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react';

const FILTERS = [
  { label: '30 Hari', days: 30 },
  { label: '3 Bulan', days: 90 },
  { label: '6 Bulan', days: 180 },
  { label: '1 Tahun', days: 365 },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface Transaction {
  id: string;
  type: string;
  amount: number;
  transactionDate: string;
  category: { name: string; color: string | null } | null;
}

interface SavingsTransaction {
  id: string;
  amount: number;
  transactionDate: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  transactions: SavingsTransaction[];
}

export function ReportsClient({ transactions, savingsGoals }: { transactions: Transaction[]; savingsGoals: SavingsGoal[] }) {
  const [filterDays, setFilterDays] = useState(30);

  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - filterDays);
    return d.toISOString().split('T')[0];
  }, [filterDays]);

  const filtered = useMemo(() =>
    transactions.filter(t => t.transactionDate >= cutoffDate),
    [transactions, cutoffDate]
  );

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingRate = calculateSavingRate(totalIncome, savings);

  // Monthly cashflow
  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    filtered.forEach(t => {
      const [y, m] = t.transactionDate.split('-').map(Number);
      const key = `${MONTH_NAMES[m-1]} ${y}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (t.type === 'income') map[key].income += t.amount;
      else map[key].expense += t.amount;
    });
    return Object.entries(map).map(([label, data]) => ({ label, ...data, savings: data.income - data.expense }));
  }, [filtered]);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
      const name = t.category?.name || 'Lainnya';
      map[name] = (map[name] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount }));
  }, [filtered]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Analisis arus kas dan pola pengeluaran operasional
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {FILTERS.map(f => (
            <button
              key={f.days}
              onClick={() => setFilterDays(f.days)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border',
                filterDays === f.days
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border-stone-200/80 hover:bg-stone-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary 4-grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-500">Pemasukan</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-500">Pengeluaran</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-zinc-900 tabular-nums">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-500">Net Surplus</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PiggyBank className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <p className={cn('text-base sm:text-lg font-bold tabular-nums', savings >= 0 ? 'text-zinc-900' : 'text-rose-600')}>
            {formatCurrency(Math.abs(savings))}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-500">Saving Rate</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-zinc-900 tabular-nums">{savingRate}%</p>
        </div>
      </div>

      {/* Cashflow Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 space-y-4">
          <h3 className="font-semibold text-sm text-zinc-900">Perbandingan Cashflow (Pemasukan vs Pengeluaran)</h3>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ backgroundColor: '#18181B', borderRadius: '0.75rem', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Pemasukan" />
                <Bar dataKey="expense" fill="#18181B" radius={[4, 4, 0, 0]} name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expense by category */}
      {expenseByCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80 space-y-4">
          <h3 className="font-semibold text-sm text-zinc-900">Pengeluaran per Pos Belanja</h3>
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseByCategory} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#71717A' }} width={80} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                  contentStyle={{ backgroundColor: '#18181B', borderRadius: '0.75rem', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-stone-200/80">
          <p className="text-zinc-500 text-xs">Belum ada data untuk periode waktu ini.</p>
        </div>
      )}
    </div>
  );
}
