'use client';

import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export function MobileTopHeader() {
  const pathname = usePathname();

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-[#0F0F0F] border-b border-zinc-200 dark:border-zinc-800 px-4 h-14 flex items-center justify-between transition-colors">
      <Link href="/" className="flex items-center gap-2.5 active:opacity-70 transition-opacity">
        <Logo className="w-8 h-8" />
        <span className="font-bold text-[15px] text-zinc-900 dark:text-white tracking-tight">
          My Budget
        </span>
      </Link>
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </header>
  );
}
