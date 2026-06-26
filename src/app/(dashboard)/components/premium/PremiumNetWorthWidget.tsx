'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PremiumNetWorthWidget({ data }: { data: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 border border-emerald-100 dark:border-white/5 shadow-sm relative overflow-hidden"
    >
      {/* Decorative icon */}
      <div className="absolute right-4 bottom-4 opacity-20 text-[80px] select-none pointer-events-none">
        🏦
      </div>

      <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1">Tài sản hiện hữu</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Quản lý tài sản, đầu tư, nợ và giá trị ròng của bạn.
      </p>

      <Link
        href="/net-worth"
        className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 text-sm font-bold px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        Xem Net Worth <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

