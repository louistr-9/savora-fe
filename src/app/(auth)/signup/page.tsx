import { signup } from './actions';
import { Shield, User, Mail, Lock, Landmark, Wallet } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import FormattedNumberInput from './FormattedNumberInput';
import SubmitButton from './SubmitButton';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 -left-1/4 w-[50vw] h-[50vw] bg-emerald-teal/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-[50vw] h-[50vw] bg-deep-violet/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <Image src="/logo.png" alt="Savora Logo" width={64} height={64} className="object-contain drop-shadow-md mx-auto" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground text-center">Bắt đầu hành trình mới</h1>
          <p className="text-sm text-foreground/60 mt-1 text-center">Tạo tài khoản Savora để quản lý tài chính thông minh</p>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-[var(--border)] rounded-2xl p-8 shadow-soft">
          {/* Error Message */}
          {message && (
            <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm font-medium border border-rose-200 dark:border-rose-800/30 text-center">
              {message}
            </div>
          )}

          <form action={signup} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Họ và Tên
              </label>
              <input
                name="fullName"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@email.com"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Mật khẩu
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-background/50 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm placeholder:text-foreground/40 font-mono tracking-widest"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Initial Balance */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" /> Số dư ban đầu
                </label>
                <div className="relative">
                  <FormattedNumberInput
                    name="initialBalance"
                    defaultValue={0}
                    className="w-full bg-background/50 border border-[var(--border)] rounded-xl pl-4 pr-10 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/30">VND</span>
                </div>
              </div>

              {/* Monthly Budget */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70 ml-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Ngân sách tháng
                </label>
                <div className="relative">
                  <FormattedNumberInput
                    name="monthlyBudget"
                    defaultValue={5000000}
                    className="w-full bg-background/50 border border-[var(--border)] rounded-xl pl-4 pr-10 py-3 outline-none focus:border-emerald-teal focus:ring-1 focus:ring-emerald-teal/30 transition-all text-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground/30">VND</span>
                </div>
              </div>
            </div>

            <SubmitButton />
          </form>

          <div className="text-center mt-6 pt-6 border-t border-[var(--border)] flex flex-col gap-3">
            <p className="text-sm text-foreground/60">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-emerald-teal font-semibold hover:underline">
                Đăng nhập
              </Link>
            </p>
            <Link href="/dashboard" className="text-sm text-foreground/50 hover:text-foreground inline-flex items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Quay lại trang chủ
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-foreground/40 mt-8">
          Bằng cách đăng ký, bạn đồng ý với Điều khoản của Savora.
        </p>
      </div>
    </div>
  );
}

