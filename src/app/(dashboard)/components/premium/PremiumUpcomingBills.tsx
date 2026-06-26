'use client';

import { motion } from 'framer-motion';
import { Calendar, Zap, CreditCard, ArrowRight, WalletCards } from 'lucide-react';

interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  date: string;
}

export default function PremiumUpcomingBills({ data }: { data: UpcomingBill[] }) {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('điện') || n.includes('nước') || n.includes('mạng')) return <Zap className="w-4 h-4 text-orange-500" />;
    if (n.includes('thẻ') || n.includes('tín dụng')) return <CreditCard className="w-4 h-4 text-blue-500" />;
    return <WalletCards className="w-4 h-4 text-emerald-500" />;
  };

  const getIconBg = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('điện') || n.includes('nước') || n.includes('mạng')) return 'bg-orange-50 dark:bg-orange-500/10';
    if (n.includes('thẻ') || n.includes('tín dụng')) return 'bg-blue-50 dark:bg-blue-500/10';
    return 'bg-emerald-50 dark:bg-emerald-500/10';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sắp tới</h2>
        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">Xem tất cả</button>
      </div>

      <div className="flex-1 space-y-4">
        {data.length > 0 ? (
          data.slice(0, 4).map((bill) => (
            <div key={bill.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(bill.name)}`}>
                  {getIcon(bill.name)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{bill.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" /> {bill.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-sm ${bill.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {bill.amount > 0 ? '+' : ''}{formatMoney(bill.amount)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-50">
            <Calendar className="w-8 h-8" />
            <p className="text-sm">Chưa có lịch sắp tới</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

