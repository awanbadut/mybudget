'use client';

import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, Target, CreditCard } from 'lucide-react';

const actions = [
  {
    href: '/transactions?action=new&type=expense',
    label: 'Catat Pengeluaran',
    desc: 'Belanja harian',
    icon: ArrowUpRight,
    iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
  },
  {
    href: '/transactions?action=new&type=income',
    label: 'Catat Pemasukan',
    desc: 'Gaji & pendapatan',
    icon: ArrowDownLeft,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
  },
  {
    href: '/savings',
    label: 'Target Tabungan',
    desc: 'Pos simpanan',
    icon: Target,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40',
  },
  {
    href: '/debts',
    label: 'Utang & Cicilan',
    desc: 'Jadwal pembayaran',
    icon: CreditCard,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full min-w-0">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group bg-white dark:bg-zinc-900 hover:bg-stone-50/80 dark:hover:bg-zinc-800/80 active:bg-stone-100 dark:active:bg-zinc-800 border border-stone-200/80 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300 dark:hover:border-zinc-700 active:scale-[0.98] flex flex-col justify-between min-w-0"
          >
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${action.iconBg}`}>
                <Icon className="w-4 h-4 stroke-[2.3]" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white group-hover:text-zinc-950 dark:group-hover:text-white transition-colors truncate">
                {action.label}
              </p>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {action.desc}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
