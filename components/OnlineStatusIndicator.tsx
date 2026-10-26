'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Check } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

export function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    // Initial status
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    function handleOnline() {
      setIsOnline(true);
      setShowReconnected(true);
      triggerHaptic('success');
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    }

    function handleOffline() {
      setIsOnline(false);
      setShowReconnected(false);
      triggerHaptic('warning');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9990] pointer-events-none select-none transition-all duration-300">
      {!isOnline ? (
        <div className="px-4 py-2 rounded-full bg-rose-600/90 dark:bg-rose-950/90 text-white backdrop-blur-md shadow-lg border border-rose-400/40 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Koneksi Terputus (Mode Offline)</span>
        </div>
      ) : showReconnected ? (
        <div className="px-4 py-2 rounded-full bg-emerald-600/90 dark:bg-emerald-950/90 text-white backdrop-blur-md shadow-lg border border-emerald-400/40 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-3.5 h-3.5" />
          <span>Terhubung Kembali ✓</span>
        </div>
      ) : null}
    </div>
  );
}
