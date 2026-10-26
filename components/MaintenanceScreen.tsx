'use client';

import React from 'react';
import { Wrench, RefreshCw, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceScreenProps {
  title?: string;
  message?: string;
  estimatedEndTime?: string;
}

export function MaintenanceScreen({
  title = 'Sistem Sedang Dalam Pemeliharaan',
  message = 'Kami sedang melakukan peningkatan performa dan pembaruan sistem. Mohon tunggu beberapa saat.',
  estimatedEndTime = '',
}: MaintenanceScreenProps) {
  function handleRefresh() {
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0A0A0C] text-zinc-900 dark:text-zinc-50 flex items-center justify-center p-4 sm:p-6 font-sans select-none">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900/90 rounded-3xl border border-stone-200/90 dark:border-zinc-800 p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center space-y-6 animate-in fade-in-50 duration-300">
        {/* Animated Tool Gear/Wrench Badge */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/20 dark:bg-amber-400/10 blur-xl animate-pulse" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 relative z-10">
            <Wrench className="w-8 h-8 animate-spin duration-3000" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Pemeliharaan Sistem Sedang Berlangsung</span>
        </div>

        {/* Title & Message */}
        <div className="space-y-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        {/* Estimated Completion Timer if provided */}
        {estimatedEndTime && (
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700/60 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Estimasi Selesai: <strong>{estimatedEndTime}</strong></span>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 touch-manipulation"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Cek Status &amp; Muat Ulang</span>
          </button>

          <Link
            href="/login?admin=1"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors pt-2 font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Login Khusus Administrator</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
