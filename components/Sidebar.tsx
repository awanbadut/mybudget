'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  ArrowLeftRight,
  PieChart,
  CreditCard,
  Target,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/actions/auth';
import { useTransition } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { href: '/',             label: 'Beranda',      icon: Home },
  { href: '/transactions', label: 'Transaksi',    icon: ArrowLeftRight },
  { href: '/budget',       label: 'Anggaran',     icon: PieChart },
  { href: '/debts',        label: 'Utang',        icon: CreditCard },
  { href: '/savings',      label: 'Tabungan',     icon: Target },
  { href: '/reports',      label: 'Laporan',      icon: BarChart3 },
  { href: '/settings',     label: 'Pengaturan',   icon: Settings },
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
    ...(userRole === 'admin' ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-50 select-none border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white/90 dark:bg-[#141414]/90 backdrop-blur-xl">
      {/* Brand */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
          <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 group-hover:opacity-80 transition-opacity">
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
          <span className="font-bold text-[15px] tracking-tight text-zinc-900 dark:text-white truncate">
            My Budget
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {allNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
                isActive
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.14)] dark:shadow-[0_2px_8px_rgba(255,255,255,0.10)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:translate-x-0.5'
              )}
            >
              <Icon
                className={cn(
                  'w-[17px] h-[17px] flex-shrink-0 transition-all duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
                  isActive
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 group-hover:scale-[1.08]'
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="tracking-[-0.01em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User dock */}
      <div className="px-3 pb-5 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3">
        {userName && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] flex items-center justify-center flex-shrink-0 shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[13px] text-zinc-900 dark:text-white truncate leading-tight">
                {userName}
              </p>
              <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500 truncate leading-none mt-0.5 font-mono">
                {userRole === 'admin' ? 'Administrator' : 'Akun Pribadi'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              title="Keluar"
              className="p-1.5 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex-shrink-0 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
