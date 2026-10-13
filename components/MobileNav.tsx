'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  ChartPie,
  Plus,
  CreditCard,
  Gear,
} from '@phosphor-icons/react';
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

  const isHome     = pathname === '/';
  const isBudget   = pathname.startsWith('/budget');
  const isDebts    = pathname.startsWith('/debts') || pathname.startsWith('/savings');
  const isSettings = pathname.startsWith('/settings') || pathname.startsWith('/reports');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-3 mb-1">
      <nav
        className="
          pointer-events-auto
          bg-white dark:bg-zinc-900
          border border-zinc-200 dark:border-zinc-800
          shadow-lg dark:shadow-2xl
          rounded-2xl w-full max-w-md mx-auto
          px-2 py-1
          flex items-center justify-between
        "
      >
        {/* Beranda */}
        <NavItem href="/" label="Beranda" isActive={isHome}>
          <House size={20} weight={isHome ? 'fill' : 'regular'} />
        </NavItem>

        {/* Budget */}
        <NavItem href="/budget" label="Anggaran" isActive={isBudget}>
          <ChartPie size={20} weight={isBudget ? 'fill' : 'regular'} />
        </NavItem>

        {/* Center Action Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <Link
            href="/transactions?action=new"
            aria-label="Catat Transaksi"
            className="
              w-12 h-12
              bg-zinc-900 dark:bg-white
              text-white dark:text-zinc-900
              rounded-full
              shadow-md
              hover:bg-zinc-800 dark:hover:bg-zinc-100
              active:scale-95
              flex items-center justify-center
              transition-transform touch-manipulation
              border-2 border-white dark:border-zinc-900
            "
          >
            <Plus size={22} weight="bold" />
          </Link>
        </div>

        {/* Utang */}
        <NavItem href="/debts" label="Utang" isActive={isDebts}>
          <CreditCard size={20} weight={isDebts ? 'fill' : 'regular'} />
        </NavItem>

        {/* Pengaturan */}
        <NavItem href="/settings" label="Pengaturan" isActive={isSettings}>
          <Gear size={20} weight={isSettings ? 'fill' : 'regular'} />
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
        'flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition-all active:scale-95 touch-manipulation rounded-xl',
        isActive
          ? 'text-zinc-900 dark:text-white font-semibold'
          : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
      )}
    >
      <span
        className={cn(
          'w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
          isActive ? 'bg-zinc-100 dark:bg-zinc-800' : ''
        )}
      >
        {children}
      </span>
      <span className="text-[10px] leading-tight truncate">{label}</span>
    </Link>
  );
}
