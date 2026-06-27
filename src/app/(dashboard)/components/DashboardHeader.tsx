import Link from 'next/link';

import LiveClock from './LiveClock';
import { NotificationBell } from '@/components/NotificationBell';

interface Props {
  displayName: string;
  avatarUrl: string | null;
  email: string;
}

export default function DashboardHeader({ displayName, avatarUrl, email }: Props) {
  const getGreeting = () => {
    const hour = (new Date().getUTCHours() + 7) % 24;
    if (hour < 12) return { text: 'Chào buổi sáng', emoji: '☀️' };
    if (hour < 18) return { text: 'Chào buổi chiều', emoji: '👋' };
    return { text: 'Chào buổi tối', emoji: '🌙' };
  };

  const greeting = getGreeting();
  const now = new Date();
  const monthYear = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const monthNum = now.getMonth() + 1;
  const year = now.getFullYear();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: greeting & avatar */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-200 dark:border-white/10" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xl shadow-sm border border-slate-200 dark:border-white/10">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mb-0.5">
            {greeting.text} {greeting.emoji}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {displayName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Dòng tiền tháng {monthNum} đang ổn định</p>
        </div>
      </div>

      {/* Right: Live Clock & Notification */}
      <div className="flex items-center gap-3 shrink-0">
        <LiveClock />
        <NotificationBell />
      </div>
    </div>
  );
}

