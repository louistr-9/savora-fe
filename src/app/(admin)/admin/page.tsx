'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Users, MapPin, Map, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI('/admin/stats')
      .then(res => setStats(res.data))
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
        <h1 className="text-2xl font-bold">Tổng quan hệ thống</h1>
        <p className="text-foreground/60">Chào mừng Admin! Dưới đây là các chỉ số chính.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-sm text-foreground/60 font-medium">Tổng người dùng</div>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Map className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <div className="text-sm text-foreground/60 font-medium">Tổng số Plan đã tạo</div>
            <div className="text-2xl font-bold">{stats?.totalPlans || 0}</div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <div className="text-sm text-foreground/60 font-medium">Địa điểm AI đã thu thập</div>
            <div className="text-2xl font-bold">{stats?.totalPlaces || 0}</div>
          </div>
        </div>
      </div>
      
      {/* Nút truy cập nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <a href="/admin/users" className="block p-6 rounded-xl bg-card border border-border hover:border-emerald-teal transition-colors group">
          <h3 className="font-semibold text-lg group-hover:text-emerald-teal transition-colors">Quản lý Người Dùng &rarr;</h3>
          <p className="text-sm text-foreground/60 mt-1">Xem danh sách, thông tin liên hệ và trạng thái của người dùng.</p>
        </a>
        <a href="/admin/places" className="block p-6 rounded-xl bg-card border border-border hover:border-emerald-teal transition-colors group">
          <h3 className="font-semibold text-lg group-hover:text-emerald-teal transition-colors">Dữ liệu AI (Scraped) &rarr;</h3>
          <p className="text-sm text-foreground/60 mt-1">Xem các địa điểm, tọa độ do AI tự động cào về từ truy vấn của người dùng.</p>
        </a>
      </div>

      <div className="mt-8 border-t border-border pt-8">
        <h2 className="text-xl font-bold mb-4">Công cụ Kiểm thử (Testing)</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={async () => {
              const res = await fetchAPI('/admin/test-holidays');
              if (res) alert(res.message || 'Thành công!');
            }}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm font-medium"
          >
            Test Thông báo Lễ/Tết (Holidays)
          </button>
          
          <button 
            onClick={async () => {
              const res = await fetchAPI('/admin/test-recurrings');
              if (res) alert(res.message || 'Thành công!');
            }}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
          >
            Test Thông báo Định kỳ (Recurrings)
          </button>
        </div>
      </div>
    </div>
  );
}
