'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { motion } from 'framer-motion';
import { Info, ArrowUpRight, ArrowRight, ArrowDownRight } from 'lucide-react';

interface ForecastData {
  month: string;
  optimistic: number;
  neutral: number;
  pessimistic: number;
}

const formatYAxis = (value: number) => {
  if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
  if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
  return value.toString();
};

const formatMoney = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
};

export default function NetWorthForecast({ data, current }: { data: ForecastData[], current: number }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex items-center justify-center">
        <p className="text-slate-500">Chưa có đủ dữ liệu để dự báo</p>
      </div>
    );
  }

  // Add current month at the beginning of the chart if it's not there
  const lastData = data[data.length - 1];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dự báo Net Worth</h2>
          <Info className="w-4 h-4 text-slate-400" />
        </div>
        <select className="text-sm font-medium text-slate-600 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer outline-none">
          <option>12 tháng tới</option>
          <option>3 năm tới</option>
          <option>5 năm tới</option>
        </select>
      </div>

      <div className="flex-1 w-full min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip 
              formatter={(value: any, name: any) => [
                formatMoney(value as number), 
                name === 'optimistic' ? 'Tích cực' : name === 'neutral' ? 'Trung bình' : 'Thận trọng'
              ]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            />
            <Area type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorOptimistic)" />
            <Area type="monotone" dataKey="neutral" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNeutral)" />
            <Area type="monotone" dataKey="pessimistic" stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 3" fill="none" />
            
            {/* Điểm hiện tại */}
            <ReferenceDot x={data[0].month} y={current} r={6} fill="#1e3a8a" stroke="#fff" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Callout box cho giá trị dự kiến */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-lg pointer-events-none hidden md:block">
          <p className="text-xs text-slate-500 font-medium mb-1">Ước tính {lastData.month}</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(lastData.neutral)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Kịch bản tích cực</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(lastData.optimistic)}</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Kịch bản trung bình</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(lastData.neutral)}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
          <div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">Kịch bản thận trọng</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(lastData.pessimistic)}</p>
          </div>
          <ArrowDownRight className="w-5 h-5 text-orange-500" />
        </div>
      </div>
    </motion.div>
  );
}

