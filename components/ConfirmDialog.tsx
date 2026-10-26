'use client';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
}

/**
 * Pengganti window.confirm(): konsisten dengan tema aplikasi,
 * ramah layar sentuh, dan dapat diakses (fokus & Esc ditangani Dialog).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  destructive = false,
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-5 sm:p-6 w-full">
        <DialogHeader>
          <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
        <DialogFooter className="pt-3 flex flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="flex-1 sm:flex-initial min-h-[40px] px-4 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 touch-manipulation disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              'flex-1 sm:flex-initial min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold shadow-sm touch-manipulation disabled:opacity-60 text-white',
              destructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
            )}
          >
            {pending ? 'Memproses...' : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
