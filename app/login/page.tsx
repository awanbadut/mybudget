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
        router.push(result.role === 'admin' ? '/admin' : '/');
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8F8F8] dark:bg-[#0F0F0F] flex items-center justify-center p-5 font-sans transition-colors">
      <div className="w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-[67px] relative">
              <Image src="/logo-v4-light.png" alt="My Budget" width={776} height={935}
                className="w-full h-full object-contain block dark:hidden" unoptimized priority />
              <Image src="/logo-v4-dark.png" alt="My Budget" width={776} height={935}
                className="w-full h-full object-contain hidden dark:block" unoptimized priority />
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="font-bold text-[1.6rem] text-zinc-900 dark:text-white tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-[13.5px] text-zinc-400 dark:text-zinc-500">
              Masuk untuk mengelola keuangan pribadimu
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="
            bg-white dark:bg-[#1c1c1e]
            rounded-2xl
            border border-zinc-200/80 dark:border-zinc-700/50
            shadow-[0_4px_24px_rgba(0,0,0,0.06),_inset_0_1px_0_rgba(255,255,255,0.80)]
            dark:shadow-[0_4px_24px_rgba(0,0,0,0.24),_inset_0_1px_0_rgba(255,255,255,0.04)]
            p-6 sm:p-7
            space-y-5
          "
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
                Username
              </label>
              <input
                name="username"
                type="text"
                placeholder="Username Anda"
                required
                autoComplete="username"
                className="
                  w-full px-4 py-3
                  bg-zinc-50 dark:bg-zinc-800
                  border border-zinc-200 dark:border-zinc-700
                  rounded-xl
                  text-[15px] text-zinc-900 dark:text-white
                  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                  focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20
                  focus:border-zinc-400 dark:focus:border-zinc-500
                  transition-colors touch-manipulation
                "
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="
                    w-full px-4 py-3 pr-11
                    bg-zinc-50 dark:bg-zinc-800
                    border border-zinc-200 dark:border-zinc-700
                    rounded-xl
                    text-[15px] text-zinc-900 dark:text-white
                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20
                    focus:border-zinc-400 dark:focus:border-zinc-500
                    transition-colors touch-manipulation
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-0.5 touch-manipulation"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" strokeWidth={2} />
                    : <Eye className="w-4 h-4" strokeWidth={2} />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-[13px] font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="
                w-full py-3
                bg-zinc-900 dark:bg-white
                hover:bg-zinc-800 dark:hover:bg-zinc-100
                text-white dark:text-zinc-900
                rounded-xl font-semibold text-[14px]
                shadow-[0_2px_8px_rgba(0,0,0,0.16)] dark:shadow-[0_2px_8px_rgba(255,255,255,0.10)]
                transition-all active:scale-[0.98]
                flex items-center justify-center gap-2
                touch-manipulation
                disabled:opacity-60
                mt-1
              "
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isPending ? 'Memproses...' : 'Masuk'}</span>
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-[13px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-4">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-zinc-900 dark:text-white hover:underline">
              Daftar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
