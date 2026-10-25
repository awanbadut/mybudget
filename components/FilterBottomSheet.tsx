'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CycleOption } from '@/components/CycleSelector';
import {
  Search,
  SlidersHorizontal,
  X,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Building2,
  Smartphone,
  Coins,
  Wallet,
  Tag,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterCategoryOption {
  id: string;
  name: string;
  type?: string;
}

export interface FilterAccountOption {
  id: string;
  name: string;
  type?: string;
}

interface FilterBottomSheetProps {
  // Search
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;

  // Type filter ('all' | 'expense' | 'income' | 'transfer' | 'out' | 'in')
  filterType?: string;
  onFilterTypeChange?: (t: any) => void;
  typeOptions?: Array<{ id: string; label: string; icon?: 'out' | 'in' | 'transfer' }>;

  // Category filter
  categories?: FilterCategoryOption[];
  filterCategory: string;
  onFilterCategoryChange: (catId: string) => void;

  // Account / Bank / Cash filter
  accounts?: FilterAccountOption[];
  filterAccount?: string;
  onFilterAccountChange?: (accId: string) => void;

  // Optional Cycle filter
  cycles?: CycleOption[];
  filterCycle?: string;
  onFilterCycleChange?: (cycOffset: string) => void;

  // Optional Month filter
  months?: Array<{ value: string; label: string }>;
  filterMonth?: string;
  onFilterMonthChange?: (m: string) => void;

  // Optional right slot (e.g. Export CSV button)
  rightSlot?: React.ReactNode;
}

const DEFAULT_TYPE_OPTIONS: Array<{ id: string; label: string; icon?: 'out' | 'in' | 'transfer' }> = [
  { id: 'all', label: 'Semua' },
  { id: 'expense', label: 'Keluar', icon: 'out' },
  { id: 'income', label: 'Masuk', icon: 'in' },
  { id: 'transfer', label: 'Transfer', icon: 'transfer' },
];

export function FilterBottomSheet({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Cari nama transaksi atau catatan...',
  showSearch = true,
  filterType,
  onFilterTypeChange,
  typeOptions = DEFAULT_TYPE_OPTIONS,
  categories = [],
  filterCategory,
  onFilterCategoryChange,
  accounts = [],
  filterAccount = 'all',
  onFilterAccountChange,
  cycles = [],
  filterCycle = 'all',
  onFilterCycleChange,
  months = [],
  filterMonth = 'all',
  onFilterMonthChange,
  rightSlot,
}: FilterBottomSheetProps) {
  const [open, setOpen] = useState(false);

  // Count active sheet filters
  let activeCount = 0;
  if (filterCategory !== 'all') activeCount++;
  if (onFilterAccountChange && filterAccount !== 'all') activeCount++;
  if (onFilterCycleChange && filterCycle !== 'all') activeCount++;
  if (onFilterMonthChange && filterMonth !== 'all') activeCount++;

  const activeCategoryName =
    filterCategory !== 'all'
      ? categories.find(c => c.id === filterCategory || c.name === filterCategory)?.name || filterCategory
      : null;

  const activeAccountName =
    onFilterAccountChange && filterAccount !== 'all'
      ? accounts.find(a => a.id === filterAccount)?.name || 'Dompet'
      : null;

  const activeCycleLabel =
    onFilterCycleChange && filterCycle !== 'all'
      ? cycles.find(c => String(c.offset) === filterCycle)?.label || 'Siklus'
      : null;

  const activeMonthLabel =
    onFilterMonthChange && filterMonth !== 'all'
      ? months.find(m => m.value === filterMonth)?.label || filterMonth
      : null;

  function handleResetAll() {
    onFilterCategoryChange('all');
    if (onFilterAccountChange) onFilterAccountChange('all');
    if (onFilterCycleChange) onFilterCycleChange('all');
    if (onFilterMonthChange) onFilterMonthChange('all');
    if (onFilterTypeChange) onFilterTypeChange('all');
    if (onSearchChange) onSearchChange('');
  }

  return (
    <div className="space-y-2.5 w-full min-w-0">
      {/* Row 1: Segmented Type Control (No emojis, fits 100% width cleanly on mobile) */}
      {onFilterTypeChange && (
        <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 dark:bg-zinc-800/90 rounded-2xl w-full">
          {typeOptions.map(opt => {
            const isActive = filterType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onFilterTypeChange(opt.id)}
                className={cn(
                  'py-2 px-1.5 rounded-xl text-[11.5px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 touch-manipulation truncate',
                  isActive
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                )}
              >
                {opt.icon === 'out' && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                )}
                {opt.icon === 'in' && (
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                )}
                {opt.icon === 'transfer' && (
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                )}
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Row 2: Search Input + Filter Bottom Sheet Trigger Button */}
      <div className="flex items-center gap-2 w-full min-w-0">
        {showSearch && onSearchChange && (
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex-shrink-0 touch-manipulation',
            activeCount > 0
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-stone-200/80 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {rightSlot}
      </div>

      {/* Row 3: Active Filter Removable Chips (Only shown when filters are active) */}
      {activeCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {activeAccountName && onFilterAccountChange && (
            <button
              type="button"
              onClick={() => onFilterAccountChange('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 active:scale-95"
            >
              <Wallet className="w-3 h-3" />
              <span>{activeAccountName}</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          )}

          {activeCategoryName && (
            <button
              type="button"
              onClick={() => onFilterCategoryChange('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 active:scale-95"
            >
              <Tag className="w-3 h-3" />
              <span>{activeCategoryName}</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          )}

          {activeCycleLabel && onFilterCycleChange && (
            <button
              type="button"
              onClick={() => onFilterCycleChange('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 active:scale-95"
            >
              <Calendar className="w-3 h-3" />
              <span>{activeCycleLabel}</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          )}

          {activeMonthLabel && onFilterMonthChange && (
            <button
              type="button"
              onClick={() => onFilterMonthChange('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:scale-95"
            >
              <Calendar className="w-3 h-3" />
              <span>{activeMonthLabel}</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleResetAll}
            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 hover:underline"
          >
            Reset Semua
          </button>
        </div>
      )}

      {/* Bottom Sheet Filter Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 p-0 overflow-hidden flex flex-col max-h-[86vh]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-stone-100 dark:border-zinc-800">
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">
                  Filter Transaksi &amp; Rekap
                </DialogTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Pilih dompet bank/tunai atau kategori tanpa perlu geser ke samping
                </p>
              </div>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Section 1: Pilih Bank / Dompet / Tunai */}
            {onFilterAccountChange && accounts.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Pilih Bank / E-Wallet / Tunai</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onFilterAccountChange('all')}
                    className={cn(
                      'p-2.5 rounded-xl text-xs font-bold border text-left flex items-center justify-between gap-2 transition-all active:scale-95 touch-manipulation',
                      filterAccount === 'all'
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                        : 'bg-stone-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-stone-200/70 dark:border-zinc-800'
                    )}
                  >
                    <span className="truncate">Semua Dompet</span>
                    {filterAccount === 'all' && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>

                  {accounts.map(acc => {
                    const isSelected = filterAccount === acc.id;
                    const AccIcon =
                      acc.type === 'bank'
                        ? Building2
                        : acc.type === 'ewallet'
                        ? Smartphone
                        : acc.type === 'cash'
                        ? Coins
                        : Wallet;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => onFilterAccountChange(acc.id)}
                        className={cn(
                          'p-2.5 rounded-xl text-xs font-bold border text-left flex items-center justify-between gap-2 transition-all active:scale-95 touch-manipulation',
                          isSelected
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                            : 'bg-stone-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-stone-200/70 dark:border-zinc-800'
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AccIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
                          <span className="truncate">{acc.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Pilih Kategori (Wrap Grid, Zero Horizontal Scroll!) */}
            {categories.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Pilih Kategori Pos</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onFilterCategoryChange('all')}
                    className={cn(
                      'p-2.5 rounded-xl text-xs font-bold border text-left flex items-center justify-between gap-2 transition-all active:scale-95 touch-manipulation',
                      filterCategory === 'all'
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                        : 'bg-stone-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-stone-200/70 dark:border-zinc-800'
                    )}
                  >
                    <span className="truncate">Semua Kategori</span>
                    {filterCategory === 'all' && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>

                  {categories.map(cat => {
                    const isSelected = filterCategory === cat.id || filterCategory === cat.name;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onFilterCategoryChange(cat.id)}
                        className={cn(
                          'p-2.5 rounded-xl text-xs font-bold border text-left flex items-center justify-between gap-2 transition-all active:scale-95 touch-manipulation',
                          isSelected
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                            : 'bg-stone-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-stone-200/70 dark:border-zinc-800'
                        )}
                      >
                        <span className="truncate">{cat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 3: Optional Cycle Picker inside Filter Sheet */}
            {onFilterCycleChange && cycles.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Rentang Siklus (25 ke 24)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onFilterCycleChange('all');
                    }}
                    className={cn(
                      'p-2.5 rounded-xl text-xs font-bold border text-left flex items-center justify-between gap-2 transition-all active:scale-95',
                      filterCycle === 'all'
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                        : 'bg-stone-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-stone-200/70 dark:border-zinc-800'
                    )}
                  >
                    <span>Semua Siklus Waktu</span>
                    {filterCycle === 'all' && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>

                  {cycles.slice(0, 6).map(c => {
                    const isSelected = filterCycle === String(c.offset);
                    return (
                      <button
                        key={c.offset}
                        type="button"
                        onClick={() => {
                          onFilterCycleChange(String(c.offset));
                          if (onFilterMonthChange) onFilterMonthChange('all');
                        }}
                        className={cn(
                          'p-2.5 rounded-xl text-xs font-bold border text-left flex items-center justify-between gap-2 transition-all active:scale-95',
                          isSelected
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                            : 'bg-stone-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-stone-200/70 dark:border-zinc-800'
                        )}
                      >
                        <span className="truncate">
                          {c.offset === 0 ? `Siklus Ini (${c.label})` : c.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="p-4 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900 flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm active:scale-[0.99] transition-all"
            >
              Terapkan Filter {activeCount > 0 ? `(${activeCount} Aktif)` : ''}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
