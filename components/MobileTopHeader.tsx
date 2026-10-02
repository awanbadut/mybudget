'use client';

import Image from 'next/image';
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
    <header
      className="
        md:hidden sticky top-0 z-30
        bg-white/80 dark:bg-[#0F0F0F]/82
        backdrop-blur-2xl
        border-b border-zinc-200/50 dark:border-zinc-800/50
        px-4 h-14
        flex items-center justify-between
        transition-colors
      "
      style={{
        boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
      }}
    >
      <Link href="/" className="flex items-center gap-2.5 active:opacity-70 transition-opacity">
        <div className="w-6 h-7 flex items-center justify-center flex-shrink-0">
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
