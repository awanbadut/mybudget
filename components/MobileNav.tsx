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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] px-3 mb-1.5">
      <nav className="pointer-events-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-stone-200/80 dark:border-zinc-800 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-2xl w-full max-w-md mx-auto px-2 py-1.5 flex items-center justify-between transition-colors">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation',
            isHome ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isHome && 'bg-stone-100 dark:bg-zinc-800')}>
            <Home className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5">Beranda</span>
        </Link>

        {/* Budget */}
        <Link
          href="/budget"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation',
            isBudget ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isBudget && 'bg-stone-100 dark:bg-zinc-800')}>
            <PieChart className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5">Budget</span>
        </Link>

        {/* Center Action (+) */}
        <div className="flex-1 flex justify-center -mt-5">
          <Link
            href="/transactions?action=new"
            aria-label="Catat Transaksi"
            className="w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full shadow-lg shadow-zinc-900/20 dark:shadow-white/10 hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-95 flex items-center justify-center transition-all border-2 border-white dark:border-zinc-900 touch-manipulation"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </Link>
        </div>

        {/* Utang & Cicilan */}
        <Link
          href="/debts"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation',
            isDebts ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isDebts && 'bg-stone-100 dark:bg-zinc-800')}>
            <CreditCard className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5">Utang</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation',
            isSettings ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isSettings && 'bg-stone-100 dark:bg-zinc-800')}>
            <Settings className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5">Akun</span>
        </Link>
      </nav>
    </div>
  );
}
