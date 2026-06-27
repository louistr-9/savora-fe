'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchUnreadCount = async () => {
    try {
      const res = await fetchAPI('/notifications/unread-count');
      if (res && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch (e) {
      console.error('Failed to fetch unread notifications count', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetchAPI('/notifications');
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string, url: string | null) => {
    try {
      await fetchAPI(`/notifications/${id}/read`, { method: 'PUT' });
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setIsOpen(false);
      if (url) {
        router.push(url);
      }
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    try {
      await fetchAPI('/notifications/read-all', { method: 'PUT' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  return (
    <div className="relative flex items-center justify-center" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-colors",
          isOpen ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Thông báo</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Bạn không có thông báo nào.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => markAsRead(notif.id, notif.action_url)}
                      className={cn(
                        "p-4 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        !notif.is_read ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                      )}
                    >
                      <div className="mt-1">
                        {!notif.is_read ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-transparent"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm mb-1",
                          !notif.is_read ? "font-semibold text-slate-900 dark:text-slate-100" : "font-medium text-slate-600 dark:text-slate-300"
                        )}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                          {new Date(notif.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
