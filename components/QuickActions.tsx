'use client';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, Target, CreditCard, PlusCircle } from 'lucide-react';

const actions = [
  {
    href: '/transactions?action=new&type=expense',
    code: '01',
    label: 'Catat Keluar',
    desc: 'Pengeluaran',
    icon: ArrowUpRight,
    borderColor: 'border-[#D9381E]',
    textColor: 'text-[#D9381E]',
    bgColor: 'bg-[#FBEBE8]',
  },
  {
    href: '/transactions?action=new&type=income',
    code: '02',
    label: 'Catat Masuk',
    desc: 'Pemasukan',
    icon: ArrowDownLeft,
    borderColor: 'border-[#2A7B88]',
    textColor: 'text-[#2A7B88]',
    bgColor: 'bg-[#EAF4F5]',
  },
  {
    href: '/savings',
    code: '03',
    label: 'Tabungan',
    desc: 'Target Dana',
    icon: Target,
    borderColor: 'border-[#24201D]/40',
    textColor: 'text-[#24201D]',
    bgColor: 'bg-[#EDE6DC]',
  },
  {
    href: '/debts',
    code: '04',
    label: 'Cicilan Utang',
    desc: 'Jadwal Bayar',
    icon: CreditCard,
    borderColor: 'border-[#24201D]/40',
    textColor: 'text-[#24201D]',
    bgColor: 'bg-[#EDE6DC]',
  },
];

export function QuickActions() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="font-mono text-xs font-bold text-[#D9381E] uppercase">PLANK 03</span>
        <span className="text-[#24201D]/30">/</span>
        <span className="font-mono text-xs font-semibold text-[#706860] uppercase">Aksi Cepat Transaksi</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="bg-[#FAF7F2] border-2 border-[#24201D] p-3 shadow-[2px_2px_0px_#24201D] hover:bg-[#EDE6DC] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#24201D] transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-[#706860]">
                  [{action.code}]
                </span>
                <div className={`w-7 h-7 border rounded-[2px] flex items-center justify-center ${action.borderColor} ${action.bgColor}`}>
                  <Icon className={`w-3.5 h-3.5 ${action.textColor}`} />
                </div>
              </div>

              <div>
                <p className="font-display font-bold text-base sm:text-lg text-[#24201D] uppercase leading-tight group-hover:text-[#D9381E] transition-colors">
                  {action.label}
                </p>
                <p className="font-mono text-[10px] text-[#706860] uppercase mt-0.5">
                  {action.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
