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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      {/* Dock Bar */}
      <nav className="pointer-events-auto mx-3 mb-2 bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] rounded-[26px] px-3 py-1.5 flex items-center justify-between">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-95',
            isHome ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isHome && 'bg-blue-50 text-blue-600')}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Beranda</span>
        </Link>

        {/* Budget */}
        <Link
          href="/budget"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-95',
            isBudget ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isBudget && 'bg-blue-50 text-blue-600')}>
            <PieChart className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Budget</span>
        </Link>

        {/* Prominent Center FAB (+) */}
        <div className="flex-1 flex justify-center -mt-6">
          <Link
            href="/transactions?action=new"
            aria-label="Tambah Transaksi"
            className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.4)] active:scale-90 hover:brightness-110 transition-all border-4 border-white"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </Link>
        </div>

        {/* Utang & Cicilan */}
        <Link
          href="/debts"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-95',
            isDebts ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isDebts && 'bg-blue-50 text-blue-600')}>
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Utang</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-95',
            isSettings ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isSettings && 'bg-blue-50 text-blue-600')}>
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Setelan</span>
        </Link>
      </nav>
    </div>
  );
}
