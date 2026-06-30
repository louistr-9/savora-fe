import { getCachedUser } from '@/lib/auth';
import { fetchAPI } from '@/lib/api';


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

  try {
    const data = await fetchAPI('/dashboard/summary');
    return data;
  } catch (e) {
    console.error("Dashboard fetch error", e);
    return {
      summary: { netWorth: 0, currentBalance: 0, income: 0, incomeChange: 0, expense: 0, expenseChange: 0, savings: 0, savingsChange: 0, debt: 0 },
      expenseStructure: [],
      upcomingBills: [],
      goals: [],
      alerts: [{ type: 'danger', text: 'Lỗi tải dữ liệu', subtext: 'Không thể kết nối đến máy chủ' }],
      cashflowData: [], 
      cashflowByPeriod: { '7d': [], '6m': [], '12m': [] },
      netWorthSummary: { netWorth: 0, totalAssets: 0, totalDebt: 0, assetBreakdown: [] },
    };
  }
}


