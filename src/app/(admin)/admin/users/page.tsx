'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
        <h1 className="text-2xl font-bold">Quản lý Người Dùng</h1>
        <p className="text-foreground/60">Danh sách toàn bộ tài khoản đăng ký trên hệ thống.</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-foreground/5 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Tên & Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Số dư ban đầu</th>
                <th className="px-4 py-3 font-semibold">AI Persona</th>
                <th className="px-4 py-3 font-semibold">Telegram ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.name || 'Chưa cập nhật'}</div>
                    <div className="text-xs text-foreground/50">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-emerald-teal font-medium">
                    {formatCurrency(Number(user.initial_balance || 0))}
                  </td>
                  <td className="px-4 py-3 text-foreground/70 capitalize">
                    {user.ai_persona}
                  </td>
                  <td className="px-4 py-3 text-foreground/50 text-xs">
                    {user.telegram_chat_id || 'Chưa liên kết'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center text-foreground/50">Không có dữ liệu người dùng.</div>
          )}
        </div>
      </div>
    </div>
  );
}
