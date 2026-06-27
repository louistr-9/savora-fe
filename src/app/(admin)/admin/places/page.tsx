'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Loader2, Map } from 'lucide-react';

export default function AdminPlaces() {
  const [placesData, setPlacesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchAPI(`/admin/places?page=${page}`)
      .then(res => setPlacesData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dữ liệu Địa điểm (AI Scraped)</h1>
        <p className="text-foreground/60">Danh sách các địa điểm mà Savora đã tự động thu thập từ gợi ý của AI.</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-foreground/5 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Tên Địa điểm</th>
                <th className="px-4 py-3 font-semibold">Địa chỉ</th>
                <th className="px-4 py-3 font-semibold">Tọa độ (Lat/Lng)</th>
                <th className="px-4 py-3 font-semibold">Ngày lấy</th>
                <th className="px-4 py-3 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border relative min-h-[200px]">
              {loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-teal mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && placesData?.items?.map((place: any) => (
                <tr key={place.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-3 font-medium">{place.name}</td>
                  <td className="px-4 py-3 text-xs text-foreground/70 max-w-[200px] truncate" title={place.address}>
                    {place.address || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono bg-foreground/5 rounded px-1 w-fit">
                    {place.lat}, {place.lng}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/50">
                    {new Date(place.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-teal/10 text-emerald-teal hover:bg-emerald-teal/20 rounded text-xs font-medium transition-colors"
                    >
                      <Map className="w-3 h-3" />
                      Mở Maps
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && placesData?.items?.length === 0 && (
            <div className="p-8 text-center text-foreground/50">Chưa cào được dữ liệu địa điểm nào.</div>
          )}
        </div>

        {/* Phân trang */}
        {!loading && placesData?.totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-between items-center bg-foreground/5">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded bg-card border border-border disabled:opacity-50 text-sm"
            >
              Trang trước
            </button>
            <span className="text-sm text-foreground/60">
              Trang {page} / {placesData.totalPages} (Tổng {placesData.total} địa điểm)
            </span>
            <button 
              disabled={page === placesData.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded bg-card border border-border disabled:opacity-50 text-sm"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
