'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, PieChart, CreditCard, Target, BarChart3, Settings, BookOpen, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/actions/auth';
import { useTransition } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard Kas', icon: Home, code: '01' },
  { href: '/transactions', label: 'Buku Transaksi', icon: ArrowLeftRight, code: '02' },
  { href: '/budget', label: 'Pagu Anggaran', icon: PieChart, code: '03' },
  { href: '/debts', label: 'Cicilan Utang', icon: CreditCard, code: '04' },
  { href: '/savings', label: 'Target Tabungan', icon: Target, code: '05' },
  { href: '/reports', label: 'Laporan Berkala', icon: BarChart3, code: '06' },
  { href: '/settings', label: 'Pengaturan Akun', icon: Settings, code: '07' },
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
    ...(userRole === 'admin' ? [{ href: '/admin', label: 'Admin Panel', icon: ShieldCheck, code: 'AD' }] : []),
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#F4F0EA] border-r-2 border-[#24201D] flex-col z-50">
      {/* Editorial Masthead */}
      <div className="p-6 border-b-2 border-[#24201D] bg-[#EDE6DC]">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] font-bold text-[#D9381E] uppercase tracking-widest">
            EDITION · FIX Nº 25-25
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#24201D] text-[#F4F0EA] flex items-center justify-center font-mono font-bold text-xs shadow-[2px_2px_0px_#D9381E]">
            MB
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl text-[#24201D] uppercase leading-none tracking-tight">
              MY BUDGET
            </h1>
            <p className="font-mono text-[10px] text-[#706860] uppercase mt-0.5">
              Broadsheet Ledger
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <p className="font-mono text-[10px] font-bold text-[#706860] px-3 pt-2 pb-1 uppercase tracking-wider">
          Navigasi Buku Kas
        </p>
        {allNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 font-mono text-xs font-semibold transition-all',
                isActive
                  ? 'bg-[#EDE6DC] border-2 border-[#24201D] text-[#24201D] shadow-[2px_2px_0px_#24201D]'
                  : 'text-[#706860] hover:bg-[#EDE6DC]/60 hover:text-[#24201D] border border-transparent'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#D9381E]' : 'text-[#706860]')} />
                <span className="truncate">{item.label}</span>
              </div>
              <span className={cn('text-[10px] font-bold', isActive ? 'text-[#D9381E]' : 'text-[#706860]/60')}>
                [{item.code}]
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Letterpress Logout */}
      <div className="p-3 border-t-2 border-[#24201D] bg-[#EDE6DC] space-y-2">
        {userName && (
          <div className="p-2 border border-[#24201D]/30 bg-[#FAF7F2]">
            <p className="font-mono text-[10px] text-[#706860] uppercase">Operator</p>
            <p className="font-display font-bold text-sm text-[#24201D] uppercase truncate leading-tight">
              {userName}
            </p>
            <span className="font-mono text-[10px] font-bold text-[#2A7B88] uppercase">
              {userRole === 'admin' ? 'Role: Administrator' : 'Siklus: 25 - 25'}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2 font-mono text-xs font-bold text-[#F4F0EA] bg-[#24201D] hover:bg-[#D9381E] border border-[#24201D] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-all active:translate-x-[1px] active:translate-y-[1px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isPending ? 'LOGOUT...' : 'KELUAR AKUN'}</span>
        </button>
      </div>
    </aside>
  );
}
