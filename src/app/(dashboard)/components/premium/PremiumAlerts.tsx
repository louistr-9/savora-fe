'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Droplet, Info, ChevronRight } from 'lucide-react';

interface AlertItem {
  type: 'danger' | 'warning' | 'info';
  text: string;
  subtext?: string;
}

export default function PremiumAlerts({ data }: { data: AlertItem[] }) {
  const getIcon = (type: string) => {
    if (type === 'danger') return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    if (type === 'warning') return <Droplet className="w-5 h-5 text-orange-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  const getIconBg = (type: string) => {
    if (type === 'danger') return 'bg-rose-50 dark:bg-rose-500/10';
    if (type === 'warning') return 'bg-orange-50 dark:bg-orange-500/10';
    return 'bg-blue-50 dark:bg-blue-500/10';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col"
    >
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Cảnh báo</h2>

      <div className="flex-1 space-y-3">
        {data.length > 0 ? (
          data.map((alert, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 group cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(alert.type)}`}>
                  {getIcon(alert.type)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{alert.text}</p>
                  {alert.subtext && (
                    <p className="text-xs text-slate-500 mt-0.5">{alert.subtext}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-50 py-4">
            <Info className="w-8 h-8" />
            <p className="text-sm">Mọi thứ đều ổn</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

