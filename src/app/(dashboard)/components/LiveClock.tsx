'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LiveClock() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const initialDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const currentDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
      if (currentDate !== initialDate) {
        window.location.reload(); 
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl px-5 py-3 shadow-sm backdrop-blur-md">
      <Clock className="w-4 h-4 text-foreground/30" />
      <span className="text-xs font-bold text-foreground/60 whitespace-nowrap">
        {isMounted && currentTime ? (
          `lúc ${currentTime.toLocaleTimeString('vi-VN', { hour12: false })} ${currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
        ) : 'Đang tải...'}
      </span>
    </div>
  );
}

