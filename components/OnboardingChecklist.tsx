'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronRight, X, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingChecklistProps {
  hasSalary: boolean;
  hasTransaction: boolean;
  hasSavingsGoal: boolean;
}

const DISMISS_KEY = 'mybudget_checklist_dismissed';
const ONBOARDED_KEY = 'mybudget_onboarded';

export function OnboardingChecklist({
  hasSalary,
  hasTransaction,
  hasSavingsGoal,
}: OnboardingChecklistProps) {
  // Render setelah mount agar tidak berkedip / mismatch hydration (membaca localStorage)
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [wizardDone, setWizardDone] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
      setWizardDone(localStorage.getItem(ONBOARDED_KEY) === 'true');
    } catch {
      // localStorage bisa diblokir pada mode privat
    }
    setReady(true);
  }, []);

  const steps = [
    {
      key: 'setup',
      title: 'Atur gaji & siklus keuangan',
      hint: 'Supaya sisa uang per hari dihitung dengan benar',
      done: hasSalary || wizardDone,
      href: '/settings',
    },
    {
      key: 'transaction',
      title: 'Catat transaksi pertama',
      hint: 'Cukup 10 detik, bisa pakai tombol Catat Cepat',
      done: hasTransaction,
      href: '/transactions?action=new',
    },
    {
      key: 'savings',
      title: 'Buat target tabungan',
      hint: 'Misalnya dana darurat atau liburan',
      done: hasSavingsGoal,
      href: '/savings',
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  if (!ready || dismissed || allDone) return null;

  const nextStepKey = steps.find((s) => !s.done)?.key;
  const percent = Math.round((doneCount / steps.length) * 100);

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // abaikan
    }
    setDismissed(true);
  }

  return (
    <section
      aria-label="Panduan memulai"
      className="rounded-2xl border border-stone-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center flex-shrink-0">
            <Rocket className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
              Mulai dalam 3 langkah
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {doneCount} dari {steps.length} selesai
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Sembunyikan panduan memulai"
          title="Sembunyikan"
          className="p-2 -m-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl transition-colors touch-manipulation flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div
        className="h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progres panduan memulai"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {steps.map((step) => {
          const isNext = step.key === nextStepKey;
          return (
            <li key={step.key}>
              <Link
                href={step.href}
                aria-label={`${step.title}${step.done ? ' (selesai)' : ''}`}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-all active:scale-[0.99] touch-manipulation min-h-[44px]',
                  step.done
                    ? 'opacity-60'
                    : isNext
                    ? 'bg-stone-50 dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700'
                    : 'hover:bg-stone-50 dark:hover:bg-zinc-800/50'
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-xs sm:text-[13px] font-semibold text-zinc-900 dark:text-white leading-tight',
                      step.done && 'line-through'
                    )}
                  >
                    {step.title}
                  </p>
                  {!step.done && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{step.hint}</p>
                  )}
                </div>
                {!step.done && <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
