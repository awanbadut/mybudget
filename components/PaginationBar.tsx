'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function PaginationBar({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = 'data',
  className,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  // If total items fit within the smallest page size option and we are on page 1, no need to clutter UI
  const minOption = Math.min(...pageSizeOptions, pageSize);
  if (totalItems <= minOption && totalPages <= 1) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-3 bg-stone-50/80 dark:bg-zinc-900/80 border-t border-stone-100 dark:border-zinc-800 text-xs transition-colors',
        className
      )}
    >
      {/* Left: Range info + Page Size pills */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
          Menampilkan <strong className="text-zinc-900 dark:text-white">{startItem}–{endItem}</strong> dari{' '}
          <strong className="text-zinc-900 dark:text-white">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="inline-flex items-center gap-1 bg-stone-200/70 dark:bg-zinc-800 p-0.5 rounded-lg">
            {pageSizeOptions.map(size => {
              const active = pageSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    onPageSizeChange(size);
                    onPageChange(1);
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums transition-all touch-manipulation',
                    active
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  )}
                  title={`Tampilkan ${size} baris per halaman`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Prev / Page X of Y / Next */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between sm:justify-end gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-35 active:scale-95 transition-all touch-manipulation"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          <span className="px-2.5 py-1 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
            Hal {safePage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-35 active:scale-95 transition-all touch-manipulation"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
