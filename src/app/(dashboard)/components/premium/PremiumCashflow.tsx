'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, Info } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

const fmtAxis = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(0) + 'M';
  if (abs >= 1_000) return sign + (abs / 1_000).toFixed(0) + 'K';
  return sign + String(abs);
};

const PERIODS = [
  { key: '7d', label: '7 ngày qua' },
  { key: '6m', label: '6 tháng gần nhất' },
  { key: '12m', label: '12 tháng qua' },
] as const;

type PeriodKey = '7d' | '6m' | '12m';
interface CashflowEntry { name: string; income: number; expense: number; net: number; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-100 dark:border-white/10 text-sm min-w-[180px]">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-3">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-1">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-slate-800 dark:text-white">{fmt(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function PremiumCashflow({
  data,
  cashflowByPeriod,
  netTotal,
}: {
  data: CashflowEntry[];
  cashflowByPeriod?: Record<PeriodKey, CashflowEntry[]>;
  netTotal: number;
}) {
  const [periodKey, setPeriodKey] = useState<PeriodKey>('7d');

  const chartData: CashflowEntry[] = cashflowByPeriod
    ? (cashflowByPeriod[periodKey] ?? data)
    : data;

  const insight = (() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    if (last.expense > 0 && prev.expense > 0 && last.expense < prev.expense) {
      const pct = Math.round(((prev.expense - last.expense) / prev.expense) * 100);
      return `Chi tiêu giảm ${pct}% so với kỳ trước, bạn đang kiểm soát rất tốt!`;
    }
    return null;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Biến động dòng tiền</h2>
            <Info className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">So sánh thu nhập, chi tiêu và tiền còn lại</p>
        </div>

        {/* Period selector */}
        <div className="relative">
          <select
            value={periodKey}
            onChange={e => setPeriodKey(e.target.value as PeriodKey)}
            className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-full pl-4 pr-8 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        {[
          { color: '#10b981', label: 'Thu nhập' },
          { color: '#f43f5e', label: 'Chi tiêu' },
          { color: '#3b82f6', label: 'Tiền còn lại' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-500 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={fmtAxis}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="income" name="Thu nhập" stroke="#10b981" strokeWidth={2.5} fill="url(#gIncome)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="expense" name="Chi tiêu" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gExpense)" dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="net" name="Tiền còn lại" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gNet)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      {insight && (
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-white/5 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-xs">ℹ</div>
          {insight}
        </div>
      )}
    </motion.div>
  );
}

