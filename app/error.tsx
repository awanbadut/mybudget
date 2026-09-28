'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-200/80 dark:border-zinc-800 p-8 max-w-md w-full text-center space-y-4 transition-colors">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Data gagal dimuat</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Terjadi kendala saat menghubungkan ke database server.
          </p>
        </div>

        {error.digest && (
          <div className="bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 rounded-xl p-3 text-left space-y-1">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Diagnostic Info
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono break-all">
              Error Digest: {error.digest}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              💡 Pastikan Environment Variable <strong>DATABASE_URL</strong> sudah diatur di dashboard Vercel.
            </p>
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={() => reset()}
            className="w-full gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </Button>
        </div>
      </div>
    </div>
  );
}
