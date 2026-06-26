'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AssetPieChartProps {
  pieData: any[];
  formatCurrency: (amount: number) => string;
}

export default function AssetPieChart({ pieData, formatCurrency }: AssetPieChartProps) {
  if (pieData.length === 0) {
    return (
      <div className="w-full h-full relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 6" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          innerRadius={30}
          outerRadius={50}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
      </PieChart>
    </ResponsiveContainer>
  );
}

