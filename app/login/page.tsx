'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, BookOpen } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F4F0EA] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Editorial Masthead */}
        <div className="text-center space-y-2">
          <div className="inline-block bg-[#EDE6DC] border-2 border-[#24201D] px-3 py-1 font-mono text-xs font-bold text-[#D9381E] uppercase tracking-wider shadow-[2px_2px_0px_#24201D]">
            FIX Nº 25-25 · SIKLUS GAJI
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-[#24201D] uppercase tracking-tight leading-none">
            MY BUDGET
          </h1>
          <p className="font-mono text-xs text-[#706860] uppercase">
            Buku Besar Keuangan Pribadi
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-6 sm:p-8 shadow-[4px_4px_0px_#24201D] space-y-5">
          <div className="border-b border-[#24201D]/20 pb-3 flex items-center justify-between">
            <h2 className="font-display font-bold text-2xl text-[#24201D] uppercase">
              Masuk Akun
            </h2>
            <span className="font-mono text-xs text-[#706860]">AUTHENTICATION</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-xs font-bold text-[#24201D] uppercase mb-1.5">
                Username
              </label>
              <input
                name="username"
                type="text"
                placeholder="zikrykurniawan / admin"
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-[#EDE6DC] border border-[#24201D] font-mono text-sm text-[#24201D] placeholder-[#706860]/60 focus:outline-none focus:ring-1 focus:ring-[#24201D] rounded-[2px]"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold text-[#24201D] uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 bg-[#EDE6DC] border border-[#24201D] font-mono text-sm text-[#24201D] placeholder-[#706860]/60 focus:outline-none focus:ring-1 focus:ring-[#24201D] rounded-[2px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#706860] hover:text-[#24201D]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#FBEBE8] border border-[#D9381E] text-[#D9381E] px-3.5 py-2.5 font-mono text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] py-3 font-mono font-bold text-sm uppercase shadow-[3px_3px_0px_#24201D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#24201D] transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>MEMVERIFIKASI...</span>
                </>
              ) : (
                'MASUK KE BUKU KAS'
              )}
            </button>
          </form>

          {/* Seed accounts info */}
          <div className="border-t border-[#24201D]/20 pt-4 font-mono text-xs space-y-1.5 bg-[#EDE6DC]/60 p-3 border border-[#24201D]/20">
            <p className="font-bold text-[#24201D] uppercase text-[11px]">Akun Tersedia:</p>
            <div className="flex justify-between text-[#706860] text-[11px]">
              <span>User: <strong className="text-[#24201D]">zikrykurniawan</strong></span>
              <span>Pass: <strong className="text-[#24201D]">@Azik12345</strong></span>
            </div>
            <div className="flex justify-between text-[#706860] text-[11px]">
              <span>Admin: <strong className="text-[#24201D]">admin</strong></span>
              <span>Pass: <strong className="text-[#24201D]">Admin@2026!</strong></span>
            </div>
          </div>

          <div className="text-center font-mono text-xs text-[#706860]">
            Belum punya akun?{' '}
            <Link href="/register" className="text-[#D9381E] font-bold hover:underline">
              Daftar Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
