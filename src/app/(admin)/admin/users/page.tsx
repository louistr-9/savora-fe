'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function formatTime(seconds: number) {
  if (!seconds) return '0p';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}p`;
  return `${m}p`;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI('/admin/users')
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý Người Dùng</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Danh sách người dùng và thống kê truy cập.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Tên & Email</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Role</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-center">Đăng nhập bằng</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-right">Lượt truy cập</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-right">Tổng thời gian</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Thiết bị (User-Agent)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{user.name || 'Chưa cập nhật'}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[11px] font-bold tracking-wide ${user.role === 'ADMIN' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.provider === 'google' ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-500/20">Google</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700">Email</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {user.visit_count || 0}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600 dark:text-amber-400">
                    {formatTime(user.total_usage_time)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[200px]" title={user.last_device || ''}>
                    {user.last_device || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <div className="text-sm">Không có dữ liệu người dùng.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
