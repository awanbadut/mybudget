'use client';

import { useTransition } from 'react';
import { adminStopImpersonating } from '@/actions/admin';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

interface AdminImpersonationBannerProps {
  userName: string;
  userUsername: string;
  adminName?: string;
}

export function AdminImpersonationBanner({
  userName,
  userUsername,
  adminName,
}: AdminImpersonationBannerProps) {
  const [isPending, startTransition] = useTransition();

  function handleReturn() {
    startTransition(async () => {
      await adminStopImpersonating();
    });
  }

  return (
    <div className="sticky top-0 z-[9998] bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-3 border-b border-amber-600/30">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="w-4 h-4 text-zinc-950 flex-shrink-0 animate-bounce" />
        <span className="truncate">
          <strong>Mode Impersonasi Admin:</strong> Sedang mengoperasikan akun <strong>{userName}</strong> (@{userUsername}) {adminName ? `(oleh ${adminName})` : ''}
        </span>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={handleReturn}
        className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50 rounded-lg text-xs font-bold transition-all shadow-sm flex-shrink-0 active:scale-95 touch-manipulation"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ArrowLeft className="w-3.5 h-3.5" />
        )}
        <span>Kembali ke Admin</span>
      </button>
    </div>
  );
}
