'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface NetWorthChartProps {
  data: {
    month: string;
    netWorth: number;
    totalAssets: number;
    totalDebt: number;
  }[];
}

const formatYAxis = (value: number) => {
  if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
  if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
  return value.toString();
};

const formatTooltip = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
};

export default function NetWorthChart({ data }: NetWorthChartProps) {
  const [timeRange, setTimeRange] = useState('6m');

  const filteredData = data.slice(
    timeRange === '6m' ? -6 : timeRange === '1y' ? -12 : 0
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Biểu đồ Net Worth</h2>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="text-sm font-medium text-slate-600 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer outline-none"
        >
          <option value="6m">6 tháng qua</option>
          <option value="1y">1 năm qua</option>
          <option value="all">Tất cả</option>
        </select>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                formatTooltip(value as number), 
                name === 'netWorth' ? 'Tài sản ròng' : name === 'totalAssets' ? 'Tổng tài sản' : 'Tổng nợ'
              ]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              formatter={(value) => {
                if (value === 'netWorth') return 'Tài sản ròng';
                if (value === 'totalAssets') return 'Tổng tài sản';
                if (value === 'totalDebt') return 'Tổng nợ';
                return value;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="netWorth" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2 }} 
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="totalAssets" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={{ r: 3 }} 
            />
            <Line 
              type="monotone" 
              dataKey="totalDebt" 
              stroke="#f43f5e" 
              strokeWidth={2} 
              dot={{ r: 3 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

