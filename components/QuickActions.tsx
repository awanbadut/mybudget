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

const PRESETS = [
  { label: '☕ Kopi 18rb', name: 'Kopi / Minuman', amount: 18000 },
  { label: '🍱 Makan 25rb', name: 'Makan Siang', amount: 25000 },
  { label: '⛽ Bensin 25rb', name: 'Bensin / Transport', amount: 25000 },
  { label: '🅿️ Parkir 5rb', name: 'Parkir', amount: 5000 },
];

export function QuickActions() {
  return (
    <div className="space-y-2.5 w-full min-w-0">
      {/* 4 Primary Navigation Cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full min-w-0">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => triggerHaptic('light')}
              className="group flex flex-col items-center gap-2.5 py-3.5 sm:py-4 px-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.97] transition-all touch-manipulation min-w-0"
            >
              {/* Solid icon bubble */}
              <div
                className={`
                  w-10 h-10 sm:w-11 sm:h-11 rounded-[13px] sm:rounded-[14px] ${action.color}
                  flex items-center justify-center flex-shrink-0
                  group-hover:scale-105
                  transition-transform duration-200
                `}
              >
                <Icon
                  size={18}
                  weight={action.icon === Plus || action.icon === Minus ? 'bold' : 'fill'}
                  className="text-white"
                />
              </div>

              <div className="text-center min-w-0 w-full px-0.5">
                <p className="font-semibold text-[11px] sm:text-[12.5px] text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight truncate">
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

      {/* 1-Tap Quick Expense Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 select-none">
        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 whitespace-nowrap flex items-center gap-1 mr-0.5 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Catat Cepat:</span>
        </span>
        {PRESETS.map((item) => (
          <Link
            key={item.label}
            href={`/transactions?action=new&type=expense&name=${encodeURIComponent(item.name)}&amount=${item.amount}`}
            onClick={() => triggerHaptic('selection')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-95 transition-all whitespace-nowrap shadow-2xs touch-manipulation flex-shrink-0"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
