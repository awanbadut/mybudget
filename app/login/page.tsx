'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Wallet } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4 font-sans text-zinc-900">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Wallet className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
            My Budget
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Masuk untuk mengelola keuangan dan siklus gaji pribadimu
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700">
                Username
              </label>
              <input
                name="username"
                type="text"
                placeholder="zikrykurniawan / admin"
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isPending ? 'Memproses Masuk...' : 'Masuk ke Akun'}</span>
            </button>
          </form>

          {/* Demo helper */}
          <div className="pt-3 border-t border-stone-100 text-xs text-zinc-500 space-y-1.5">
            <p className="font-semibold text-zinc-700">Akun Tersedia:</p>
            <div className="bg-stone-50 rounded-xl p-3 space-y-1 border border-stone-100 font-mono text-[11px]">
              <p>User: <strong className="text-zinc-800">zikrykurniawan</strong> · Pass: <strong className="text-zinc-800">@Azik12345</strong></p>
              <p>Admin: <strong className="text-zinc-800">admin</strong> · Pass: <strong className="text-zinc-800">Admin@2026!</strong></p>
            </div>
          </div>

          <div className="text-center pt-1 text-xs text-zinc-500">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-zinc-900 hover:underline">
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
