'use client';

import { useState } from 'react';
import DashboardAreaChartClient from './DashboardAreaChartClient';

// Assuming recharts is available
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface Props {
  weeklyData: any[];
  categorySplit: { category: string; amount: number }[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export default function DashboardChartTabsClient({ weeklyData, categorySplit }: Props) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'category'>('weekly');

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-8 border-b border-slate-100/50 dark:border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`text-sm font-bold pb-2 border-b-2 transition-all ${
            activeTab === 'weekly' 
              ? 'border-violet-500 text-violet-600 dark:text-violet-400' 
              : 'border-transparent text-foreground/40 hover:text-foreground/80'
          }`}
        >
          Dòng tiền (Tuần)
        </button>
        <button
          onClick={() => setActiveTab('category')}
          className={`text-sm font-bold pb-2 border-b-2 transition-all ${
            activeTab === 'category' 
              ? 'border-violet-500 text-violet-600 dark:text-violet-400' 
              : 'border-transparent text-foreground/40 hover:text-foreground/80'
          }`}
        >
          Chi tiêu (Tháng)
        </button>
      </div>

      <div className="h-[280px] w-full relative">
        {activeTab === 'weekly' && (
          <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <DashboardAreaChartClient chartData={weeklyData} />
          </div>
        )}
        
        {activeTab === 'category' && (
          <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {categorySplit.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categorySplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value as number)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '12px', fontWeight: '500' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-100 rounded-2xl">
                 <p className="text-sm font-medium text-foreground/40">Chưa có dữ liệu chi tiêu tháng này.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'weekly' && (
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-slate-100/50 flex-wrap animate-in fade-in duration-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Chi tiêu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Thu nhập</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Tiết kiệm</span>
          </div>
        </div>
      )}
    </div>
  );
}

