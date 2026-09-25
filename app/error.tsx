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

  const isDbConfigError =
    error.message?.includes('DATABASE_URL') ||
    error.message?.includes('database') ||
    error.digest?.length;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">Data gagal dimuat</h2>
          <p className="text-sm text-gray-500 mt-2">
            Terjadi kendala saat menghubungkan ke database server.
          </p>
        </div>

        {error.digest && (
          <div className="bg-gray-50 rounded-xl p-3 text-left space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Diagnostic Info
            </p>
            <p className="text-xs text-gray-600 font-mono break-all">
              Error Digest: {error.digest}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              💡 Pastikan Environment Variable <strong>DATABASE_URL</strong> sudah diatur di dashboard Vercel.
            </p>
          </div>
        )}

        <div className="pt-2">
          <Button onClick={() => reset()} className="w-full gap-2">
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </Button>
        </div>
      </div>
    </div>
  );
}
