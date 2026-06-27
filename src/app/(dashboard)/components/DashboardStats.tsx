import { getBalanceHubData } from '../finance/actions';
import StatCardClient from './StatCardClient';

const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatMoney = (amount: number) => {
  return moneyFormatter.format(amount).replace('₫', '').trim() + ' ₫';
};

export default async function DashboardStats() {
  const [balanceHub] = await Promise.all([
    getBalanceHubData(),
  ]);

  const budget = balanceHub.monthlyBudget || 0;
  const spent = balanceHub.monthlySpent;
  let expenseChange = 'Tháng này';
  let expenseColor: 'emerald' | 'teal' | 'rose' | 'indigo' | 'violet' | 'amber' | 'orange' = 'rose';
  
  if (budget > 0) {
    const percentage = (spent / budget) * 100;
    if (percentage < 50) {
      expenseChange = `An toàn (${Math.round(percentage)}%)`;
      expenseColor = 'teal';
    } else if (percentage <= 80) {
      expenseChange = `Cần chú ý (${Math.round(percentage)}%)`;
      expenseColor = 'orange';
    } else {
      expenseChange = `Sắp vượt hạn mức (${Math.round(percentage)}%)`;
      expenseColor = 'rose';
    }
  }

  let savingsChangeText = 'Bằng tháng trước';
  let savingsTrend: 'up' | 'down' = 'up';
  
  if (balanceHub.thisMonthSaving > 0 || balanceHub.lastMonthSaving > 0) {
    const diff = balanceHub.thisMonthSaving - balanceHub.lastMonthSaving;
    if (diff > 0) {
      savingsChangeText = `+${formatMoney(diff)} so với tháng trước`;
      savingsTrend = 'up';
    } else if (diff < 0) {
      savingsChangeText = `${formatMoney(diff)} so với tháng trước`;
      savingsTrend = 'down';
    } else {
      savingsChangeText = `Bằng tháng trước`;
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatCardClient 
        type="balance"
        label="Số dư khả dụng"
        value={formatMoney(balanceHub.balance)}
        change="Thực tế"
        trend="up"
        iconName="Wallet"
        color="emerald"
      />
      <StatCardClient 
        type="expense"
        label="Chi tiêu tháng"
        value={formatMoney(spent)}
        change={expenseChange}
        trend="down"
        iconName="TrendingUp"
        color={expenseColor}
      />
      <StatCardClient 
        type="savings"
        label="Tiết kiệm tổng"
        value={formatMoney(balanceHub.totalSavings)}
        change={savingsChangeText}
        trend={savingsTrend}
        iconName="PiggyBank"
        color="indigo"
      />
      <StatCardClient 
        type="balance"
        label="Thu nhập tháng"
        value={formatMoney(balanceHub.monthlyIncome)}
        change="Tổng thu nhập" 
        trend="up"
        iconName="TrendingUp"
        color="emerald"
      />
    </div>
  );
}

