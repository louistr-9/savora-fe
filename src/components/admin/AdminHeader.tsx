'use client';

import { usePathname } from 'next/navigation';
import { Menu, Search, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminHeader() {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length === 1 && paths[0] === 'admin') {
      return 'Tổng quan hệ thống';
    }
    
    if (paths.includes('users')) return 'Quản lý người dùng';
    if (paths.includes('places')) return 'Dữ liệu Địa điểm (Places)';
    if (paths.includes('settings')) return 'Cài đặt hệ thống';
    
    return 'Admin Dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[var(--border)] h-[72px] flex items-center px-4 sm:px-8">
      <div className="flex items-center gap-4 flex-1">
        <button className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">
            {getBreadcrumbs()}
          </h1>
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5 font-medium mt-0.5">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300">{getBreadcrumbs()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden md:flex relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="w-64 h-10 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white focus:border-emerald-teal/50 focus:ring-2 focus:ring-emerald-teal/20 outline-none text-sm transition-all"
          />
        </div>
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
        </button>
      </div>
    </header>
  );
}
