'use client';
import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { calculateSavingRate } from '@/lib/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const FILTERS = [
  { label: '30 hari', days: 30 },
  { label: '3 bulan', days: 90 },
  { label: '6 bulan', days: 180 },
  { label: '1 tahun', days: 365 },
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.days}
            onClick={() => setFilterDays(f.days)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
              filterDays === f.days ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400">Pemasukan</p>
          <p className="text-base font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400">Pengeluaran</p>
          <p className="text-base font-bold text-red-500">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400">Tabungan</p>
          <p className={`text-base font-bold ${savings >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(Math.abs(savings))}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400">Saving Rate</p>
          <p className="text-base font-bold text-purple-600">{savingRate}%</p>
        </div>
      </div>

      {/* Cashflow Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Cashflow</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="Pemasukan" />
              <Bar dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]} name="Pengeluaran" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expense by category */}
      {expenseByCategory.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Pengeluaran per Kategori</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={expenseByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#6366f1" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">Belum ada data untuk periode ini.</p>
        </div>
      )}
    </div>
  );
}
