'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginAction } from '@/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        if (result.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-700/80 rounded-3xl flex items-center justify-center mx-auto shadow-md overflow-hidden p-2 sm:p-2.5">
            <Image src="/logo-light.png" alt="My Budget Logo" width={112} height={112} className="w-full h-full object-contain dark:hidden" unoptimized priority />
            <Image src="/logo-dark.png" alt="My Budget Logo" width={112} height={112} className="w-full h-full object-contain hidden dark:block" unoptimized priority />
          </div>
          <div className="space-y-1">
            <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
              My Budget
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Masuk untuk mengelola keuangan dan siklus gaji pribadimu
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Username
              </label>
              <input
                name="username"
                type="text"
                placeholder="Masukkan username Anda"
                required
                autoComplete="username"
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
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 touch-manipulation"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isPending ? 'Memproses Masuk...' : 'Masuk ke Akun'}</span>
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-stone-100 dark:border-zinc-800">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-zinc-900 dark:text-white hover:underline">
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
