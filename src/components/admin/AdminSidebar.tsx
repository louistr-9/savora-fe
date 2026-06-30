'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Map, Settings, ArrowLeft, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { useAdminLayout } from './AdminLayoutContext';

interface AdminSidebarProps {
  displayName?: string;
  avatarUrl?: string | null;
  email?: string;
  role?: string;
}

export function AdminSidebar({ displayName, avatarUrl, email, role }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useAdminLayout();

  const menuItems = [
    { label: 'Tổng quan', icon: LayoutDashboard, href: '/admin' },
    { label: 'Người dùng', icon: Users, href: '/admin/users' },
    { label: 'Địa điểm (Places)', icon: Map, href: '/admin/places' },
    { label: 'Cài đặt hệ thống', icon: Settings, href: '/admin/settings' },
  ];

  const initials = displayName
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 border-r border-slate-800 lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand & App Return */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-teal flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Admin<span className="text-emerald-teal">Panel</span></span>
          </Link>
          <button 
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="px-4 py-4 flex-1 overflow-y-auto">
        {/* Menu Items */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-teal" : "text-slate-500")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-800 p-4">
        <Link 
          href="/" 
          className="group flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
        >
          <div className="p-1.5 rounded-md bg-slate-800 text-slate-400 group-hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Về Savora App</span>
        </Link>
        <div className="flex items-center gap-3 px-2 py-3">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Admin" width={36} height={36} className="rounded-full bg-slate-800 object-cover" unoptimized />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-teal flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{email}</p>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
