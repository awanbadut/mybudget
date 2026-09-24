'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, PieChart, Target, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: PieChart },
  { href: '/savings', label: 'Tabungan', icon: Target },
  { href: '/reports', label: 'Lainnya', icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-2"
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
              <span className={cn('text-xs font-medium', isActive ? 'text-blue-600' : 'text-gray-400')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
