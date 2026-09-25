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
      {/* Precision Obsidian Dock */}
      <nav className="pointer-events-auto mx-4 mb-2 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-[0_16px_40px_rgba(0,0,0,0.28)] rounded-3xl px-3 py-1.5 flex items-center justify-between text-zinc-400">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-95',
            isHome ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isHome && 'bg-zinc-850 text-white')}>
            <Home className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Home</span>
        </Link>

        {/* Budget */}
        <Link
          href="/budget"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-95',
            isBudget ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isBudget && 'bg-zinc-850 text-white')}>
            <PieChart className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Budget</span>
        </Link>

        {/* Center Prominent Primary Action Button (+) */}
        <div className="flex-1 flex justify-center -mt-5">
          <Link
            href="/transactions?action=new"
            aria-label="Tambah Transaksi"
            className="w-12 h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-[0_6px_20px_rgba(255,255,255,0.2)] active:scale-90 hover:brightness-95 transition-all border-[3px] border-zinc-950"
          >
            <Plus className="w-5 h-5 stroke-[2.6]" />
          </Link>
        </div>

        {/* Utang & Cicilan */}
        <Link
          href="/debts"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-95',
            isDebts ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isDebts && 'bg-zinc-850 text-white')}>
            <CreditCard className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Utang</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-95',
            isSettings ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          <div className={cn('p-1 rounded-xl transition-colors', isSettings && 'bg-zinc-850 text-white')}>
            <Settings className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Akun</span>
        </Link>
      </nav>
    </div>
  );
}
