'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PyramidLevel {
  level: string;
  description: string;
  value: number;
  percentage: number;
  color: string;
}

interface NetWorthPyramidProps {
  data: PyramidLevel[];
  total: number;
}

const formatMoney = (amount: number) => {
  if (amount === 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

export default function NetWorthPyramid({ data, total }: NetWorthPyramidProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col"
    >
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tháp Net Worth</h2>
        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-white/5">
          <span className="w-[30%]">TÀI SẢN</span>
          <div className="flex justify-end gap-4 xl:gap-6 min-w-max">
            <span className="text-right whitespace-nowrap">GIÁ TRỊ</span>
            <span className="text-right whitespace-nowrap">TỶ TRỌNG</span>
          </div>
        </div>
      </div>

      <div 
        className="relative flex-1 grid min-h-[280px] gap-2 pt-4 pb-2"
        style={{ gridTemplateColumns: 'minmax(0, 1fr) 180px minmax(0, 1fr)' }}
      >
        
        {/* Cột 1: Tên & Mô tả */}
        <div className="flex flex-col justify-between">
          {data.map((item, idx) => (
            <div key={`left-${idx}`} className="flex-1 flex flex-col justify-center border-b border-slate-100 dark:border-white/5 border-dashed last:border-0 pr-2">
              <span className="font-bold text-slate-900 dark:text-white truncate text-[13px]">{item.level}</span>
              <span className="text-[11px] text-slate-500 truncate">{item.description}</span>
            </div>
          ))}
        </div>

        {/* Cột 2: Hình Tháp */}
        <div className="w-full h-full flex flex-col bg-transparent" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', WebkitClipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}>
          {data.map((item, idx) => {
            const colors = ['#FDBA74', '#A78BFA', '#60A5FA', '#6EE7B7', '#FCD34D'];
            const bgColor = colors[idx] || '#cbd5e1';
            return (
              <div 
                key={`pyramid-${idx}`} 
                className="flex-1 border-b-2 border-white dark:border-slate-900 last:border-0 opacity-90"
                style={{ backgroundColor: bgColor }}
              />
            );
          })}
        </div>

        {/* Cột 3: Giá trị & Tỷ trọng */}
        <div className="flex flex-col justify-between">
          {data.map((item, idx) => (
            <div key={`right-${idx}`} className="flex-1 flex items-center justify-end gap-2 border-b border-slate-100 dark:border-white/5 border-dashed last:border-0 pl-2">
              <span className="font-semibold text-slate-900 dark:text-white text-[13px] text-right whitespace-nowrap">
                {formatMoney(item.value).replace(' đ', '')} <span className="text-[10px] text-slate-500">đ</span>
              </span>
              <span className="font-bold text-slate-600 dark:text-slate-400 text-xs text-right w-10 whitespace-nowrap">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>

      </div>

      <div className="flex items-center justify-between text-sm py-4 mt-2 border-t-2 border-slate-100 dark:border-white/10">
        <span className="font-bold text-slate-900 dark:text-white w-[35%]">Tổng tài sản</span>
        <div className="flex items-center justify-end gap-4 min-w-max">
          <span className="font-black text-slate-900 dark:text-white text-right text-base whitespace-nowrap">
            {formatMoney(total).replace(' đ', '')} <span className="text-xs text-slate-500">đ</span>
          </span>
          <span className="font-black text-slate-900 dark:text-white text-right w-10 whitespace-nowrap">
            100%
          </span>
        </div>
      </div>

      <div className="mt-2 pt-2 flex justify-center">
        <Link href="#" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          Tìm hiểu thêm về tháp tài sản <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

