'use client';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, Target, CreditCard } from 'lucide-react';

const actions = [
  {
    href: '/transactions?action=new&type=expense',
    label: 'Catat Keluar',
    icon: ArrowUpRight,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 border-rose-100',
  },
  {
    href: '/transactions?action=new&type=income',
    label: 'Catat Masuk',
    icon: ArrowDownLeft,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-100',
  },
  {
    href: '/savings',
    label: 'Tabungan',
    icon: Target,
    iconColor: 'text-zinc-800',
    iconBg: 'bg-zinc-100 border-zinc-200',
  },
  {
    href: '/debts',
    label: 'Cicilan',
    icon: CreditCard,
    iconColor: 'text-zinc-800',
    iconBg: 'bg-zinc-100 border-zinc-200',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-zinc-300 active:scale-[0.95] transition-all text-center group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${action.iconBg}`}>
              <Icon className={`w-4 h-4 stroke-[2.2] ${action.iconColor}`} />
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 leading-tight">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
