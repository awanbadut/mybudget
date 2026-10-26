'use client';

import { useState } from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DatabaseErrorRetryProps {
  error?: string | null;
}

export function DatabaseErrorRetry({ error }: DatabaseErrorRetryProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    window.location.reload();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6 sm:p-8 max-w-lg mx-auto text-center space-y-4 my-8 shadow-sm w-full transition-colors">
      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30">
        <WifiOff className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h2 className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white">
          Koneksi Database Terputus Sesaat
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Server sedang mengalami jeda koneksi ke basis data. Ketuk tombol di bawah untuk memuat ulang halaman.
        </p>
      </div>

      {error && (
        <div className="bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 p-3 rounded-xl text-[11px] font-mono text-left break-all max-h-32 overflow-y-auto">
          {error}
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full sm:w-auto gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Memuat Ulang...' : 'Coba Muat Ulang Sekarang'}
        </Button>
      </div>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        Tips: Pastikan koneksi internet stabil atau periksa konfigurasi server database Anda.
      </p>
    </div>
  );
}
