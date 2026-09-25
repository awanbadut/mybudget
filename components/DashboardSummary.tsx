'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { ArrowUpRight, ArrowDownLeft, Eye, EyeOff, Wallet, PiggyBank } from 'lucide-react';

interface DashboardSummaryProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  savingRate: number;
  effectiveIncome: number;
}

export function DashboardSummary({
  balance,
  totalIncome,
  totalExpense,
  totalSavings,
  savingRate,
  effectiveIncome,
}: DashboardSummaryProps) {
  const [showAmount, setShowAmount] = useState(true);

  const display = (val: number, isNegative = false) => {
    if (!showAmount) return '••••••••';
    const formatted = formatCurrency(Math.abs(val));
    return isNegative ? `-${formatted}` : formatted;
  };

  const isPositive = balance >= 0;

  return (
    <section className="space-y-2">
      {/* BroadSheet Ledger Card - Hallmark Custom-04 Aesthetic */}
      <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 sm:p-6 shadow-[3px_3px_0px_#24201D] relative">
        {/* Top Header Bar / Press Stamp */}
        <div className="flex items-center justify-between border-b border-[#24201D]/20 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#D9381E] tracking-wider uppercase">
              PLANK 01
            </span>
            <span className="text-[#24201D]/30">/</span>
            <span className="font-mono text-xs font-semibold text-[#706860] uppercase tracking-wider">
              Buku Kas & Saldo Operasional
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAmount(!showAmount)}
            className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#24201D] hover:text-[#D9381E] bg-[#EDE6DC] border border-[#24201D]/30 px-2.5 py-1 rounded-[2px] transition-colors"
            aria-label={showAmount ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
          >
            {showAmount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#2A7B88]" />}
            <span>{showAmount ? 'HIDE' : 'SHOW'}</span>
          </button>
        </div>

        {/* Main Display: Net Balance */}
        <div className="mb-5">
          <p className="font-mono text-[11px] text-[#706860] uppercase tracking-widest mb-1">
            Saldo Kas Bersih Saat Ini
          </p>
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <p className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-[#24201D] tabular-nums">
              {display(balance, balance < 0)}
            </p>
            <span
              className={`font-mono text-xs font-semibold px-2 py-0.5 border rounded-[2px] uppercase ${
                isPositive
                  ? 'bg-[#EAF4F5] border-[#2A7B88] text-[#2A7B88]'
                  : 'bg-[#FBEBE8] border-[#D9381E] text-[#D9381E]'
              }`}
            >
              {isPositive ? 'KAS AMAN' : 'DEFISIT'}
            </span>
          </div>
          <p className="font-sans text-xs text-[#706860] mt-1.5 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                isPositive ? 'bg-[#2A7B88]' : 'bg-[#D9381E]'
              }`}
            />
            {isPositive
              ? 'Arus kas berada pada level aman untuk siklus operasional.'
              : 'Perhatian: Total pengeluaran melampaui pemasukan tercatat.'}
          </p>
        </div>

        {/* Financial Division Grid (4 Columns) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-3 border-t-2 border-[#24201D]">
          {/* Pemasukan */}
          <div className="bg-[#EDE6DC] border border-[#24201D]/25 p-3 rounded-[2px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[11px] font-bold text-[#2A7B88] uppercase tracking-wider">
                Pemasukan
              </span>
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#2A7B88]" />
            </div>
            <p className="font-mono font-bold text-base sm:text-lg text-[#24201D] tabular-nums truncate">
              {display(totalIncome)}
            </p>
            {effectiveIncome > 0 && effectiveIncome !== totalIncome && (
              <p className="font-mono text-[10px] text-[#706860] mt-0.5 truncate">
                Est. Gaji: {display(effectiveIncome)}
              </p>
            )}
          </div>

          {/* Pengeluaran */}
          <div className="bg-[#EDE6DC] border border-[#24201D]/25 p-3 rounded-[2px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[11px] font-bold text-[#D9381E] uppercase tracking-wider">
                Pengeluaran
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#D9381E]" />
            </div>
            <p className="font-mono font-bold text-base sm:text-lg text-[#24201D] tabular-nums truncate">
              {display(totalExpense)}
            </p>
            <p className="font-mono text-[10px] text-[#706860] mt-0.5">
              Bulan ini
            </p>
          </div>

          {/* Tabungan */}
          <div className="bg-[#EDE6DC] border border-[#24201D]/25 p-3 rounded-[2px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[11px] font-bold text-[#24201D] uppercase tracking-wider">
                Tabungan
              </span>
              <PiggyBank className="w-3.5 h-3.5 text-[#24201D]" />
            </div>
            <p className="font-mono font-bold text-base sm:text-lg text-[#24201D] tabular-nums truncate">
              {display(totalSavings)}
            </p>
            <p className="font-mono text-[10px] text-[#706860] mt-0.5">
              Total terkumpul
            </p>
          </div>

          {/* Saving Rate */}
          <div className="bg-[#EDE6DC] border border-[#24201D]/25 p-3 rounded-[2px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[11px] font-bold text-[#24201D] uppercase tracking-wider">
                Rasio Simpan
              </span>
              <Wallet className="w-3.5 h-3.5 text-[#24201D]" />
            </div>
            <p className="font-mono font-bold text-base sm:text-lg text-[#24201D] tabular-nums truncate">
              {savingRate}%
            </p>
            <p className="font-mono text-[10px] text-[#2A7B88] mt-0.5 font-semibold">
              Target min. 20%
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
