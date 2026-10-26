'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/currency';
import { triggerHaptic } from '@/lib/utils';

interface BalanceVisibilityContextType {
  showBalance: boolean;
  toggleBalance: () => void;
  formatMasked: (amount: number, options?: { showSign?: boolean }) => string;
}

const BalanceVisibilityContext = createContext<BalanceVisibilityContextType>({
  showBalance: true,
  toggleBalance: () => {},
  formatMasked: (amount: number) => formatCurrency(amount),
});

const STORAGE_KEY = 'mybudget_show_balance';

export function BalanceVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [showBalance, setShowBalance] = useState<boolean>(true);

  // Initialize from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setShowBalance(saved === 'true');
      }
    } catch {
      // In case localStorage is blocked in private browsing
    }

    // Sync across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setShowBalance(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleBalance = useCallback(() => {
    triggerHaptic('light');
    setShowBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const formatMasked = useCallback(
    (amount: number, options?: { showSign?: boolean }) => {
      if (!showBalance) {
        return '••••••';
      }
      const absFormatted = formatCurrency(Math.abs(amount));
      if (amount < 0) return `-${absFormatted}`;
      if (options?.showSign && amount > 0) return `+${absFormatted}`;
      return absFormatted;
    },
    [showBalance]
  );

  return (
    <BalanceVisibilityContext.Provider value={{ showBalance, toggleBalance, formatMasked }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  const context = useContext(BalanceVisibilityContext);
  if (!context) {
    return {
      showBalance: true,
      toggleBalance: () => {},
      formatMasked: (amount: number) => formatCurrency(amount),
    };
  }
  return context;
}
