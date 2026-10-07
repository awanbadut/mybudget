'use client';

import Link from 'next/link';
import {
  Plus,
  Minus,
  PiggyBank,
  CreditCard,
} from '@phosphor-icons/react';

const actions = [
  {
    href: '/transactions?action=new&type=expense',
    label: 'Pengeluaran',
    desc: 'Catat belanja',
    icon: Minus,
    color: 'bg-rose-500 dark:bg-rose-500',
    ring: 'ring-rose-500/20',
  },
  {
    href: '/transactions?action=new&type=income',
    label: 'Pemasukan',
    desc: 'Catat gaji',
    icon: Plus,
    color: 'bg-emerald-500 dark:bg-emerald-500',
    ring: 'ring-emerald-500/20',
  },
  {
    href: '/savings',
    label: 'Tabungan',
    desc: 'Pos simpanan',
    icon: PiggyBank,
    color: 'bg-indigo-500 dark:bg-indigo-500',
    ring: 'ring-indigo-500/20',
  },
  {
    href: '/debts',
    label: 'Cicilan',
    desc: 'Jadwal bayar',
    icon: CreditCard,
    color: 'bg-zinc-700 dark:bg-zinc-600',
    ring: 'ring-zinc-500/20',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full min-w-0">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col items-center gap-2.5 py-4 px-1.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300/80 dark:hover:border-zinc-700/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.20)] active:scale-[0.96] transition-all duration-150 touch-manipulation min-w-0"
          >
            <div className={`w-10 h-10 rounded-[13px] ${action.color} ring-[3px] ${action.ring} flex items-center justify-center flex-shrink-0 group-hover:scale-[1.06] transition-transform duration-150`}>
              <Icon size={18} weight={action.icon === Plus || action.icon === Minus ? 'bold' : 'fill'} className="text-white" />
            </div>
            <div className="text-center min-w-0 w-full">
              <p className="font-semibold text-[12px] sm:text-[13px] text-zinc-800 dark:text-zinc-100 leading-tight truncate">
                {action.label}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight truncate hidden sm:block">
                {action.desc}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
