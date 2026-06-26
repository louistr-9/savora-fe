'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Inbox } from 'lucide-react';

interface StructureDonutProps {
  title: string;
  data: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  total: number;
  detailLink: string;
  linkText: string;
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const CustomTooltip = ({ active, payload, isDataEmpty }: any) => {
  if (isDataEmpty) return null;
  
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-white/10">
        <p className="font-semibold text-sm mb-1">{data.name}</p>
        <p className="text-emerald-600 font-bold">{formatMoney(data.value)}</p>
        <p className="text-xs text-slate-500 mt-1">{data.percentage}%</p>
      </div>
    );
  }
  return null;
};

// Map tailwind color classes to hex for recharts
const colorToHex: Record<string, string> = {
  'bg-emerald-500': '#10b981',
  'bg-blue-500': '#3b82f6',
  'bg-violet-500': '#8b5cf6',
  'bg-amber-500': '#f59e0b',
  'bg-slate-400': '#94a3b8',
  'bg-rose-500': '#f43f5e',
  'bg-orange-500': '#f97316',
};

export default function StructureDonut({ title, data, total, detailLink, linkText }: StructureDonutProps) {
  const isDataEmpty = data.length === 0 || total === 0;
  const chartData = isDataEmpty ? [{ name: 'Chưa có dữ liệu', value: 1, percentage: 0, color: 'empty' }] : data;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col relative"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>

      {/* Main Layout: 2 Columns Grid */}
      <div 
        className="flex-1 grid items-center mt-2" 
        style={{ gridTemplateColumns: '1fr 1fr' }}
      >
        
        {/* Lõi trái: Donut Chart */}
        <div className="relative w-full flex-shrink-0 flex items-center justify-center border-r border-slate-100 dark:border-white/5 py-2 pr-4 xl:pr-6">
          <div className="relative w-[160px] h-[160px] xl:w-[200px] xl:h-[200px] flex items-center justify-center">
            <PieChart width={200} height={200} className="absolute inset-0 z-10 scale-[0.8] xl:scale-100 origin-center">
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={isDataEmpty ? 0 : 2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isDataEmpty ? 'rgba(148, 163, 184, 0.15)' : (colorToHex[entry.color] || '#cbd5e1')} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip isDataEmpty={isDataEmpty} />} />
            </PieChart>

            {/* Tổng tiền bên trong lõi */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 whitespace-nowrap">
                {title.includes('tài sản') ? 'Tổng tài sản' : 'Tổng nợ'}
              </span>
              <span className="text-sm xl:text-base font-black text-slate-900 dark:text-white whitespace-nowrap">
                {formatMoney(total).replace(' đ', '')}
              </span>
              <span className="text-[10px] font-bold text-slate-900 dark:text-white mt-[1px]">đ</span>
            </div>
          </div>
        </div>

        {/* Lõi phải: Legend */}
        <div className="flex flex-col justify-center gap-3 w-full pl-4 xl:pl-6 h-full min-h-[160px]">
          {isDataEmpty ? (
            <div className="flex flex-col items-center justify-center text-center h-full opacity-60">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                 <Inbox className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Chưa có dữ liệu</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[120px]">
                Bạn chưa thêm {title.includes('tài sản') ? 'tài sản' : 'khoản nợ'} nào.
              </p>
            </div>
          ) : (
            data.slice(0, 5).map((item, idx) => (
              <div 
                key={idx} 
                className="grid gap-2 items-start"
                style={{ gridTemplateColumns: '1fr auto' }}
              >
                {/* Cột trái (Legend): Chấm màu, Tên, Số tiền */}
                <div className="grid gap-x-2 gap-y-0.5 items-start" style={{ gridTemplateColumns: 'auto 1fr' }}>
                  <div 
                    className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" 
                    style={{ backgroundColor: colorToHex[item.color] || '#cbd5e1' }}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[13px] leading-tight truncate">{item.name}</span>
                    <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap mt-0.5">
                      {formatMoney(item.value)}
                    </span>
                  </div>
                </div>

                {/* Cột phải (Legend): Phần trăm */}
                <div className="flex items-start justify-end pt-0.5">
                  <span className="text-[12px] font-bold text-slate-900 dark:text-white">{item.percentage}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-center">
        <Link href={detailLink} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          {linkText} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

