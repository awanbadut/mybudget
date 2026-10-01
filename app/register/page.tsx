'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { registerAction } from '@/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
          router.refresh();
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
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Selamat datang di My Budget. Membuka dashboard pribadi Anda...</p>
          <button
            onClick={() => {
              router.push('/');
              router.refresh();
            }}
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
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-white border border-stone-200/80 dark:border-zinc-700/80 rounded-2xl flex items-center justify-center mx-auto shadow-sm overflow-hidden p-1">
            <Image src="/logo.png" alt="My Budget" width={56} height={56} className="w-full h-full object-contain rounded-xl" priority />
          </div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
            Daftar Akun Baru
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Mulai kelola keuangan pribadi dengan disiplin siklus gaji
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Nama Lengkap
              </label>
              <input
                name="name"
                type="text"
                placeholder="Nama lengkap Anda"
                required
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Username
              </label>
              <input
                name="username"
                type="text"
                placeholder="Username unik (tanpa spasi)"
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Email (opsional)
              </label>
              <input
                name="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white touch-manipulation"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  required
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white pr-10 touch-manipulation"
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

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Gaji Pokok Bulanan (Rp)
              </label>
              <input
                name="salary"
                type="number"
                placeholder="4000000"
                defaultValue={4000000}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white tabular-nums touch-manipulation"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Tanggal Gajian Siklus (1 sampai 31)
              </label>
              <input
                name="salaryDate"
                type="number"
                placeholder="25"
                defaultValue={25}
                min={1}
                max={31}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white tabular-nums touch-manipulation"
              />
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs">
                {error}
              </div>
            )}

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
