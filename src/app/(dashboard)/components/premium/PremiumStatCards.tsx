'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ShoppingCart, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

interface Card {
  title: string;
  value: number;
  sub: string;
  change: number;
  isPositiveGood: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  href?: string;
}

export default function DashboardStatRow({ data }: { data: any }) {
  const cards: Card[] = [
    {
      title: 'Số dư hiện tại',
      value: data.currentBalance,
      sub: 'Có thể sử dụng',
      change: data.incomeChange,
      isPositiveGood: true,
      icon: <Wallet className="w-5 h-5" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      valueColor: 'text-slate-900 dark:text-white',
      href: '/finance',
    },
    {
      title: 'Thu nhập tháng',
      value: data.income,
      sub: 'Tổng thu nhập',
      change: data.incomeChange,
      isPositiveGood: true,
      icon: <TrendingUp className="w-5 h-5" />,
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Chi tiêu tháng',
      value: data.expense,
      sub: 'Tổng chi tiêu',
      change: data.expenseChange,
      isPositiveGood: false,
      icon: <ShoppingCart className="w-5 h-5" />,
      iconBg: 'bg-rose-50 dark:bg-rose-500/10',
      iconColor: 'text-rose-500',
      valueColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      title: 'Tiết kiệm (bỏ heo)',
      value: data.savings,
      sub: 'Đã cất trữ',
      change: data.savingsChange,
      isPositiveGood: true,
      icon: <PiggyBank className="w-5 h-5" />,
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-500',
      valueColor: 'text-amber-600 dark:text-amber-400',
      href: '/finance/assets',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const isGood = card.isPositiveGood ? card.change > 0 : card.change < 0;
        const content = (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* icon top-right */}
            <div className={`w-9 h-9 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center mb-4 ml-auto`}>
              {card.icon}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{card.title}</p>
            <p className={`text-xl sm:text-2xl font-black tracking-tight ${card.valueColor} mb-1`}>
              {fmt(card.value)}
            </p>
            <p className="text-xs text-slate-400 mb-3">{card.sub}</p>

            {/* change badge */}
            <div className={`flex items-center gap-1 text-xs font-semibold ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
              {card.change > 0
                ? <ArrowUpRight className="w-3.5 h-3.5" />
                : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{Math.abs(card.change).toFixed(1)}% so với tháng trước</span>
            </div>
          </motion.div>
        );

        return card.href ? <Link key={i} href={card.href} className="block">{content}</Link> : content;
      })}
    </div>
  );
}

