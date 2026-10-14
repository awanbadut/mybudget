'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, CheckCircle2, BriefcaseBusiness, GraduationCap } from 'lucide-react';
import { registerAction } from '@/actions/auth';
import { Logo } from '@/components/Logo';

type UserType = 'employee' | 'student';

const INPUT_CLS =
  'w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation';

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userType, setUserType] = useState<UserType>('employee');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    // Inject userType so server action can read it
    formData.set('userType', userType);
    // If student, clear salary/salaryDate so backend uses defaults
    if (userType === 'student') {
      formData.set('salary', '0');
      formData.set('salaryDate', '1');
    }

    startTransition(async () => {
      const result = await registerAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      }
    });
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-900 dark:text-zinc-100 transition-colors">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 text-center max-w-md w-full space-y-4 transition-colors">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-xl text-zinc-900 dark:text-white">Akun Berhasil Dibuat</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Selamat datang di My Budget. Membuka dashboard pribadi Anda...
          </p>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="w-full bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Buka Dashboard Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-md space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <Logo className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
              Daftar Akun Baru
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Mulai kelola keuangan pribadi Anda
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">

            {/* ── User type toggle ── */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Saya adalah...
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUserType('employee')}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all touch-manipulation ${
                    userType === 'employee'
                      ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <BriefcaseBusiness className="w-5 h-5" />
                  <span>Karyawan / Wirausaha</span>
                  <span className={`text-[10px] font-normal ${userType === 'employee' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    Gaji rutin tiap bulan
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('student')}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all touch-manipulation ${
                    userType === 'student'
                      ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Mahasiswa / Pelajar</span>
                  <span className={`text-[10px] font-normal ${userType === 'student' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    Kiriman/uang saku tidak tentu
                  </span>
                </button>
              </div>
            </div>

            {/* ── Nama ── */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
              <input
                name="name"
                type="text"
                placeholder="Nama lengkap Anda"
                required
                className={INPUT_CLS}
              />
            </div>

            {/* ── Username ── */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">Username</label>
              <input
                name="username"
                type="text"
                placeholder="Username unik (tanpa spasi)"
                required
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={INPUT_CLS}
              />
            </div>

            {/* ── Email (optional) ── */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">Email (opsional)</label>
              <input
                name="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                className={INPUT_CLS}
              />
            </div>

            {/* ── Password ── */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  required
                  autoComplete="new-password"
                  className={`${INPUT_CLS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 touch-manipulation"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ── Konfirmasi Password ── */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">Konfirmasi Password</label>
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ulangi password Anda"
                required
                autoComplete="new-password"
                className={INPUT_CLS}
              />
            </div>

            {/* ── Karyawan: Gaji & Tanggal Gajian ── */}
            {userType === 'employee' && (
              <div className="space-y-3 pt-1 border-t border-stone-100 dark:border-zinc-800">
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-1">
                  Digunakan untuk menghitung siklus keuangan bulanan Anda.
                </p>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                    Gaji Pokok Bulanan (Rp)
                  </label>
                  <input
                    name="salary"
                    type="number"
                    placeholder="4000000"
                    defaultValue={4000000}
                    inputMode="numeric"
                    className={`${INPUT_CLS} tabular-nums`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                    Tanggal Gajian (1–31)
                  </label>
                  <input
                    name="salaryDate"
                    type="number"
                    placeholder="25"
                    defaultValue={25}
                    min={1}
                    max={31}
                    inputMode="numeric"
                    className={`${INPUT_CLS} tabular-nums`}
                  />
                </div>
              </div>
            )}

            {/* ── Mahasiswa: info kiriman ── */}
            {userType === 'student' && (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-3.5 text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-semibold">Mode Mahasiswa / Uang Kiriman 🎓</p>
                <p className="text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                  Anda tidak perlu mengisi gaji bulanan atau tanggal gajian. Cukup catat setiap kiriman
                  masuk sebagai pemasukan, dan pantau pengeluarannya dari dashboard.
                </p>
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs">
                {error}
              </div>
            )}

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2 touch-manipulation"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isPending ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-stone-100 dark:border-zinc-800">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-zinc-900 dark:text-white hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
