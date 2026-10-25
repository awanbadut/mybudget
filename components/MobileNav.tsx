'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Home,
  ArrowLeftRight,
  Plus,
  PiggyBank,
  PieChart,
  CreditCard,
  BarChart3,
  Settings,
  Check,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const APP_MENU_ITEMS = [
  {
    href: '/',
    label: 'Beranda Utama',
    desc: 'Ringkasan saldo, kartu ATM & siklus',
    icon: Home,
    color: 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900',
  },
  {
    href: '/savings',
    label: 'Target Tabungan',
    desc: 'Simpanan & rencana dana masa depan',
    icon: PiggyBank,
    color: 'bg-blue-600 text-white',
  },
  {
    href: '/budget',
    label: 'Anggaran Bulanan',
    desc: 'Jatah belanja per pos kategori',
    icon: PieChart,
    color: 'bg-emerald-600 text-white',
  },
  {
    href: '/transactions',
    label: 'Buku Transaksi',
    desc: 'Arus kas masuk, keluar & tagihan',
    icon: ArrowLeftRight,
    color: 'bg-indigo-600 text-white',
  },
  {
    href: '/debts',
    label: 'Cicilan & Utang',
    desc: 'Jadwal angsuran & pelunasan',
    icon: CreditCard,
    color: 'bg-amber-500 text-white',
  },
  {
    href: '/reports',
    label: 'Laporan & Siklus',
    desc: 'Riwayat siklus 25-24 & ekspor Excel',
    icon: BarChart3,
    color: 'bg-rose-600 text-white',
  },
  {
    href: '/settings',
    label: 'Pengaturan Akun',
    desc: 'Gaji, tanggal siklus & kategori pos',
    icon: Settings,
    color: 'bg-stone-700 text-white',
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Don't show on auth / admin pages
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/admin')
  ) {
    return null;
  }

  const isHome = pathname === '/';
  const isTransactions = pathname.startsWith('/transactions');
  const isSavings = pathname.startsWith('/savings');
  const isOtherActive =
    pathname.startsWith('/budget') ||
    pathname.startsWith('/debts') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/settings');

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-3 mb-1">
        <nav
          className="
            pointer-events-auto
            bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md
            border border-zinc-200 dark:border-zinc-800
            shadow-lg dark:shadow-2xl
            rounded-2xl w-full max-w-md mx-auto
            px-2 py-1
            flex items-center justify-between
          "
        >
          {/* 1. Beranda */}
          <NavItem href="/" label="Beranda" isActive={isHome}>
            <Home className="w-5 h-5" strokeWidth={isHome ? 2.4 : 1.9} />
          </NavItem>

          {/* 2. Transaksi */}
          <NavItem href="/transactions" label="Transaksi" isActive={isTransactions}>
            <ArrowLeftRight className="w-5 h-5" strokeWidth={isTransactions ? 2.4 : 1.9} />
          </NavItem>

          {/* 3. Center Action Button (+) */}
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
              <Plus className="w-5 h-5" strokeWidth={2.8} />
            </Link>
          </div>

          {/* 4. Tabungan */}
          <NavItem href="/savings" label="Tabungan" isActive={isSavings}>
            <PiggyBank className="w-5 h-5" strokeWidth={isSavings ? 2.4 : 1.9} />
          </NavItem>

          {/* 5. Menu Lainnya (Opens Bottom Sheet App Launcher) */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition-all active:scale-95 touch-manipulation rounded-xl relative',
              isOtherActive || menuOpen
                ? 'text-zinc-900 dark:text-white font-semibold'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            <span
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative',
                isOtherActive || menuOpen ? 'bg-zinc-100 dark:bg-zinc-800' : ''
              )}
            >
              <Menu className="w-5 h-5" strokeWidth={isOtherActive || menuOpen ? 2.4 : 1.9} />
              {isOtherActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
              )}
            </span>
            <span className="text-[10px] leading-tight truncate">Menu</span>
          </button>
        </nav>
      </div>

      {/* Bottom Sheet App Menu Launcher */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-stone-100 dark:border-zinc-800">
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
              Semua Menu Aplikasi
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pilih halaman fitur yang ingin dibuka
            </p>
          </DialogHeader>

          <div className="p-4 space-y-2 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {APP_MENU_ITEMS.map(item => {
                const Icon = item.icon;
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all active:scale-[0.99] touch-manipulation',
                      active
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                        : 'bg-stone-50/80 dark:bg-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border-stone-200/70 dark:border-zinc-800'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs',
                          active
                            ? 'bg-white/15 dark:bg-zinc-900/10 text-white dark:text-zinc-900'
                            : item.color
                        )}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm truncate">
                          {item.label}
                        </p>
                        <p
                          className={cn(
                            'text-[11px] truncate mt-0.5',
                            active
                              ? 'text-zinc-300 dark:text-zinc-600'
                              : 'text-zinc-500 dark:text-zinc-400'
                          )}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {active && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
