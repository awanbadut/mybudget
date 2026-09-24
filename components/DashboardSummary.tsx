import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSummaryProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  savingRate: number;
  effectiveIncome: number;
}

export function DashboardSummary({ balance, totalIncome, totalExpense, totalSavings, savingRate, effectiveIncome }: DashboardSummaryProps) {
  const cards = [
    {
      title: 'Saldo',
      value: balance,
      icon: Wallet,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: 'Pemasukan - Pengeluaran',
    },
    {
      title: 'Pemasukan',
      value: totalIncome,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      description: effectiveIncome > 0 && effectiveIncome !== totalIncome ? `Est. ${formatCurrency(effectiveIncome)}` : 'Bulan ini',
    },
    {
      title: 'Pengeluaran',
      value: totalExpense,
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-50',
      description: 'Bulan ini',
    },
    {
      title: 'Tabungan',
      value: totalSavings,
      icon: PiggyBank,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      description: savingRate > 0 ? `${savingRate}% saving rate` : 'Total tersimpan',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{card.title}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.bg)}>
                <Icon className={cn('w-4 h-4', card.color)} />
              </div>
            </div>
            <div className={cn('text-lg font-bold truncate', card.color === 'text-red-500' ? 'text-red-500' : card.value < 0 ? 'text-red-500' : 'text-gray-900')}>
              {formatCurrency(Math.abs(card.value))}
            </div>
            <p className="text-xs text-gray-400 mt-1">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
