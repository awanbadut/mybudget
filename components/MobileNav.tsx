'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PieChart, Plus, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  // Don't show on login/register/admin pages
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) {
    return null;
  }

  const isHome = pathname === '/';
  const isBudget = pathname.startsWith('/budget');
  const isDebts = pathname.startsWith('/debts') || pathname.startsWith('/savings');
  const isSettings = pathname.startsWith('/settings') || pathname.startsWith('/reports');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[env(safe-area-inset-bottom)] px-3 mb-2">
      {/* Hallmark Custom-04 Letterpress Mobile Dock */}
      <nav className="pointer-events-auto bg-[#F4F0EA] border-2 border-[#24201D] shadow-[4px_4px_0px_#24201D] px-2 py-1.5 flex items-center justify-between">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1 transition-all active:translate-y-[1px]',
            isHome ? 'text-[#24201D]' : 'text-[#706860] hover:text-[#24201D]'
          )}
        >
          <div className={cn('p-1 rounded-[2px] transition-colors', isHome && 'bg-[#EDE6DC] border border-[#24201D]')}>
            <Home className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider mt-0.5">Buku</span>
        </Link>

        {/* Budget */}
        <Link
          href="/budget"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1 transition-all active:translate-y-[1px]',
            isBudget ? 'text-[#24201D]' : 'text-[#706860] hover:text-[#24201D]'
          )}
        >
          <div className={cn('p-1 rounded-[2px] transition-colors', isBudget && 'bg-[#EDE6DC] border border-[#24201D]')}>
            <PieChart className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider mt-0.5">Budget</span>
        </Link>

        {/* Center Primary Action Button (+) - Stamped Riso Vermilion */}
        <div className="flex-1 flex justify-center -mt-6">
          <Link
            href="/transactions?action=new"
            aria-label="Tambah Transaksi"
            className="w-12 h-12 bg-[#D9381E] text-[#F4F0EA] border-2 border-[#24201D] shadow-[2px_2px_0px_#24201D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#24201D] hover:bg-[#24201D] flex items-center justify-center transition-all"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </Link>
        </div>

        {/* Utang & Cicilan */}
        <Link
          href="/debts"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1 transition-all active:translate-y-[1px]',
            isDebts ? 'text-[#24201D]' : 'text-[#706860] hover:text-[#24201D]'
          )}
        >
          <div className={cn('p-1 rounded-[2px] transition-colors', isDebts && 'bg-[#EDE6DC] border border-[#24201D]')}>
            <CreditCard className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider mt-0.5">Utang</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1 transition-all active:translate-y-[1px]',
            isSettings ? 'text-[#24201D]' : 'text-[#706860] hover:text-[#24201D]'
          )}
        >
          <div className={cn('p-1 rounded-[2px] transition-colors', isSettings && 'bg-[#EDE6DC] border border-[#24201D]')}>
            <Settings className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider mt-0.5">Akun</span>
        </Link>
      </nav>
    </div>
  );
}
