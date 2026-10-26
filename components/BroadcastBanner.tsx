'use client';

import { useState } from 'react';
import { Megaphone, X } from 'lucide-react';

export function BroadcastBanner({ message }: { message: string }) {
  const [closed, setClosed] = useState(false);

  if (!message || closed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-sm flex items-center justify-between gap-3 animate-in fade-in-50">
      <div className="flex items-center gap-2 min-w-0">
        <Megaphone className="w-4 h-4 text-indigo-200 flex-shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      <button
        onClick={() => setClosed(true)}
        className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors flex-shrink-0"
        title="Tutup pengumuman"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
