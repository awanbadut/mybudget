'use client';

import { useState } from 'react';
import { Wallet, PieChart, BarChart3, ArrowRight } from 'lucide-react';
import { cn, triggerHaptic } from '@/lib/utils';
import { TabErrorBoundary } from '@/components/TabErrorBoundary';

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

  function handleTabChange(tab: 'summary' | 'cycle' | 'analytics') {
    triggerHaptic('selection');
    setActiveTab(tab);
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Sticky App-Style 3-Tab Switcher (High Contrast & Tactile Floating UX) */}
      <div className="sticky top-[calc(var(--broadcast-height,0px)+3.75rem)] md:top-2 z-30 bg-stone-100/90 dark:bg-zinc-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-stone-200/90 dark:border-zinc-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] grid grid-cols-3 gap-1.5 transition-all">
        <button
          type="button"
          onClick={() => handleTabChange('summary')}
          className={cn(
            'relative py-2.5 px-2 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 active:scale-[0.97] touch-manipulation select-none',
            activeTab === 'summary'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-zinc-800/60'
          )}
        >
          <Wallet className={cn("w-4 h-4 flex-shrink-0 transition-colors", activeTab === 'summary' ? 'text-white dark:text-zinc-950' : 'text-zinc-500 dark:text-zinc-400')} />
          <span className="truncate">Ringkasan</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('cycle')}
          className={cn(
            'relative py-2.5 px-2 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 active:scale-[0.97] touch-manipulation select-none',
            activeTab === 'cycle'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-zinc-800/60'
          )}
        >
          <PieChart className={cn("w-4 h-4 flex-shrink-0 transition-colors", activeTab === 'cycle' ? 'text-white dark:text-zinc-950' : 'text-zinc-500 dark:text-zinc-400')} />
          <span className="truncate">Siklus &amp; Budget</span>
          {txCount > 0 && (
            <span className={cn(
              'hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums transition-colors',
              activeTab === 'cycle'
                ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                : 'bg-stone-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            )}>
              {txCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('analytics')}
          className={cn(
            'relative py-2.5 px-2 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 active:scale-[0.97] touch-manipulation select-none',
            activeTab === 'analytics'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-zinc-800/60'
          )}
        >
          <BarChart3 className={cn("w-4 h-4 flex-shrink-0 transition-colors", activeTab === 'analytics' ? 'text-white dark:text-zinc-950' : 'text-zinc-500 dark:text-zinc-400')} />
          <span className="truncate">Analisis</span>
        </button>
      </div>

      {/* Tab 1: Ringkasan & Dompet */}
      {activeTab === 'summary' && (
        <TabErrorBoundary tabName="Ringkasan">
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {summaryContent}

            {/* Quick Jump Banner to Tab 2 (Evaluasi Siklus & Filter Transaksi) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('cycle');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 hover:border-zinc-900/30 dark:hover:border-zinc-500 flex items-center justify-between gap-3 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all active:scale-[0.99] touch-manipulation group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <PieChart className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                      Buka Evaluasi Siklus &amp; Pos Anggaran
                    </p>
                    {txCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {txCount} Transaksi
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    Cek sisa uang tiap pos, perbandingan siklus lalu &amp; filter mutasi bank
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          </div>
        </TabErrorBoundary>
      )}

      {/* Tab 2: Evaluasi Siklus & Pos Budgeting */}
      {activeTab === 'cycle' && (
        <TabErrorBoundary tabName="Siklus & Anggaran">
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {cycleContent}
          </div>
        </TabErrorBoundary>
      )}

      {/* Tab 3: Analisis, Grafik & Kekayaan */}
      {activeTab === 'analytics' && (
        <TabErrorBoundary tabName="Analisis">
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {analyticsContent}
          </div>
        </TabErrorBoundary>
      )}
    </div>
  );
}
