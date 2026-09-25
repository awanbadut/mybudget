'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ArrowLeftRight, PieChart, CreditCard, Target, BarChart3, Settings, Wallet, LogOut, ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/actions/auth';
import { useTransition } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: PieChart },
  { href: '/debts', label: 'Utang', icon: CreditCard },
  { href: '/savings', label: 'Tabungan', icon: Target },
  { href: '/reports', label: 'Laporan', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
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
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex-col shadow-sm z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">My Budget</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {allNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        {userName && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-400 capitalize">{userRole === 'admin' ? '👑 Admin' : 'User'}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {isPending ? 'Keluar...' : 'Keluar'}
        </button>
      </div>
    </aside>
  );
}
