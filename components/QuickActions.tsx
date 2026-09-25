'use client';
import Link from 'next/link';
import { MinusCircle, PlusCircle, PiggyBank, CreditCard, BarChart2 } from 'lucide-react';

const actions = [
  {
    href: '/transactions?action=new&type=expense',
    label: 'Pengeluaran',
    icon: MinusCircle,
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    iconBg: 'bg-rose-500 text-white shadow-rose-200',
  },
  {
    href: '/transactions?action=new&type=income',
    label: 'Pemasukan',
    icon: PlusCircle,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    iconBg: 'bg-emerald-500 text-white shadow-emerald-200',
  },
  {
    href: '/savings',
    label: 'Tabungan',
    icon: PiggyBank,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    iconBg: 'bg-blue-500 text-white shadow-blue-200',
  },
  {
    href: '/debts',
    label: 'Cicilan',
    icon: CreditCard,
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    iconBg: 'bg-purple-500 text-white shadow-purple-200',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-gray-100/80 shadow-sm hover:shadow-md active:scale-95 transition-all text-center group"
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${action.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-700 leading-tight">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
