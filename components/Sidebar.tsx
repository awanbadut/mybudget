'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, PieChart, CreditCard, Target, BarChart3, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/actions/auth';
import { useTransition } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/budget', label: 'Anggaran', icon: PieChart },
  { href: '/debts', label: 'Utang & Cicilan', icon: CreditCard },
  { href: '/savings', label: 'Tabungan', icon: Target },
  { href: '/reports', label: 'Laporan', icon: BarChart3 },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
];

interface SidebarProps {
  userName?: string;
  userRole?: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  const allNavItems = [
    ...navItems,
    ...(userRole === 'admin' ? [{ href: '/admin', label: 'Admin Panel', icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-zinc-900 border-r border-stone-200/80 dark:border-zinc-800/80 flex-col z-50 transition-colors select-none">
      {/* Brand Header: Single-line lockup, zero AI subtitles, zero pulse dots */}
      <div className="h-14 px-4 border-b border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
          <div className="w-[26px] h-[31px] flex items-center justify-center flex-shrink-0 group-hover:opacity-90 transition-opacity">
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
          <span className="font-semibold text-[15px] tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            My Budget
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation: Clean typography, no generic 'Menu Utama' tracking label, no green dots */}
      <nav className="flex-1 px-3 py-3.5 space-y-0.5 overflow-y-auto">
        {allNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150',
                isActive
                  ? 'bg-stone-200/70 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-stone-100/70 dark:hover:bg-zinc-800/40'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0 transition-colors', isActive ? 'text-zinc-950 dark:text-white stroke-[2.2]' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 stroke-[1.8]')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Account Dock: Sleek integrated profile card, no detached button */}
      <div className="p-3 border-t border-stone-200/60 dark:border-zinc-800/60">
        {userName && (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-100/60 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                {userName}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none mt-0.5 font-mono">
                {userRole === 'admin' ? 'Administrator' : 'Siklus 25-25'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              title="Keluar Akun"
              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex-shrink-0 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
