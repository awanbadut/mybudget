'use client';

import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';

export function BroadcastBanner({ message }: { message: string }) {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!closed && message) {
      document.documentElement.style.setProperty('--broadcast-height', '36px');
    } else {
      document.documentElement.style.setProperty('--broadcast-height', '0px');
    }

    return () => {
      document.documentElement.style.setProperty('--broadcast-height', '0px');
    };
  }, [closed, message]);

  if (!message || closed) return null;

  return (
    <div
      role="region"
      aria-label="Pengumuman Sistem"
      className="sticky top-0 z-[60] w-full h-9 bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 text-white shadow-md border-b border-indigo-500/40 select-none animate-in fade-in-50 duration-200"
    >
      <div className="flex items-center h-full px-3 sm:px-4 gap-2.5 max-w-full overflow-hidden">
        {/* Fixed Left Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-xs text-[11px] font-bold text-indigo-100 flex-shrink-0 z-20 border border-white/10 shadow-xs">
          <Megaphone className="w-3.5 h-3.5 text-amber-300 animate-pulse flex-shrink-0" />
          <span className="tracking-wide uppercase text-[10px] font-mono">PENGUMUMAN</span>
        </div>

        {/* Marquee Running Text Container */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center group cursor-default">
          {/* Edge Fade Masks */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-indigo-700 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-indigo-800 to-transparent z-10" />

          {/* Running Text */}
          <div
            title="Arahkan kursor untuk menjeda teks"
            className="animate-marquee whitespace-nowrap text-xs sm:text-[13px] font-semibold text-white/95 tracking-wide items-center"
          >
            <span className="mx-6 inline-flex items-center gap-3">
              {message}
              <span className="text-amber-300 opacity-80 text-[10px]">✦</span>
            </span>
            <span className="mx-6 inline-flex items-center gap-3">
              {message}
              <span className="text-amber-300 opacity-80 text-[10px]">✦</span>
            </span>
            <span className="mx-6 inline-flex items-center gap-3">
              {message}
              <span className="text-amber-300 opacity-80 text-[10px]">✦</span>
            </span>
            <span className="mx-6 inline-flex items-center gap-3">
              {message}
              <span className="text-amber-300 opacity-80 text-[10px]">✦</span>
            </span>
          </div>
        </div>

        {/* Fixed Right Dismiss Button */}
        <button
          onClick={() => setClosed(true)}
          className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 z-20 touch-manipulation active:scale-95"
          title="Tutup pengumuman"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
