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
    color: 'bg-rose-500',
    glow: 'shadow-[0_4px_16px_-2px_rgba(239,68,68,0.35)]',
    ring: 'ring-rose-400/20',
  },
  {
    href: '/transactions?action=new&type=income',
    label: 'Pemasukan',
    desc: 'Catat gaji',
    icon: Plus,
    color: 'bg-emerald-500',
    glow: 'shadow-[0_4px_16px_-2px_rgba(16,185,129,0.35)]',
    ring: 'ring-emerald-400/20',
  },
  {
    href: '/savings',
    label: 'Tabungan',
    desc: 'Pos simpanan',
    icon: PiggyBank,
    color: 'bg-indigo-500',
    glow: 'shadow-[0_4px_16px_-2px_rgba(99,102,241,0.35)]',
    ring: 'ring-indigo-400/20',
  },
  {
    href: '/debts',
    label: 'Cicilan',
    desc: 'Jadwal bayar',
    icon: CreditCard,
    color: 'bg-zinc-700 dark:bg-zinc-600',
    glow: 'shadow-[0_4px_16px_-2px_rgba(63,63,70,0.30)]',
    ring: 'ring-zinc-400/20',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full min-w-0">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          /* Double-Bezel outer shell per action card */
          <Link
            key={action.href}
            href={action.href}
            className="group press flex flex-col items-center gap-3 py-4 px-1.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-[360ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300/60 dark:hover:border-zinc-700/60 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.36)] touch-manipulation min-w-0"
          >
            {/* Icon bubble with spring-physics scale */}
            <div
              className={`
                w-11 h-11 rounded-[14px] ${action.color}
                ring-[3px] ${action.ring}
                flex items-center justify-center flex-shrink-0
                group-hover:scale-[1.10] group-hover:-translate-y-0.5
                ${action.glow} group-hover:shadow-none
                transition-all duration-[360ms] ease-[cubic-bezier(0.32,0.72,0,1)]
              `}
            >
              <Icon
                size={18}
                weight={action.icon === Plus || action.icon === Minus ? 'bold' : 'fill'}
                className="text-white"
              />
            </div>

            <div className="text-center min-w-0 w-full">
              <p className="font-semibold text-[11.5px] sm:text-[12.5px] text-zinc-800 dark:text-zinc-100 leading-tight tracking-[-0.01em] truncate">
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
