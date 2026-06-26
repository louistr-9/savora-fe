import { FinanceClient } from './FinanceClient';
import { getBalanceHubData, getMonthlyTransactions } from './actions';
import { applyDueRecurringTransactions, getRecurringTransactions } from './recurringActions';
import { getCachedUser } from '@/lib/auth';
import { fetchAPI } from '@/lib/api';

export const metadata = {
  title: 'Tài chính | Savora',
  description: 'Quản trị dòng tiền hiệu quả với góc nhìn tổng quan mới.',
};

export default async function FinancePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  await applyDueRecurringTransactions();

  const [balanceHubData, monthlyTxs, recurringList] = await Promise.all([
    getBalanceHubData(),
    getMonthlyTransactions(year, month),
    getRecurringTransactions(),
  ]);
  
  const user = await getCachedUser();
  let savingAssets: any[] = [];
  
  if (user) {
    try {
      const res = await fetchAPI('/assets');
      const assets = res.data || [];
      savingAssets = assets
        .filter((a: any) => a.type === 'saving')
        .map((a: any) => ({
          id: a.id,
          name: a.name,
          value: a.value
        }));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <FinanceClient 
      initialBalanceInfo={balanceHubData}
      initialTransactions={monthlyTxs}
      initialYear={year}
      initialMonth={month}
      initialRecurring={recurringList}
      savingAssets={savingAssets}
    />
  );
}

