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
  { href: '/budget', label: 'Pagu Anggaran', icon: PieChart },
  { href: '/debts', label: 'Cicilan Utang', icon: CreditCard },
  { href: '/savings', label: 'Target Tabungan', icon: Target },
  { href: '/reports', label: 'Laporan Berkala', icon: BarChart3 },
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
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-zinc-900 border-r border-stone-200/80 dark:border-zinc-800 flex-col z-50 transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
            <Image
              src="/logo.png"
              alt="My Budget"
              width={44}
              height={44}
              className="w-full h-full object-contain dark:hidden"
              unoptimized
              priority
            />
            <Image
              src="/logo-dark.png"
              alt="My Budget"
              width={44}
              height={44}
              className="w-full h-full object-contain hidden dark:block"
              unoptimized
              priority
            />
          </div>
          <div>
            <h1 className="font-bold text-base text-zinc-900 dark:text-white leading-tight">
              My Budget
            </h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Personal Finance
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <p className="text-[11px] font-semibold text-zinc-400 px-3 py-2 uppercase tracking-wider">
          Menu Utama
        </p>
        {allNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                isActive
                  ? 'bg-stone-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-zinc-800/60 font-medium'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-stone-100 dark:border-zinc-800 space-y-3">
        {userName && (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center border border-stone-200 dark:border-zinc-700">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-200 truncate">
                {userName}
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                {userRole === 'admin' ? 'Administrator' : 'Siklus Gaji 25-25'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isPending ? 'Keluar...' : 'Keluar Akun'}</span>
        </button>
      </div>
    </aside>
  );
}
