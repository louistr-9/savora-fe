'use server';

import { fetchAPI } from '@/lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  'Thiết yếu': '#2563EB', // blue-600
  'Ăn uống': '#D97706', // amber-600
  'Mua sắm': '#9333EA', // purple-600
  'Di chuyển': '#F97316', // orange-500
  'Giải trí': '#EC4899', // pink-500
  'Sức khỏe': '#F43F5E', // rose-500
  'Khác': '#64748B', // slate-500
};

export async function getReportData(year: number, month: number) {
  try {
    const [categoryRes, monthlyRes] = await Promise.all([
      fetchAPI(`/reports/category?year=${year}&month=${month}`),
      fetchAPI(`/reports/monthly?year=${year}&month=${month}`)
    ]);

    const expenseData = (categoryRes.data || categoryRes || []).map((item: any) => ({
      name: item.category,
      value: item.total,
      color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Khác']
    }));

    // Build the last 6 months list from monthlyRes
    // monthlyRes format: [{ month_group: '2024-05', type: 'income', total: 5000 }, ...]
    const monthlyMap = new Map<string, { thu: number, chi: number }>();
    (monthlyRes.data || monthlyRes || []).forEach((item: any) => {
      const stats = monthlyMap.get(item.month_group) || { thu: 0, chi: 0 };
      if (item.type === 'income') stats.thu += item.total;
      if (item.type === 'expense') stats.chi += item.total;
      monthlyMap.set(item.month_group, stats);
    });

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      const mStr = m.toString().padStart(2, '0');
      const key = `${y}-${mStr}`;
      const stats = monthlyMap.get(key) || { thu: 0, chi: 0 };
      monthlyData.push({
        name: `T${m}`,
        thu: stats.thu,
        chi: stats.chi
      });
    }

    return { expenseData, monthlyData };
  } catch(e) {
    return { expenseData: [], monthlyData: [] };
  }
}

export async function exportTransactionsCSV() {
  try {
    const res = await fetchAPI('/transactions?limit=5000');
    return res.data || [];
  } catch(e) {
    return [];
  }
}

