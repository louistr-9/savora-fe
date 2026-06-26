'use client';

import { Activity, Calendar, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NetWorthHeader() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Net Worth</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Giá trị tài sản ròng của bạn</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Placeholder for future actions */}
      </div>
    </motion.div>
  );
}

