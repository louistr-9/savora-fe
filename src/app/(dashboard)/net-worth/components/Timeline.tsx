'use client';

import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, CreditCard, PiggyBank } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense' | 'investment' | 'debt';
}

const formatMoney = (amount: number) => {
  const sign = amount > 0 ? '+' : '';
  return sign + new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const getIcon = (type: string) => {
  switch (type) {
    case 'income': return <Briefcase className="w-4 h-4" />;
    case 'investment': return <TrendingUp className="w-4 h-4" />;
    case 'debt': return <CreditCard className="w-4 h-4" />;
    default: return <PiggyBank className="w-4 h-4" />;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case 'income': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400';
    case 'investment': return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400';
    case 'debt': return 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400';
    default: return 'text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400';
  }
};

export default function Timeline({ data }: { data: TimelineEvent[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dòng thời gian</h2>
        <button onClick={() => setIsModalOpen(true)} className="text-sm font-medium text-slate-500 hover:text-slate-700">Xem tất cả</button>
      </div>

      <div className="flex-1 relative">
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
        <div className="space-y-6 relative">
          {data.slice(0, 5).map((item, idx) => (
            <div key={item.id} className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 outline outline-4 outline-white dark:outline-slate-900 ${getColor(item.type)}`}>
                {getIcon(item.type)}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${item.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatMoney(item.amount)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.date}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lịch sử Dòng thời gian">
        <div className="relative pt-2 pb-4 pr-2">
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
          <div className="space-y-6 relative">
            {data.map((item, idx) => (
              <div key={item.id} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 outline outline-4 outline-white dark:outline-slate-900 ${getColor(item.type)}`}>
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${item.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatMoney(item.amount)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

