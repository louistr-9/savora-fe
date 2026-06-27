'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, Wallet, Flame, PiggyBank, Clock } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface StatCardProps {
  type: 'balance' | 'expense' | 'savings' | 'streak';
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  iconName: string;
  color: 'emerald' | 'teal' | 'rose' | 'indigo' | 'violet' | 'amber' | 'orange';
}

const ICON_MAP: Record<string, any> = { Wallet, TrendingUp, PiggyBank, Flame };

export default function StatCardClient({ type, label, value, change: serverChange, trend, iconName, color: serverColor }: StatCardProps) {
  const [showSavings, setShowSavings] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useLocalStorage('isBalanceVisible', false);
  const [isMounted, setIsMounted] = useState(false);
  const [liveHour, setLiveHour] = useState(12);

  useEffect(() => {
    setIsMounted(true);
    setLiveHour(new Date().getHours());
    const timer = setInterval(() => setLiveHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  let change = serverChange;
  let color = serverColor;

  const Icon = ICON_MAP[iconName] || Wallet;
  const colorMap: Record<string, any> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500 dark:bg-emerald-400' },
    teal:    { bg: 'bg-teal-500/10',    text: 'text-teal-600 dark:text-teal-400',    badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',    icon: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',    dot: 'bg-teal-500 dark:bg-teal-400' },
    rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',    icon: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',    dot: 'bg-rose-500 dark:bg-rose-400' },
    indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-600 dark:text-indigo-400',  badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',  icon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',  dot: 'bg-indigo-500 dark:bg-indigo-400' },
    violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',  badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',  icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',  dot: 'bg-violet-500 dark:bg-violet-400' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',   icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',   dot: 'bg-amber-500 dark:bg-amber-400' },
    orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400',  badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',  icon: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',  dot: 'bg-orange-500 dark:bg-orange-400' },
  };
  const c = colorMap[color] || colorMap['emerald'];

  const getDisplayValue = () => {
    if (!isMounted) return value;
    if (type === 'savings') return showSavings ? value : '*** ₫';
    if (type === 'balance') return isBalanceVisible ? value : '****** ₫';
    return value;
  };

  return (
    <div className={`bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-5 sm:p-7 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 relative group`}>
      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${c.icon} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold ${c.badge} border border-transparent group-hover:border-current transition-all overflow-hidden`}>
             {type === 'expense' || type === 'streak' ? change : `${trend === 'up' ? '↑ ' : '↓ '}${change}`}
        </div>
      </div>
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-xs sm:text-sm font-medium text-foreground/40">{label}</p>
          {(type === 'savings' || type === 'balance') && (
            <button 
              onClick={(e) => { e.preventDefault(); type === 'savings' ? setShowSavings(!showSavings) : setIsBalanceVisible(!isBalanceVisible); }}
              className="text-foreground/40 hover:text-foreground/80 transition-colors"
            >
              {type === 'savings' ? (showSavings ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />) : (isBalanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />)}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className={`text-xl sm:text-2xl font-heading font-bold tracking-tight ${c.text}`}>
            {getDisplayValue()}
          </p>
        </div>
      </div>
    </div>
  );
}

