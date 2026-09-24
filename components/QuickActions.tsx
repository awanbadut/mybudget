'use client';
import Link from 'next/link';
import { Plus, TrendingUp, PiggyBank, CreditCard } from 'lucide-react';

const actions = [
  { href: '/transactions?type=expense', label: 'Pengeluaran', icon: Plus, color: 'bg-red-50 text-red-600' },
  { href: '/transactions?type=income', label: 'Pemasukan', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
  { href: '/savings?action=add', label: 'Tabungan', icon: PiggyBank, color: 'bg-blue-50 text-blue-600' },
  { href: '/debts?action=pay', label: 'Cicilan', icon: CreditCard, color: 'bg-purple-50 text-purple-600' },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-600 text-center leading-tight">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
