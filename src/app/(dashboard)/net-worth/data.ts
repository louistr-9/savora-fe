import { fetchAPI } from '@/lib/api';

export interface NetWorthData {
  summary: {
    netWorth: number;
    netWorthChange: number;
    totalAssets: number;
    totalDebt: number;
    debtToAssetRatio: number;
  };
  chartData: {
    month: string;
    netWorth: number;
    totalAssets: number;
    totalDebt: number;
  }[];
  assetStructure: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  debtStructure: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  pyramid: {
    level: string;
    description: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  timeline: {
    id: string;
    title: string;
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense' | 'investment' | 'debt';
  }[];
  forecast: {
    month: string;
    optimistic: number;
    neutral: number;
    pessimistic: number;
  }[];
}

const ASSET_COLORS: Record<string, string> = {
  'real_estate': 'bg-violet-500',
  'cash': 'bg-emerald-500',
  'gold': 'bg-amber-500',
  'stock': 'bg-blue-500',
  'crypto': 'bg-indigo-500',
  'saving': 'bg-teal-500',
  'other': 'bg-slate-400',
};

const ASSET_LABELS: Record<string, string> = {
  'real_estate': 'Bất động sản',
  'cash': 'Tiền mặt & Ngân hàng',
  'gold': 'Vàng & Hàng hóa',
  'stock': 'Chứng khoán',
  'crypto': 'Tiền số (Crypto)',
  'saving': 'Tiết kiệm / Bỏ heo',
  'other': 'Khác',
};

export async function getNetWorthData(userId: string): Promise<NetWorthData> {
  try {
    const [assetsRes, debtsRes, txsRes, statsRes] = await Promise.all([
      fetchAPI('/assets'),
      fetchAPI('/debts'),
      fetchAPI('/transactions?limit=10'), // Chỉ cần 10 giao dịch cho timeline
      fetchAPI(`/users/stats`)
    ]);

    const assets = assetsRes.data || [];
    const debts = debtsRes.data || [];
    const allTxs = txsRes.data || [];
    const stats = statsRes || {};

    const cashBalance = stats.balance || 0;

    assets.forEach((a: any) => {
      if (a.type === 'cash' && a.description === 'sync:cashflow') {
        a.value = cashBalance;
      }
    });

    const activeBorrowed = debts.filter((d: any) => d.type === 'borrowed' && d.status === 'active');
    const activeLent = debts.filter((d: any) => d.type === 'lent' && d.status === 'active');

    const totalAssetsFromAssets = assets.reduce((sum: number, a: any) => sum + (Number(a.value) || 0), 0);
    const totalLentAssets = activeLent.reduce((sum: number, d: any) => sum + (Number(d.amount) - Number(d.paidAmount || 0)), 0);
    const totalAssets = totalAssetsFromAssets + totalLentAssets;
    
    const totalDebt = activeBorrowed.reduce((sum: number, d: any) => sum + (Number(d.amount) - Number(d.paidAmount || 0)), 0);
    
    const netWorth = totalAssets - totalDebt;
    const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;

    const groupedAssets: Record<string, number> = {};
    assets.forEach((a: any) => {
      groupedAssets[a.type] = (groupedAssets[a.type] || 0) + Number(a.value);
    });
    
    if (totalLentAssets > 0) {
      groupedAssets['lent'] = totalLentAssets;
    }
    
    const extendedAssetLabels = { ...ASSET_LABELS, 'lent': 'Khoản cho vay' };
    const extendedAssetColors = { ...ASSET_COLORS, 'lent': 'bg-sky-500' };

    const assetStructure = Object.entries(groupedAssets)
      .filter(([_, value]) => value > 0)
      .map(([type, value]) => ({
        name: extendedAssetLabels[type as keyof typeof extendedAssetLabels] || 'Khác',
        value,
        percentage: Math.round((value / totalAssets) * 100),
        color: extendedAssetColors[type as keyof typeof extendedAssetColors] || 'bg-slate-400',
      }))
      .sort((a, b) => b.value - a.value);

    const debtStructure = activeBorrowed
      .filter((d: any) => (Number(d.amount) - Number(d.paidAmount || 0)) > 0)
      .map((d: any, index: number) => {
        const remaining = Number(d.amount) - Number(d.paidAmount || 0);
        const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-red-400'];
        return {
          name: d.contactName,
          value: remaining,
          percentage: Math.round((remaining / totalDebt) * 100),
          color: colors[index % colors.length],
        };
      })
      .sort((a: { value: number; }, b: { value: number; }) => b.value - a.value);

    const getPyramidValue = (types: string[]) => 
      assets.filter((a: any) => types.includes(a.type)).reduce((sum: number, a: any) => sum + Number(a.value), 0);

    const pyramidValues = {
      investment: getPyramidValue(['stock', 'real_estate', 'crypto', 'gold']),
      saving: getPyramidValue(['cash', 'saving']),
      essential: getPyramidValue(['other']),
    };

    const pyramid = [
      { level: 'Tự do tài chính', description: '> 10 tỷ đ', value: 0, percentage: 0, color: 'bg-amber-200 text-amber-800' },
      { 
        level: 'Đầu tư tăng trưởng', 
        description: 'Chứng khoán, BĐS, Vàng', 
        value: pyramidValues.investment, 
        percentage: totalAssets > 0 ? Math.round((pyramidValues.investment / totalAssets) * 100) : 0, 
        color: 'bg-blue-400 text-white' 
      },
      { 
        level: 'Dự phòng & Tích lũy', 
        description: 'Tiền mặt, Tiết kiệm', 
        value: pyramidValues.saving, 
        percentage: totalAssets > 0 ? Math.round((pyramidValues.saving / totalAssets) * 100) : 0, 
        color: 'bg-indigo-400 text-white' 
      },
      { 
        level: 'Nền tảng thiết yếu', 
        description: 'Tài sản khác', 
        value: pyramidValues.essential, 
        percentage: totalAssets > 0 ? Math.round((pyramidValues.essential / totalAssets) * 100) : 0, 
        color: 'bg-orange-300 text-orange-900' 
      },
    ];

    const txs = allTxs;
    const timeline = txs.map((tx: any) => ({
      id: tx.id,
      title: tx.title,
      description: tx.category,
      amount: tx.amount * (tx.type === 'expense' ? -1 : 1),
      date: new Date(tx.date).toLocaleDateString('vi-VN'),
      type: (tx.type === 'income' || tx.type === 'saving') ? 'income' : 'expense' as any,
    }));

    const currentMonth = new Date().getMonth() + 1;
    const chartData = [
      { month: `T${currentMonth}`, netWorth, totalAssets, totalDebt },
    ];

    const forecast = [
      { month: `T${currentMonth}`, optimistic: netWorth, neutral: netWorth, pessimistic: netWorth },
    ];

    return {
      summary: {
        netWorth,
        netWorthChange: 0, 
        totalAssets,
        totalDebt,
        debtToAssetRatio: Number(debtToAssetRatio.toFixed(2)),
      },
      chartData,
      assetStructure,
      debtStructure,
      pyramid,
      timeline,
      forecast,
    };
  } catch(e) {
    return {
      summary: { netWorth: 0, netWorthChange: 0, totalAssets: 0, totalDebt: 0, debtToAssetRatio: 0 },
      chartData: [],
      assetStructure: [],
      debtStructure: [],
      pyramid: [],
      timeline: [],
      forecast: [],
    };
  }
}

