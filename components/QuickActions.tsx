'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Target,
  CreditCard,
} from 'lucide-react';

const actions = [
  {
    href: '/transactions?action=new&type=expense',
    label: 'Pengeluaran',
    desc: 'Catat belanja',
    icon: ArrowUpRight,
    iconClass: 'bg-rose-500',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  },
  {
    href: '/transactions?action=new&type=income',
    label: 'Pemasukan',
    desc: 'Catat gaji',
    icon: ArrowDownLeft,
    iconClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  },
  {
    href: '/savings',
    label: 'Tabungan',
    desc: 'Pos simpanan',
    icon: Target,
    iconClass: 'bg-indigo-500',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
  },
  {
    href: '/debts',
    label: 'Cicilan',
    desc: 'Jadwal bayar',
    icon: CreditCard,
    iconClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full min-w-0">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="
              group flex flex-col items-center gap-2 py-3.5 px-1
              rounded-2xl
              bg-white dark:bg-[#1c1c1e]
              border border-zinc-200/70 dark:border-zinc-700/40
              shadow-[0_1px_2px_rgba(0,0,0,0.04)]
              dark:shadow-[0_1px_4px_rgba(0,0,0,0.20)]
              hover:border-zinc-300 dark:hover:border-zinc-600
              hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]
              active:scale-[0.96]
              transition-all duration-150
              touch-manipulation min-w-0
            "
          >
            {/* Icon bubble */}
            <div
              className={`
                w-10 h-10 sm:w-11 sm:h-11 rounded-xl
                flex items-center justify-center flex-shrink-0
                ${action.iconClass}
                shadow-sm
                group-hover:scale-105 transition-transform duration-150
              `}
            >
              <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>

            {/* Label */}
            <div className="text-center min-w-0">
              <p className="font-semibold text-[12px] sm:text-[13px] text-zinc-800 dark:text-zinc-100 leading-tight truncate w-full">
                {action.label}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight truncate">
                {action.desc}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
