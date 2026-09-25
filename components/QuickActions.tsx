'use client';

import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, Target, CreditCard } from 'lucide-react';

const actions = [
  {
    href: '/transactions?action=new&type=expense',
    label: 'Catat Keluar',
    desc: 'Pengeluaran kas',
    icon: ArrowUpRight,
    iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
  },
  {
    href: '/transactions?action=new&type=income',
    label: 'Catat Masuk',
    desc: 'Pemasukan kas',
    icon: ArrowDownLeft,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    href: '/savings',
    label: 'Tabungan',
    desc: 'Target dana',
    icon: Target,
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  },
  {
    href: '/debts',
    label: 'Cicilan Utang',
    desc: 'Jadwal bayar',
    icon: CreditCard,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group bg-white hover:bg-stone-50/80 active:bg-stone-100 border border-stone-200/80 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300 active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${action.iconBg}`}>
                <Icon className="w-4 h-4 stroke-[2.3]" />
              </div>
            </div>

            <div>
              <p className="font-semibold text-sm text-zinc-900 group-hover:text-zinc-950 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {action.desc}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
