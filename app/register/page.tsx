'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Wallet, CheckCircle2 } from 'lucide-react';
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
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4 font-sans text-zinc-900">
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 text-center max-w-md w-full space-y-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-xl text-zinc-900">Akun Berhasil Dibuat</h2>
          <p className="text-xs text-zinc-500">Selamat datang di My Budget. Membuka dashboard pribadi Anda...</p>
          <button
            onClick={() => {
              router.push('/');
              router.refresh();
            }}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Buka Dashboard Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4 font-sans text-zinc-900">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Wallet className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
            Daftar Akun Baru
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Mulai kelola keuangan pribadi dengan disiplin siklus gaji
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700">
                Nama Lengkap
              </label>
              <input
                name="name"
                type="text"
                placeholder="Contoh: Zikry Kurniawan"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 touch-manipulation"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700">
                Username
              </label>
              <input
                name="username"
                type="text"
                placeholder="Contoh: zikrykurniawan"
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 touch-manipulation"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700">
                Email (opsional)
              </label>
              <input
                name="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 touch-manipulation"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  required
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 pr-10 touch-manipulation"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 touch-manipulation"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700">
                Gaji Pokok Bulanan (Rp)
              </label>
              <input
                name="salary"
                type="number"
                placeholder="4000000"
                defaultValue={4000000}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700">
                Tanggal Gajian Siklus (1 sampai 31)
              </label>
              <input
                name="salaryDate"
                type="number"
                placeholder="25"
                defaultValue={25}
                min={1}
                max={31}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2 touch-manipulation"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isPending ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-zinc-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-zinc-900 hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
