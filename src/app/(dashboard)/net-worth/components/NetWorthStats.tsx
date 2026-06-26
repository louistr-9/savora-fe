'use client';

import { motion } from 'framer-motion';
import { Eye, ArrowUp, Wallet, CreditCard, ShieldCheck, Layers, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface NetWorthStatsProps {
  summary: {
    netWorth: number;
    netWorthChange: number;
    totalAssets: number;
    totalDebt: number;
    debtToAssetRatio: number;
  };
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

export default function NetWorthStats({ summary }: NetWorthStatsProps) {
  const [showValue, setShowValue] = useState(true);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tài sản ròng */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm col-span-2 lg:col-span-1"
      >
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">TÀI SẢN RÒNG</p>
          <button onClick={() => setShowValue(!showValue)} className="text-slate-400 hover:text-slate-600">
            <Eye className="w-4 h-4" />
          </button>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {showValue ? formatMoney(summary.netWorth) : '****** đ'}
        </p>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="flex items-center font-bold text-emerald-500">
            <ArrowUp className="w-3.5 h-3.5 mr-0.5" />
            {summary.netWorthChange}%
          </span>
          <span className="font-bold text-emerald-500">+{formatMoney(Math.round(summary.netWorth * summary.netWorthChange / 100))} đ</span>
          <span className="text-slate-400">so với tháng trước</span>
        </div>
      </motion.div>

      {/* Tổng tài sản */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">TỔNG TÀI SẢN</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {showValue ? formatMoney(summary.totalAssets) : '****** đ'}
          </p>
          <Link href="/finance/assets" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Xem chi tiết <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <Wallet className="w-6 h-6" />
        </div>
      </motion.div>

      {/* Tổng nợ */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">TỔNG NỢ</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {showValue ? formatMoney(summary.totalDebt) : '****** đ'}
          </p>
          <Link href="/finance/debts" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Xem chi tiết <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <CreditCard className="w-6 h-6" />
        </div>
      </motion.div>

      {/* Tỷ lệ nợ / tài sản */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">TỶ LỆ NỢ / TÀI SẢN</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {summary.debtToAssetRatio}%
          </p>
          <span className="text-xs font-bold text-emerald-500">An toàn</span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-500 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </motion.div>
    </div>
  );
}

