'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
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
  Users,
  Wallet,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/actions/auth';
import { useTransition } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSidebar } from '@/components/SidebarProvider';

const userNavItems = [
  { href: '/',             label: 'Beranda',      icon: Home },
  { href: '/transactions', label: 'Transaksi',    icon: ArrowLeftRight },
  { href: '/budget',       label: 'Anggaran',     icon: PieChart },
  { href: '/debts',        label: 'Utang & Cicilan', icon: CreditCard },
  { href: '/savings',      label: 'Tabungan',     icon: Target },
  { href: '/reports',      label: 'Laporan',      icon: BarChart3 },
  { href: '/settings',     label: 'Pengaturan',   icon: Settings },
];

const adminNavItems = [
  { href: '/admin',           label: 'Admin Console',  icon: ShieldCheck },
  { href: '/admin#users',     label: 'Kelola Pengguna', icon: Users },
  { href: '/admin#metrics',   label: 'Kas & Metrik',   icon: Wallet },
  { href: '/admin#broadcast', label: 'Siaran Global',  icon: Megaphone },
];

interface SidebarProps {
  userName?: string;
  userRole?: string;
  isImpersonating?: boolean;
}

export function Sidebar({ userName, userRole, isImpersonating }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { isCollapsed, toggleSidebar } = useSidebar();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  // If pure admin (not impersonating), ONLY show admin items.
  const isPureAdmin = userRole === 'admin' && !isImpersonating;
  const navItems = isPureAdmin ? adminNavItems : userNavItems;

  return (
    <aside
      style={{
        top: 'var(--broadcast-height, 0px)',
        height: 'calc(100vh - var(--broadcast-height, 0px))',
      }}
      className={cn(
        'hidden md:flex fixed left-0 flex-col z-50 select-none border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-[width,top,height] duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-60'
      )}
    >
      {/* Vertical Middle Collapse / Expand Toggle Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        className={cn(
          'absolute -right-3.5 top-1/2 -translate-y-1/2 z-50',
          'w-7 h-7 rounded-full',
          'bg-white dark:bg-zinc-800',
          'border border-zinc-200 dark:border-zinc-700',
          'shadow-[0_2px_8px_rgba(0,0,0,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.40)]',
          'flex items-center justify-center',
          'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
          'hover:scale-110 active:scale-95',
          'transition-all duration-200 ease-out',
          'touch-manipulation group'
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
        ) : (
          <ChevronLeft className="w-4 h-4 stroke-[2.5] transition-transform group-hover:-translate-x-0.5" />
        )}
        <span className="sr-only">{isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}</span>
      </button>

      {/* Brand Header */}
      <div
        className={cn(
          'h-16 flex items-center border-b border-zinc-200 dark:border-zinc-800 transition-all',
          isCollapsed ? 'px-2 justify-center flex-col gap-1' : 'px-4 justify-between'
        )}
      >
        {!isCollapsed ? (
          <>
            <Link
              href={isPureAdmin ? '/admin' : '/'}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              <Logo className="w-7 h-7 group-hover:opacity-85 transition-opacity flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-[14px] tracking-tight text-zinc-900 dark:text-white truncate leading-tight">
                  {isPureAdmin ? 'Admin Console' : 'My Budget'}
                </span>
                {isPureAdmin && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium leading-none">
                    Real Admin
                  </span>
                )}
              </div>
            </Link>

            <div className="flex items-center flex-shrink-0">
              <ThemeToggle />
            </div>
          </>
        ) : (
          <Link
            href={isPureAdmin ? '/admin' : '/'}
            className="flex items-center justify-center group"
            title={isPureAdmin ? 'Admin Console' : 'My Budget'}
          >
            <Logo className="w-8 h-8 group-hover:opacity-85 transition-opacity" />
          </Link>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={cn('flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden', isCollapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && !item.href.includes('#') && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex items-center rounded-xl text-[13.5px] font-medium transition-all duration-150 touch-manipulation',
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              <Icon
                className={cn(
                  'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />

              {!isCollapsed ? (
                <span className="tracking-[-0.01em] truncate">{item.label}</span>
              ) : (
                /* Hover Tooltip in collapsed mode */
                <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[12px] font-semibold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Dock Footer */}
      <div
        className={cn(
          'border-t border-zinc-200 dark:border-zinc-800 transition-all',
          isCollapsed ? 'p-2 flex flex-col items-center gap-2 pb-4' : 'px-3 pb-5 pt-3'
        )}
      >
        {isCollapsed && (
          <div className="mb-1 flex items-center justify-center">
            <ThemeToggle />
          </div>
        )}

        {userName && (
          !isCollapsed ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] flex items-center justify-center flex-shrink-0 shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] text-zinc-900 dark:text-white truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none mt-0.5 font-mono">
                  {isPureAdmin ? 'Administrator' : 'Akun Pengguna'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isPending}
                title="Keluar Akun"
                aria-label="Keluar dari akun"
                className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors flex-shrink-0 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                title={`${userName} (${isPureAdmin ? 'Administrator' : 'Pengguna'})`}
                className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] flex items-center justify-center shadow-sm cursor-default"
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                disabled={isPending}
                title="Keluar"
                aria-label="Keluar dari akun"
                className="group relative p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors active:scale-95"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
                <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[11px] font-semibold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  Keluar ({userName})
                </span>
              </button>
            </div>
          )
        )}
      </div>
    </aside>
  );
}
