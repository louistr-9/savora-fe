import { getCachedUser } from '@/lib/auth';
import { fetchAPI } from '@/lib/api';

const ASSET_LABELS: Record<string, string> = {
  real_estate: 'Bất động sản',
  cash: 'Tiền mặt & Ngân hàng',
  gold: 'Vàng & Hàng hóa',
  stock: 'Chứng khoán',
  crypto: 'Tiền số (Crypto)',
  saving: 'Tiết kiệm',
  other: 'Khác',
  lent: 'Khoản cho vay',
};

const ASSET_COLORS: Record<string, string> = {
  real_estate: '#8b5cf6',
  cash: '#10b981',
  gold: '#f59e0b',
  stock: '#3b82f6',
  crypto: '#6366f1',
  saving: '#14b8a6',
  other: '#94a3b8',
  lent: '#0ea5e9',
};

export async function getPremiumDashboardData() {
  const authUser = await getCachedUser();
  if (!authUser) {
    return {
      summary: { netWorth: 0, currentBalance: 0, income: 0, incomeChange: 0, expense: 0, expenseChange: 0, savings: 0, savingsChange: 0, debt: 0 },
      expenseStructure: [],
      upcomingBills: [],
      goals: [],
      alerts: [{ type: 'info', text: 'Chế độ xem trước', subtext: 'Đăng nhập để lưu trữ dữ liệu lâu dài' }],
      cashflowData: [], 
      cashflowByPeriod: { '7d': [], '6m': [], '12m': [] },
      netWorthSummary: { netWorth: 0, totalAssets: 0, totalDebt: 0, assetBreakdown: [] },
    };
  }

  const today = new Date();
  
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999).getTime();

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();

  let allTxs: any[] = [];
  let upcomingBills: any[] = [];
  let assets: any[] = [];
  let allDebts: any[] = [];
  let user: any = {};

  try {
    const [txsRes, recurRes, assetsRes, debtsRes, userRes] = await Promise.all([
      fetchAPI('/transactions?limit=10000'),
      fetchAPI('/recurrings').catch(() => ({ data: [] })),
      fetchAPI('/assets').catch(() => ({ data: [] })),
      fetchAPI('/debts').catch(() => ({ data: [] })),
      fetchAPI('/users/me').catch(() => ({}))
    ]);
    allTxs = txsRes.data || [];
    upcomingBills = (recurRes.data || []).filter((r: any) => r.isActive);
    assets = assetsRes.data || [];
    allDebts = debtsRes.data || [];
    user = userRes || {};
  } catch (e) {
    console.error("Dashboard fetch error", e);
  }

  const debtCategories = ['Đi vay', 'Thu nợ', 'Cho vay', 'Trả nợ'];

  let allTimeIncome = 0, allTimeExpense = 0, allTimeSaving = 0;
  let incomeThisMonth = 0, expenseThisMonth = 0, savingThisMonth = 0;
  let incomeLastMonth = 0, expenseLastMonth = 0, savingLastMonth = 0;
  const categoryMap = new Map<string, number>();

  for (const t of allTxs) {
    const tDate = new Date(t.date).getTime();
    
    if (t.type === 'income') allTimeIncome += t.amount;
    else if (t.type === 'expense') allTimeExpense += t.amount;
    else if (t.type === 'saving') allTimeSaving += t.amount;

    if (tDate >= startOfThisMonth && tDate <= endOfThisMonth) {
      if (t.type === 'income' && !debtCategories.includes(t.category)) incomeThisMonth += t.amount;
      else if (t.type === 'expense' && !debtCategories.includes(t.category)) {
        expenseThisMonth += t.amount;
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
      }
      else if (t.type === 'saving') savingThisMonth += t.amount;
    }

    if (tDate >= startOfLastMonth && tDate <= endOfLastMonth) {
      if (t.type === 'income' && !debtCategories.includes(t.category)) incomeLastMonth += t.amount;
      else if (t.type === 'expense' && !debtCategories.includes(t.category)) expenseLastMonth += t.amount;
      else if (t.type === 'saving') savingLastMonth += t.amount;
    }
  }

  const initialBalance = Number(user.initial_balance) || 0;
  const currentBalance = initialBalance + allTimeIncome - allTimeExpense - allTimeSaving;

  const calcPercent = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const incomeChange = calcPercent(incomeThisMonth, incomeLastMonth);
  const expenseChange = calcPercent(expenseThisMonth, expenseLastMonth);
  const savingChange = calcPercent(savingThisMonth, savingLastMonth);
  
  assets.forEach((a: any) => {
    if (a.type === 'cash' && a.description === 'sync:cashflow') {
      a.value = currentBalance;
    }
  });
  const activeBorrowed = allDebts.filter((d: any) => d.type === 'borrowed' && d.status === 'active');
  const activeLent = allDebts.filter((d: any) => d.type === 'lent' && d.status === 'active');

  const totalAssetsFromAssets = assets.reduce((sum, a: any) => sum + (Number(a.value) || 0), 0);
  const totalLentAssets = activeLent.reduce((sum, d: any) => sum + (Number(d.amount) - Number(d.paidAmount || 0)), 0);
  const totalAssets = totalAssetsFromAssets + totalLentAssets;
  
  const totalDebtReal = activeBorrowed.reduce((sum, d: any) => sum + (Number(d.amount) - Number(d.paidAmount || 0)), 0);
  
  const netWorth = totalAssets - totalDebtReal;
  const totalDebt = totalDebtReal;

  const groupedAssets: Record<string, number> = {};
  assets.forEach((a: any) => {
    groupedAssets[a.type] = (groupedAssets[a.type] || 0) + Number(a.value);
  });
  if (totalLentAssets > 0) groupedAssets['lent'] = totalLentAssets;

  const assetBreakdown = Object.entries(groupedAssets)
    .filter(([_, v]) => v > 0)
    .map(([type, value]) => ({
      type,
      name: ASSET_LABELS[type] || 'Khác',
      value,
      percentage: totalAssets > 0 ? Math.round((value / totalAssets) * 100) : 0,
      color: ASSET_COLORS[type] || '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const expenseStructure = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const alerts = [];
  const monthlyBudget = Number(user.monthly_budget) || 0;
  if (monthlyBudget > 0) {
    const budgetUsage = (expenseThisMonth / monthlyBudget) * 100;
    if (budgetUsage > 80) {
      alerts.push({ type: 'danger', text: `Bạn đã chi tiêu ${Math.round(budgetUsage)}% ngân sách`, subtext: 'Hãy chú ý nhé' });
    }
  }

  const goals = assets.filter((a: any) => a.type === 'saving' || a.targetAmount > 0);
  const emergencyGoal = goals.find((g: any) => g.name.toLowerCase().includes('khẩn cấp'));
  if (emergencyGoal) {
    const efProgress = (emergencyGoal.value / emergencyGoal.targetAmount) * 100;
    if (efProgress < 30) {
      alerts.push({ type: 'warning', text: 'Quỹ khẩn cấp thấp', subtext: `Chỉ còn ${Math.round(efProgress)}% mục tiêu` });
    }
  }
  const buildMonthlyData = (months: number) => {
    const map = new Map<string, { name: string; income: number; expense: number; net: number }>();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, { name: `T${d.getMonth() + 1}`, income: 0, expense: 0, net: 0 });
    }
    for (const t of allTxs) {
      if (debtCategories.includes(t.category)) continue;
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) continue;
      const entry = map.get(key)!;
      if (t.type === 'income') { entry.income += t.amount; entry.net += t.amount; }
      else if (t.type === 'expense') { entry.expense += t.amount; entry.net -= t.amount; }
    }
    return Array.from(map.values());
  };

  const buildDailyData = (days: number) => {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const map = new Map<string, { name: string; income: number; expense: number; net: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, { name: dayNames[d.getDay()], income: 0, expense: 0, net: 0 });
    }
    for (const t of allTxs) {
      if (debtCategories.includes(t.category)) continue;
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) continue;
      const entry = map.get(key)!;
      if (t.type === 'income') { entry.income += t.amount; entry.net += t.amount; }
      else if (t.type === 'expense') { entry.expense += t.amount; entry.net -= t.amount; }
    }
    return Array.from(map.values());
  };

  const cashflowByPeriod = {
    '7d': buildDailyData(7),
    '6m': buildMonthlyData(6),
    '12m': buildMonthlyData(12),
  };

  return {
    summary: {
      netWorth,
      currentBalance,
      income: incomeThisMonth,
      incomeChange,
      expense: expenseThisMonth,
      expenseChange,
      savings: savingThisMonth,
      savingsChange: savingChange,
      debt: totalDebt,
    },
    expenseStructure,
    upcomingBills: upcomingBills.map((b: any) => ({
      id: b.id,
      name: b.title,
      amount: b.amount,
      date: b.lastAppliedDate || 'Sắp tới',
    })),
    goals: goals.map((g: any) => ({
      id: g.id,
      name: g.name,
      current: g.value,
      target: g.targetAmount || g.value,
      icon: 'Target',
      color: 'text-emerald-500'
    })),
    alerts,
    cashflowData: cashflowByPeriod['7d'], 
    cashflowByPeriod,
    netWorthSummary: {
      netWorth,
      totalAssets,
      totalDebt,
      assetBreakdown,
    },
  };
}

