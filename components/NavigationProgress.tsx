'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // When route changes, complete and hide progress bar
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, loading]);

  // Intercept internal link clicks for 0ms instant feedback
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target || !target.href) return;

      const currentOrigin = window.location.origin;
      if (!target.href.startsWith(currentOrigin)) return;
      if (target.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const targetUrl = new URL(target.href);
      const isCurrentPage =
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search;

      if (!isCurrentPage) {
        setLoading(true);
        setProgress(30);
        setTimeout(() => setProgress(70), 100);
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[2.5px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
