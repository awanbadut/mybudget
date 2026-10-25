'use client';

import { useState } from 'react';
import { Wallet, PieChart, BarChart3, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardTabsClientProps {
  summaryContent: React.ReactNode;
  cycleContent: React.ReactNode;
  analyticsContent: React.ReactNode;
  isHistorical?: boolean;
  cycleLabel?: string;
  txCount?: number;
}

export function DashboardTabsClient({
  summaryContent,
  cycleContent,
  analyticsContent,
  isHistorical = false,
  cycleLabel,
  txCount = 0,
}: DashboardTabsClientProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'cycle' | 'analytics'>(
    isHistorical ? 'cycle' : 'summary'
  );

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Sticky App-Style 3-Tab Switcher */}
      <div className="sticky top-2 z-30 bg-stone-100/95 dark:bg-zinc-800/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200/80 dark:border-zinc-700/80 shadow-xs grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={cn(
            'py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation',
            activeTab === 'summary'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          )}
        >
          <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Ringkasan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cycle')}
          className={cn(
            'py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation',
            activeTab === 'cycle'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          )}
        >
          <PieChart className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Siklus &amp; Budget</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={cn(
            'py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation',
            activeTab === 'analytics'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          )}
        >
          <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Analisis</span>
        </button>
      </div>

      {/* Tab 1: Ringkasan & Dompet */}
      {activeTab === 'summary' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {summaryContent}

          {/* Quick Jump Banner to Tab 2 (Evaluasi Siklus & Filter Transaksi) */}
          <button
            type="button"
            onClick={() => setActiveTab('cycle')}
            className="w-full p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 flex items-center justify-between gap-3 text-left shadow-xs transition-all active:scale-[0.99] touch-manipulation"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center flex-shrink-0">
                <PieChart className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                  Lihat Evaluasi Siklus &amp; Filter Transaksi ({txCount})
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  Rincian sisa uang pos budget, perbandingan siklus lalu &amp; filter bank/kategori
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Tab 2: Evaluasi Siklus & Pos Budgeting */}
      {activeTab === 'cycle' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {cycleContent}
        </div>
      )}

      {/* Tab 3: Analisis, Grafik & Kekayaan */}
      {activeTab === 'analytics' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {analyticsContent}
        </div>
      )}
    </div>
  );
}
