'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone || dismissed) return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  }

  // Show if prompt is available OR if on iOS mobile
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <div className="fixed bottom-20 left-3 right-3 md:left-auto md:right-6 md:bottom-6 md:w-96 z-40 bg-zinc-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.18)] border border-stone-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold truncate text-white">Download My Budget di HP</p>
            <p className="text-[11px] text-zinc-400 truncate">Akses cepat & offline layaknya aplikasi native</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-white text-zinc-900 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:bg-stone-100 active:scale-95 transition-all touch-manipulation"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 font-sans">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900">Pasang di iPhone / iPad</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Ikuti 2 langkah mudah berikut untuk menambahkan aplikasi ke Layar Utama:
            </p>
            <div className="space-y-2.5 text-xs text-zinc-700">
              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tekan ikon <strong>Bagikan (Share)</strong> <Share className="w-3.5 h-3.5 inline text-zinc-900 mx-1" /> di bilah bawah browser Safari.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Gulir ke bawah dan pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-xl font-semibold text-xs transition-all touch-manipulation shadow-sm"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
