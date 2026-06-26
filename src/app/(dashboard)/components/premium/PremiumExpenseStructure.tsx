'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpenseCategory {
  name: string;
  value: number;
}

const COLORS = ['#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#64748b'];

export default function PremiumExpenseStructure({ data, totalExpense }: { data: ExpenseCategory[], totalExpense: number }) {
  
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = totalExpense > 0 ? ((data.value / totalExpense) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-white/10 shadow-lg text-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{data.name}</p>
            <p className="text-slate-500">{formatMoney(data.value)} ({percent}%)</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cơ cấu chi tiêu</h2>
          <p className="text-sm text-slate-500">Theo danh mục</p>
        </div>
        <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-full px-4 py-2 text-sm font-medium outline-none">
          <option>Tháng này</option>
        </select>
      </div>

      <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
        {data.length > 0 ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-xs text-slate-400 font-medium">Tổng chi tiêu</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(totalExpense)}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="text-slate-400 text-sm">Chưa có dữ liệu chi tiêu</div>
        )}
      </div>

      {data.length > 0 && (
        <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-900 dark:text-white">{formatMoney(item.value)}</span>
                <span className="text-xs text-slate-400 w-8 text-right">
                  {totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

