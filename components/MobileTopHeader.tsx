'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export function MobileTopHeader() {
  const pathname = usePathname();

  // Hide on auth pages and admin console
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between transition-colors shadow-xs">
      <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform">
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          <Image
            src="/logo.png"
            alt="My Budget"
            width={36}
            height={36}
            className="w-full h-full object-contain dark:hidden"
            unoptimized
            priority
          />
          <Image
            src="/logo-dark.png"
            alt="My Budget"
            width={36}
            height={36}
            className="w-full h-full object-contain hidden dark:block"
            unoptimized
            priority
          />
        </div>
        <div>
          <h2 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
            My Budget
          </h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium leading-none mt-0.5">
            Personal Finance
          </p>
        </div>
      </Link>
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </header>
  );
}
