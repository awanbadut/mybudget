'use client';

import { useState, useEffect, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { updateSettings } from '@/actions/settings';
import { createSavingsGoal } from '@/actions/savings';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Wallet, PieChart, Target, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Props {
  initialSalary?: number;
  initialSalaryDate?: number;
  initialName?: string;
  hasTransactions?: boolean;
}

export function OnboardingModal({
  initialSalary = 0,
  initialSalaryDate = 25,
  initialName = '',
  hasTransactions = false,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Salary & Cycle
  const [name, setName] = useState(initialName || '');
  const [salary, setSalary] = useState(initialSalary > 0 ? String(initialSalary) : '4000000');
  const [salaryDate, setSalaryDate] = useState(String(initialSalaryDate || 25));

  // Step 2: Budgets
  const [rentBudget, setRentBudget] = useState('650000');
  const [foodBudget, setFoodBudget] = useState('900000');
  const [entertainmentBudget, setEntertainmentBudget] = useState('200000');
  const [toiletriesBudget, setToiletriesBudget] = useState('50000');
  const [transportBudget, setTransportBudget] = useState('100000');

  // Step 3: Savings Goal
  const [goalName, setGoalName] = useState('Dana Darurat');
  const [goalTarget, setGoalTarget] = useState('12000000');

  // Auto trigger for clean new users
  useEffect(() => {
    const dismissed = localStorage.getItem('mybudget_onboarded');
    if (!dismissed && initialSalary === 0 && !hasTransactions) {
      setIsOpen(true);
    }
  }, [initialSalary, hasTransactions]);

  function applyPreset503020() {
    const sal = parseInt(salary.replace(/[^0-9]/g, ''), 10) || 4000000;
    // 50% Needs: Rent ~25%, Food ~20%, Toiletries/Transport ~5%
    setRentBudget(String(Math.round(sal * 0.25)));
    setFoodBudget(String(Math.round(sal * 0.25)));
    setEntertainmentBudget(String(Math.round(sal * 0.10)));
    setToiletriesBudget(String(Math.round(sal * 0.05)));
    setTransportBudget(String(Math.round(sal * 0.05)));
    toast({ title: 'Template 50/30/20 diterapkan ✓', description: 'Anggaran disesuaikan dengan nominal gaji.' });
  }

  function handleFinish() {
    startTransition(async () => {
      const parsedSalary = parseInt(salary.replace(/[^0-9]/g, ''), 10) || 0;
      const parsedDate = parseInt(salaryDate, 10) || 25;
      const parsedRent = parseInt(rentBudget.replace(/[^0-9]/g, ''), 10) || 0;
      const parsedFood = parseInt(foodBudget.replace(/[^0-9]/g, ''), 10) || 0;
      const parsedEnt = parseInt(entertainmentBudget.replace(/[^0-9]/g, ''), 10) || 0;
      const parsedToil = parseInt(toiletriesBudget.replace(/[^0-9]/g, ''), 10) || 0;
      const parsedTrans = parseInt(transportBudget.replace(/[^0-9]/g, ''), 10) || 0;

      // 1. Save Settings
      await updateSettings({
        name: name.trim() || 'Pengguna',
        salary: parsedSalary,
        salaryDate: parsedDate,
        rentBudget: parsedRent,
        foodBudget: parsedFood,
        entertainmentBudget: parsedEnt,
        toiletries_budget: parsedToil,
        transportBudget: parsedTrans,
        salaryProrateEnabled: false,
        salaryProrateMethod: 'calendar_days',
      });

      // 2. Create Initial Savings Goal if given
      const parsedGoal = parseInt(goalTarget.replace(/[^0-9]/g, ''), 10);
      if (goalName.trim() && parsedGoal > 0) {
        await createSavingsGoal({
          name: goalName.trim(),
          targetAmount: parsedGoal,
        });
      }

      localStorage.setItem('mybudget_onboarded', 'true');
      toast({
        title: 'Selamat! Setup Berhasil Disimpan 🎉',
        description: 'Dashboard keuanganmu kini sudah siap dipakai dengan parameter lengkap.',
      });
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {/* Floating launcher trigger if user wants to re-run setup */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-all active:scale-95 touch-manipulation"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span>Panduan Setup</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-5 sm:p-7 w-full">
          <DialogHeader>
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Langkah {step} dari 3
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={cn(
                      'w-6 h-1.5 rounded-full transition-all',
                      step === i
                        ? 'bg-zinc-900 dark:bg-white'
                        : step > i
                        ? 'bg-emerald-500'
                        : 'bg-stone-200 dark:bg-zinc-800'
                    )}
                  />
                ))}
              </div>
            </div>

            <DialogTitle className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white leading-tight">
              {step === 1 && 'Siklus Gaji & Profil'}
              {step === 2 && 'Anggaran Bulanan'}
              {step === 3 && 'Target Tabungan Perdana'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Salary & Cycle */}
          {step === 1 && (
            <div className="space-y-3.5 text-xs pt-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                My Budget dirancang berlandaskan disiplin penggajian tanggal 25. Masukkan informasi dasar penghasilanmu:
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nama Panggilan</label>
                <input
                  placeholder="Nama Anda"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Gaji Pokok Bulanan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">Rp</span>
                  <input
                    placeholder="4.000.000"
                    value={salary ? Number(salary.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setSalary(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-base sm:text-base text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Gajian Siklus (1 - 31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={salaryDate}
                  onChange={e => setSalaryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  Default 25: Jatah belanja harian dihitung dari tanggal 25 bulan ini ke tanggal 25 bulan depan.
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Core Budgets */}
          {step === 2 && (
            <div className="space-y-3.5 text-xs pt-2">
              <div className="flex items-center justify-between">
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                  Bagi pengeluaran wajib agar kas tidak bocor sebelum akhir bulan:
                </p>
                <button
                  type="button"
                  onClick={applyPreset503020}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Calculator className="w-3 h-3" />
                  Auto 50/30/20
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">Kos / Sewa</label>
                  <input
                    value={rentBudget ? Number(rentBudget.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setRentBudget(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-sm text-zinc-900 dark:text-white tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">Makan & Minum</label>
                  <input
                    value={foodBudget ? Number(foodBudget.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setFoodBudget(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-sm text-zinc-900 dark:text-white tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">Hiburan & Refreshing</label>
                  <input
                    value={entertainmentBudget ? Number(entertainmentBudget.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setEntertainmentBudget(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-sm text-zinc-900 dark:text-white tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">Toiletries & Sabun</label>
                  <input
                    value={toiletriesBudget ? Number(toiletriesBudget.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setToiletriesBudget(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-sm text-zinc-900 dark:text-white tabular-nums"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">Transport & Mobilitas</label>
                  <input
                    value={transportBudget ? Number(transportBudget.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setTransportBudget(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-sm text-zinc-900 dark:text-white tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Savings Goal */}
          {step === 3 && (
            <div className="space-y-3.5 text-xs pt-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                Tentukan target simpanan pertama agar setiap surplus bulanan memiliki arah tujuan yang jelas:
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nama Target Simpanan</label>
                <input
                  placeholder="Contoh: Dana Darurat 3 Bulan / Beli Laptop"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Target Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">Rp</span>
                  <input
                    placeholder="12.000.000"
                    value={goalTarget ? Number(goalTarget.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setGoalTarget(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-base sm:text-base text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Siap Memulai!
                </span>
                <p>Pengaturan kamu akan otomatis diterapkan ke seluruh ringkasan, grafik pengeluaran, dan jatah harian.</p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 flex flex-row gap-2 justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium text-xs hover:bg-stone-50 dark:hover:bg-zinc-800 touch-manipulation"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('mybudget_onboarded', 'true');
                  setIsOpen(false);
                }}
                className="px-3.5 py-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-medium"
              >
                Lewati Setup
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as 2 | 3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-sm touch-manipulation"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm touch-manipulation"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isPending ? 'Menyimpan...' : 'Selesaikan & Terapkan'}</span>
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
