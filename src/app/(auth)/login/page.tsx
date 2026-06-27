'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(message || '');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Do not set loading to false here so the spinner stays while navigating
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Đã xảy ra lỗi, vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 -left-1/4 w-[50vw] h-[50vw] bg-emerald-teal/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-[50vw] h-[50vw] bg-deep-violet/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          {/* Savora Logo */}
          <div className="relative w-16 h-16 mb-4">
            <Image 
              src="/logo-savora.png" 
              alt="Savora Logo" 
              fill
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Chào mừng đến với Savora</h1>
          <p className="text-sm text-foreground/60 mt-1">Đăng nhập để vào không gian cá nhân của bạn</p>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 shadow-soft">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm font-medium border border-rose-200 dark:border-rose-800/30 text-center">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-[var(--border)] dark:border-slate-600 text-foreground py-3 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] group"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Đăng nhập với Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]"></div>
            </div>
            <span className="relative bg-card px-3 text-xs text-foreground/40 font-medium">HOẶC DÙNG EMAIL</span>
          </div>

          {/* Email/Password Form */}
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 ml-1 block">Email</label>
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 ml-1 block">Mật khẩu</label>
              <input
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40 font-mono tracking-widest"
              />
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-teal to-teal-500 hover:from-teal-500 hover:to-emerald-teal text-white py-3.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-teal/20 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
              </button>

              <div className="text-center mt-2 flex flex-col gap-3">
                <p className="text-sm text-foreground/60">
                  Chưa có tài khoản?{' '}
                  <Link href="/signup" className="text-emerald-teal font-semibold hover:underline">
                    Đăng ký ngay
                  </Link>
                </p>
                <Link href="/dashboard" className="text-sm text-foreground/50 hover:text-foreground inline-flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Quay lại trang chủ
                </Link>
              </div>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-foreground/40 mt-8">
          Savora © 2026. Secure &amp; Private.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-emerald-teal border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}

