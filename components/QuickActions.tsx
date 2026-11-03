'use client';

import Link from 'next/link';
import {
  Plus,
  Minus,
  PiggyBank,
  CreditCard,
} from '@phosphor-icons/react';
import { Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

const actions = [
  {
    href: '/transactions?action=new&type=expense',
    label: 'Pengeluaran',
    desc: 'Catat belanja',
    icon: Minus,
    color: 'bg-red-600',
  },
  {
    href: '/transactions?action=new&type=income',
    label: 'Pemasukan',
    desc: 'Catat gaji',
    icon: Plus,
    color: 'bg-green-600',
  },
  {
    href: '/savings',
    label: 'Tabungan',
    desc: 'Pos simpanan',
    icon: PiggyBank,
    color: 'bg-blue-600',
  },
  {
    href: '/debts',
    label: 'Cicilan',
    desc: 'Jadwal bayar',
    icon: CreditCard,
    color: 'bg-zinc-800 dark:bg-zinc-700',
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
            onClick={() => triggerHaptic('light')}
            className="group flex flex-col items-center gap-2 py-3 px-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.97] transition-all touch-manipulation min-w-0"
          >
            <div
              className={`w-10 h-10 rounded-[13px] ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}
            >
              <Icon
                size={18}
                weight={action.icon === Plus || action.icon === Minus ? 'bold' : 'fill'}
                className="text-white"
              />
            </div>

            <div className="text-center min-w-0 w-full px-0.5">
              <p className="font-semibold text-[11px] sm:text-xs text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight truncate">
                {action.label}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
