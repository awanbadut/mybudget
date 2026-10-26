'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TabErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TabErrorBoundary caught an error in tab:', this.props.tabName, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs text-center space-y-3.5 my-2 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200/60 dark:border-amber-800/40">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
              Tampilan {this.props.tabName || 'Tab'} Mengalami Kendala
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Terjadi kendala rendering grafis lokal pada tab ini. Seluruh data keuangan Anda tetap aman.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 touch-manipulation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang {this.props.tabName || 'Tab'}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
