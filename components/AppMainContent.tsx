'use client';

import React from 'react';
import { useSidebar } from '@/components/SidebarProvider';
import { cn } from '@/lib/utils';

interface AppMainContentProps {
  hasSession: boolean;
  children: React.ReactNode;
}

export function AppMainContent({ hasSession, children }: AppMainContentProps) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={cn(
        'flex-1 min-w-0 w-full max-w-full overflow-x-hidden pb-28 md:pb-12 transition-[margin-left] duration-300 ease-in-out',
        hasSession ? (isCollapsed ? 'md:ml-[72px]' : 'md:ml-60') : ''
      )}
    >
      {children}
    </main>
  );
}
