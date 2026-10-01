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
    <header className="md:hidden sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-stone-200/70 dark:border-zinc-800/70 px-4 h-13 flex items-center justify-between transition-colors">
      <Link href="/" className="flex items-center gap-2.5 active:scale-98 transition-transform">
        <div className="w-[24px] h-[29px] flex items-center justify-center flex-shrink-0">
          <Image
            src="/logo-v4-light.png"
            alt="My Budget"
            width={776}
            height={935}
            className="w-full h-full object-contain block dark:hidden"
            unoptimized
            priority
          />
          <Image
            src="/logo-v4-dark.png"
            alt="My Budget"
            width={776}
            height={935}
            className="w-full h-full object-contain hidden dark:block"
            unoptimized
            priority
          />
        </div>
        <span className="font-semibold text-[15px] text-zinc-900 dark:text-white tracking-tight">
          My Budget
        </span>
      </Link>
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </header>
  );
}
