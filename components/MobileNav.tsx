'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PieChart, Plus, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  // Don't show on auth / admin pages
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/admin')
  ) {
    return null;
  }

  const isHome    = pathname === '/';
  const isBudget  = pathname.startsWith('/budget');
  const isDebts   = pathname.startsWith('/debts') || pathname.startsWith('/savings');
  const isSettings = pathname.startsWith('/settings') || pathname.startsWith('/reports');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-4 mb-2">
      <nav
        className="
          pointer-events-auto
          bg-white/85 dark:bg-[#1c1c1e]/88
          backdrop-blur-2xl
          border border-zinc-200/60 dark:border-zinc-700/40
          shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.40)]
          rounded-2xl w-full max-w-sm mx-auto
          px-2 py-1
          flex items-center justify-between
        "
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.70)' }}
      >
        {/* Beranda */}
        <NavItem href="/" label="Beranda" isActive={isHome}>
          <Home strokeWidth={isHome ? 2.3 : 1.8} />
        </NavItem>

        {/* Budget */}
        <NavItem href="/budget" label="Budget" isActive={isBudget}>
          <PieChart strokeWidth={isBudget ? 2.3 : 1.8} />
        </NavItem>

        {/* Center FAB */}
        <div className="flex-1 flex justify-center -mt-6">
          <Link
            href="/transactions?action=new"
            aria-label="Catat Transaksi"
            className="
              w-14 h-14
              bg-zinc-900 dark:bg-white
              text-white dark:text-zinc-900
              rounded-full
              shadow-[0_4px_16px_rgba(0,0,0,0.24)] dark:shadow-[0_4px_16px_rgba(255,255,255,0.12)]
              hover:bg-zinc-800 dark:hover:bg-zinc-100
              active:scale-95
              flex items-center justify-center
              transition-all touch-manipulation
              border-[3px] border-white dark:border-[#0F0F0F]
            "
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Utang */}
        <NavItem href="/debts" label="Utang" isActive={isDebts}>
          <CreditCard strokeWidth={isDebts ? 2.3 : 1.8} />
        </NavItem>

        {/* Akun */}
        <NavItem href="/settings" label="Akun" isActive={isSettings}>
          <Settings strokeWidth={isSettings ? 2.3 : 1.8} />
        </NavItem>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
  isActive,
  children,
}: {
  href: string;
  label: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 touch-manipulation rounded-xl',
        isActive
          ? 'text-zinc-900 dark:text-white'
          : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
      )}
    >
      <span
        className={cn(
          'w-[34px] h-[34px] flex items-center justify-center rounded-xl transition-colors',
          '[&>svg]:w-[18px] [&>svg]:h-[18px]',
          isActive ? 'bg-zinc-100 dark:bg-zinc-800' : ''
        )}
      >
        {children}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  );
}
