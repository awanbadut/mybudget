'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, PieChart, Target, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: PieChart },
  { href: '/savings', label: 'Tabungan', icon: Target },
  { href: '/settings', label: 'Setelan', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  // Don't show on login/register pages
  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-2 py-2 min-w-0"
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
              <span className={cn('text-[10px] font-medium', isActive ? 'text-blue-600' : 'text-gray-400')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
