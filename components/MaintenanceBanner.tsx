'use client';

import React from 'react';
import { AlertTriangle, Wrench } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceBannerProps {
  title?: string;
  estimatedEndTime?: string;
}

export function MaintenanceBanner({ title, estimatedEndTime }: MaintenanceBannerProps) {
  return (
    <div
      role="alert"
      className="sticky top-0 z-[9995] w-full bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-3 border-b border-amber-600/40 select-none animate-in fade-in-50"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Wrench className="w-4 h-4 text-zinc-950 flex-shrink-0 animate-bounce" />
        <span className="truncate">
          <strong>Mode Pemeliharaan Aktif:</strong> Akses user umum dinonaktifkan sementara {estimatedEndTime ? `(Estimasi: ${estimatedEndTime})` : ''} · Hanya Admin yang dapat mengakses.
        </span>
      </div>

      <Link
        href="/admin#maintenance"
        className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 text-white hover:bg-zinc-800 rounded-lg text-xs font-bold transition-all shadow-xs flex-shrink-0 active:scale-95 touch-manipulation"
      >
        <span>Kelola di Admin</span>
      </Link>
    </div>
  );
}
