'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, Timer } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceBannerProps {
  title?: string;
  estimatedEndTime?: string;
}

function parseTargetTimestamp(endTimeStr: string): number | null {
  if (!endTimeStr) return null;
  const trimmed = endTimeStr.trim();
  const directDate = new Date(trimmed);
  if (!isNaN(directDate.getTime()) && directDate.getFullYear() > 2020) {
    return directDate.getTime();
  }
  const match = trimmed.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target.getTime() < Date.now()) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }
  return null;
}

export function MaintenanceBanner({ title, estimatedEndTime }: MaintenanceBannerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const target = parseTargetTimestamp(estimatedEndTime || '');
    if (!target) return;

    function updateTimer() {
      const diff = target! - Date.now();
      if (diff <= 0) {
        setTimeLeft('Waktu tercapai');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours > 0 ? `${hours}j ` : ''}${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}d`
      );
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [estimatedEndTime]);

  return (
    <div
      role="alert"
      className="sticky top-0 z-[9995] w-full bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-3 border-b border-amber-600/40 select-none animate-in fade-in-50"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Wrench className="w-4 h-4 text-zinc-950 flex-shrink-0 animate-bounce" />
        <span className="truncate">
          <strong>Mode Pemeliharaan Aktif:</strong> Akses umum ditutup {estimatedEndTime ? `(Estimasi: ${estimatedEndTime})` : ''} · Hanya Admin yang dapat mengakses.
        </span>
        {timeLeft && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-950/20 text-zinc-950 text-[11px] font-mono font-bold">
            <Timer className="w-3 h-3" />
            <span>{timeLeft}</span>
          </span>
        )}
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
