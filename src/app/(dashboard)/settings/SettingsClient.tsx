'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Image as ImageIcon, Wallet, ShieldCheck, Loader2, Eye, EyeOff, Target, Info, ExternalLink } from 'lucide-react';
import { updateProfile } from './actions';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Modal } from '@/components/ui/Modal';

interface SettingsClientProps {
  initialData: {
    fullName: string;
    avatarUrl: string;
    email: string;
    telegramChatId: string;
    discordUserId: string;
    geminiApiKey: string;
    aiPersona?: string;
    monthlyBudget?: number;
    initialBalance?: number;
  };
}

export function SettingsClient({ initialData }: SettingsClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVisible, setIsVisible] = useLocalStorage('isBalanceVisible', false);
  const [activeModal, setActiveModal] = useState<'telegram' | 'discord' | 'gemini' | null>(null);

  const [formData, setFormData] = useState({
    fullName: initialData.fullName,
    avatarUrl: initialData.avatarUrl,
    telegramChatId: initialData.telegramChatId || '',
    discordUserId: initialData.discordUserId || '',
    geminiApiKey: initialData.geminiApiKey ? '***************************************' : '',
    aiPersona: initialData.aiPersona || 'professional',
    monthlyBudget: initialData.monthlyBudget?.toString() || '0',
    initialBalance: initialData.initialBalance?.toString() || '0',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('avatarUrl', formData.avatarUrl);
      data.append('telegramChatId', formData.telegramChatId);
      data.append('discordUserId', formData.discordUserId);
      data.append('geminiApiKey', formData.geminiApiKey);
      data.append('aiPersona', formData.aiPersona);
      data.append('monthlyBudget', formData.monthlyBudget.replace(/\D/g, ''));
      data.append('initialBalance', formData.initialBalance.replace(/\D/g, ''));

      await updateProfile(data);
      setSuccessMsg('Đã lưu thay đổi thành công!');
      
      // Force Next.js to re-fetch server components so dashboard reflects new budget
      router.refresh();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format currency input
  const handleCurrencyChange = (field: 'monthlyBudget' | 'initialBalance', value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) {
      setFormData({ ...formData, [field]: '' });
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(Number(numericValue));
    setFormData({ ...formData, [field]: formatted });
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-teal via-indigo-500 to-purple-600 mb-3">
          Tài khoản & Tích hợp
        </h1>
        <p className="text-foreground/60 text-lg">Cá nhân hóa trải nghiệm và kết nối với các trợ lý AI ảo.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Khối 1: Thông tin bảo mật (Email) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-1 shadow-sm group hover:shadow-md transition-all duration-300"
        >
          <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:[mask-image:linear-gradient(0deg,black,rgba(0,0,0,0.5))] -z-10" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[22px]">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-1">Tài khoản cốt lõi</p>
              <p className="text-lg font-medium text-foreground">{initialData.email}</p>
            </div>
            <div className="sm:ml-auto">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold rounded-full border border-emerald-500/20 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Đã xác thực bảo mật
              </span>
            </div>
          </div>
        </motion.div>

        {/* Khối 2: Thông tin cá nhân */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/40 relative overflow-hidden"
        >
          {/* Decorative blur */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-teal/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-emerald-teal" /> Hồ sơ cá nhân
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label htmlFor="fullName" className="text-sm font-semibold text-foreground/80 ml-1">
                Biệt danh hiển thị
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/40 group-focus-within:text-emerald-teal transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="fullName" name="fullName" type="text"
                  placeholder="Ví dụ: Shark Bình"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-sm focus:border-emerald-teal focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-teal/10 transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label htmlFor="avatarUrl" className="text-sm font-semibold text-foreground/80 ml-1">
                Ảnh đại diện (URL)
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/40 group-focus-within:text-emerald-teal transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <input
                    id="avatarUrl" name="avatarUrl" type="url"
                    placeholder="https://.../avatar.jpg"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-sm focus:border-emerald-teal focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-teal/10 transition-all shadow-inner"
                  />
                </div>
                {/* Avatar Preview */}
                <div className="w-12 h-12 rounded-full border-2 border-emerald-teal/30 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-sm relative group-hover:border-emerald-teal transition-colors duration-300">
                  {formData.avatarUrl ? (
                    <Image src={formData.avatarUrl} alt="Preview" fill className="object-cover" unoptimized />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Khối 2.5: Thông tin Tài chính */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/40 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Wallet className="w-5 h-5 text-amber-500" /> Cài đặt Tài chính
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label htmlFor="initialBalance" className="text-sm font-semibold text-foreground/80 ml-1">
                Số dư ban đầu (VNĐ)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/40 group-focus-within:text-amber-500 transition-colors">
                  <Wallet className="w-5 h-5" />
                </div>
                <input
                  id="initialBalance" name="initialBalance" type="text"
                  placeholder="Ví dụ: 10,000,000"
                  value={formData.initialBalance}
                  onChange={(e) => handleCurrencyChange('initialBalance', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-sm focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all shadow-inner font-mono tracking-wider"
                />
              </div>
              <p className="text-xs text-foreground/50 ml-1">Số tiền bạn đã có sẵn trước khi dùng Savora.</p>
            </div>

            <div className="space-y-2 group">
              <label htmlFor="monthlyBudget" className="text-sm font-semibold text-foreground/80 ml-1">
                Hạn mức chi tiêu hàng tháng (VNĐ)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/40 group-focus-within:text-rose-500 transition-colors">
                  <Target className="w-5 h-5" />
                </div>
                <input
                  id="monthlyBudget" name="monthlyBudget" type="text"
                  placeholder="Ví dụ: 5,000,000"
                  value={formData.monthlyBudget}
                  onChange={(e) => handleCurrencyChange('monthlyBudget', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-sm focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 transition-all shadow-inner font-mono tracking-wider"
                />
              </div>
              <p className="text-xs text-foreground/50 ml-1">Giúp hiển thị tiến độ và cảnh báo nếu bạn tiêu lố.</p>
            </div>
          </div>
        </motion.div>

        {/* Khối 3: Tích hợp Bot AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/40 relative overflow-hidden"
        >
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-indigo-500" /> Kết nối Trợ lý Ảo
          </h2>

          <div className="space-y-6">
            {/* Telegram */}
            <div className="group bg-white/40 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-[#0088cc]/50 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0088cc]/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#0088cc]"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </div>
                <div className="flex-1">
                  <label htmlFor="telegramChatId" className="text-sm font-bold text-foreground mb-1 block">Telegram Chat ID</label>
                  <input
                    id="telegramChatId" name="telegramChatId" type="text"
                    placeholder="Ví dụ: 1234567, 9876543"
                    value={formData.telegramChatId}
                    onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                    className="w-full rounded-xl border border-transparent bg-slate-100 dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-[#0088cc] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 transition-all"
                  />
                </div>
                <button type="button" onClick={() => setActiveModal('telegram')} className="text-xs text-white bg-[#0088cc] hover:bg-[#0077b5] px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-end">
                  <Info className="w-4 h-4" /> Cách lấy ID
                </button>
              </div>
            </div>

            {/* Discord */}
            <div className="group bg-white/40 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-[#5865F2]/50 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#5865F2]/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#5865F2]"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                </div>
                <div className="flex-1">
                  <label htmlFor="discordUserId" className="text-sm font-bold text-foreground mb-1 block">Discord User ID</label>
                  <input
                    id="discordUserId" name="discordUserId" type="text"
                    placeholder="Ví dụ: 123456789012345678"
                    value={formData.discordUserId}
                    onChange={(e) => setFormData({ ...formData, discordUserId: e.target.value })}
                    className="w-full rounded-xl border border-transparent bg-slate-100 dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-[#5865F2] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 transition-all"
                  />
                </div>
                <button type="button" onClick={() => setActiveModal('discord')} className="text-xs text-white bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-end">
                  <Info className="w-4 h-4" /> Cách lấy ID
                </button>
              </div>
            </div>

            {/* Gemini */}
            <div className="group bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-5 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                </div>
                <div className="flex-1">
                  <label htmlFor="geminiApiKey" className="text-sm font-bold text-foreground mb-1 block">Gemini API Key (Tùy chọn)</label>
                  <input
                    id="geminiApiKey" name="geminiApiKey" type="text"
                    placeholder="AIzaSy..."
                    value={formData.geminiApiKey}
                    onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                    className="w-full font-mono tracking-wider rounded-xl border border-transparent bg-white/60 dark:bg-slate-900/60 px-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <button type="button" onClick={() => setActiveModal('gemini')} className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-end">
                  <Info className="w-4 h-4" /> Lấy Khóa API Miễn phí
                </button>
              </div>
            </div>

            {/* Tính cách AI */}
            <div className="group bg-white/40 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-indigo-500"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>
                <div className="flex-1">
                  <label htmlFor="aiPersona" className="text-sm font-bold text-foreground mb-1 block">Tính cách AI (AI Persona)</label>
                  <select
                    id="aiPersona" name="aiPersona"
                    value={formData.aiPersona}
                    onChange={(e) => setFormData({ ...formData, aiPersona: e.target.value })}
                    className="w-full rounded-xl border border-transparent bg-slate-100 dark:bg-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="professional">🧐 Chuyên gia tài chính (Nghiêm túc)</option>
                    <option value="funny">🤡 Người bạn Gen Z (Hài hước, thân thiện)</option>
                    <option value="savage">💅 Kế toán đanh đá (Hay mỉa mai, chửi xéo)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Khối 4: Quyền riêng tư */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/20 dark:shadow-black/40 flex items-center justify-between"
        >
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
              {isVisible ? <Eye className="w-5 h-5 text-emerald-teal" /> : <EyeOff className="w-5 h-5 text-emerald-teal" />}
              Chế độ ẩn danh
            </h2>
            <p className="text-sm text-foreground/60">
              Ẩn tất cả số tiền dưới dạng dấu *** để bảo vệ quyền riêng tư nơi đông người.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!isVisible}
            onClick={() => setIsVisible(!isVisible)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-teal focus-visible:ring-opacity-75 shadow-inner ${
              !isVisible ? 'bg-emerald-teal' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                !isVisible ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </motion.div>

        {/* Feedback Messages */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-medium border border-rose-500/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0" /> {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-medium border border-emerald-500/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0" /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end pt-4"
        >
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-teal to-indigo-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-teal/20 transition-all hover:shadow-emerald-teal/40 hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none w-full sm:w-auto overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" /> Lưu Thay Đổi
              </>
            )}
          </button>
        </motion.div>

      </form>

      {/* Modals */}
      <Modal isOpen={activeModal === 'telegram'} onClose={() => setActiveModal(null)} title="Kết nối Telegram Bot">
        <div className="space-y-4">
          <p className="text-sm">Kết nối Telegram để nhắn tin ghi chép chi tiêu và theo dõi thói quen như chat với người thật.</p>
          <div className="space-y-3 bg-muted/50 p-4 rounded-xl text-sm">
            <p className="font-medium">Các bước thực hiện:</p>
            <ol className="list-decimal list-inside space-y-2 ml-1">
              <li>
                {process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ? (
                  <>
                    <a href={process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL} target="_blank" rel="noreferrer" className="text-[#0088cc] font-medium hover:underline inline-flex items-center gap-1 bg-[#0088cc]/10 px-2 py-0.5 rounded">
                      Bấm vào đây để mở Bot <ExternalLink className="w-3 h-3" />
                    </a>
                    <span> trên Telegram.</span>
                  </>
                ) : (
                  <span>Mở ứng dụng Telegram và tìm kiếm tên bot của bạn.</span>
                )}
              </li>
              <li>Bấm nút <strong>Start</strong> hoặc nhắn tin <code>/start</code> cho Bot.</li>
              <li>Bot sẽ tự động chào bạn và cung cấp một dãy số <strong>Telegram ID</strong> (ví dụ: <code>123456789</code>).</li>
              <li>Copy dãy số đó, quay lại trang cài đặt này và dán vào ô <strong>Telegram Chat ID</strong>.</li>
              <li>Bấm <strong>Lưu thay đổi</strong>.</li>
            </ol>
          </div>
          <div className="bg-indigo-500/10 p-4 rounded-xl text-sm border border-indigo-500/20">
            <p className="font-medium text-indigo-500 mb-1">💡 Dùng chung tài khoản (Vợ/Chồng/Bạn bè)</p>
            <p>Nếu bạn muốn nhiều người cùng nhắn tin vào một tài khoản Savora, hãy yêu cầu người kia cũng nhắn <code>/start</code> cho bot để lấy ID của họ. Sau đó, nhập cả 2 ID vào ô, cách nhau bằng dấu phẩy. Ví dụ: <br/><code className="bg-white/50 dark:bg-black/20 p-1 rounded mt-1 inline-block">123456789, 987654321</code></p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'discord'} onClose={() => setActiveModal(null)} title="Kết nối Discord Bot">
        <div className="space-y-4">
          <p className="text-sm">Kết nối Discord rất hữu ích nếu bạn thường xuyên làm việc trên máy tính và muốn ghi chép nhanh chóng.</p>
          <div className="space-y-3 bg-muted/50 p-4 rounded-xl text-sm">
            <p className="font-medium">Các bước thực hiện:</p>
            <ol className="list-decimal list-inside space-y-2 ml-1">
              <li>
                {process.env.NEXT_PUBLIC_DISCORD_BOT_INVITE ? (
                  <>
                    <a href={process.env.NEXT_PUBLIC_DISCORD_BOT_INVITE} target="_blank" rel="noreferrer" className="text-[#5865F2] font-medium hover:underline inline-flex items-center gap-1 bg-[#5865F2]/10 px-2 py-0.5 rounded">
                      Bấm vào đây để mời Bot <ExternalLink className="w-3 h-3" />
                    </a>
                    <span> vào Server Discord của bạn (hoặc nhắn trực tiếp cho Bot).</span>
                  </>
                ) : (
                  <span>Mở Discord, vào Server có chứa bot Savora hoặc mở chat riêng với Bot.</span>
                )}
              </li>
              <li>Gõ lệnh <code>!start</code> vào khung chat và gửi đi.</li>
              <li>Bot sẽ phản hồi lại lời chào kèm theo <strong>Discord ID</strong> của bạn (ví dụ: <code>712345678901234567</code>).</li>
              <li>Copy dãy số đó.</li>
              <li>Quay lại trang cài đặt này, dán vào ô <strong>Discord User ID</strong>.</li>
              <li>Bấm <strong>Lưu thay đổi</strong>.</li>
            </ol>
          </div>
          <div className="bg-[#5865F2]/10 p-4 rounded-xl text-sm border border-[#5865F2]/20">
            <p className="font-medium text-[#5865F2] mb-1">💡 Hỗ trợ nhiều người dùng</p>
            <p>Tương tự như Telegram, bạn có thể thêm nhiều Discord ID bằng cách ngăn cách chúng bằng dấu phẩy nếu muốn chia sẻ tài khoản quản lý với người khác.</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'gemini'} onClose={() => setActiveModal(null)} title="Thiết lập Gemini API Key">
        <div className="space-y-4">
          <p className="text-sm">Để tiết kiệm tài nguyên hệ thống, người dùng chưa có API Key riêng sẽ bị giới hạn <strong>5 tin nhắn/ngày</strong> khi chat với Bot.</p>
          <p className="text-sm">Khi bạn tự thêm API Key của Google (Hoàn toàn miễn phí), bạn sẽ được dùng bot <strong>không giới hạn</strong>!</p>
          
          <div className="space-y-3 bg-muted/50 p-4 rounded-xl text-sm">
            <p className="font-medium">Cách lấy API Key miễn phí (1 phút):</p>
            <ol className="list-decimal list-inside space-y-3 ml-1">
              <li>
                Truy cập trang web: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-500 font-medium hover:underline">Google AI Studio</a>.
              </li>
              <li>Đăng nhập bằng tài khoản Google của bạn.</li>
              <li>Bấm nút <strong>Create API key</strong> (Tạo khóa API) màu xanh dương.</li>
              <li>Hệ thống sẽ tạo ra một chuỗi ký tự dài bắt đầu bằng <code className="bg-background px-1 py-0.5 rounded">AIzaSy...</code></li>
              <li>Copy toàn bộ chuỗi đó, dán vào ô <strong>Gemini API Key</strong> ở đây và Lưu lại.</li>
            </ol>
          </div>
          <div className="text-xs text-foreground/60 text-center">
            Mã khóa API của bạn được lưu trữ an toàn trong cơ sở dữ liệu và chỉ dùng để giao tiếp với AI.
          </div>
        </div>
      </Modal>
    </div>
  );
}

