'use client';

import { motion } from 'framer-motion';
import { Target, Plane, ShieldCheck, Car, ArrowRight, Inbox } from 'lucide-react';
import Link from 'next/link';

interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  icon?: string;
  color?: string;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

const getIcon = (name?: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('du lịch') || n.includes('plane')) return '🌴';
  if (n.includes('xe') || n.includes('car')) return '🚗';
  if (n.includes('khẩn cấp') || n.includes('quỹ')) return '🛡️';
  return '🎯';
};

export default function PremiumGoals({ data }: { data: Goal[] }) {
  const topGoal = data[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Mục tiêu tiết kiệm</h2>
        <Link href="/finance/assets" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-0.5">
          Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-4">
          <Inbox className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">Chưa có mục tiêu nào</p>
        </div>
      ) : topGoal ? (() => {
        const progress = topGoal.target > 0 ? Math.min(100, Math.round((topGoal.current / topGoal.target) * 100)) : 0;
        const remaining = topGoal.target - topGoal.current;
        const monthsLeft = remaining > 0 ? Math.ceil(remaining / (topGoal.current > 0 ? topGoal.current / 3 : 1000000)) : 0;

        return (
          <div className="flex-1 flex flex-col">
            {/* Goal item */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                {getIcon(topGoal.icon || topGoal.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{topGoal.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Mục tiêu: {fmt(topGoal.target)}</p>
              </div>
            </div>

            {/* Big value */}
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">{fmt(topGoal.current)}</p>
            
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'circOut' }}
                />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0">{progress}%</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
                <p className="text-xs text-slate-500 mb-1">Còn lại</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{fmt(remaining > 0 ? remaining : 0)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
                <p className="text-xs text-slate-500 mb-1">Dự kiến hoàn thành</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {monthsLeft > 0 ? `Sau ${monthsLeft} tháng nữa` : 'Đã hoàn thành 🎉'}
                </p>
              </div>
            </div>
          </div>
        );
      })() : null}
    </motion.div>
  );
}

