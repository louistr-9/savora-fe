import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/auth';
import AssetsClient from './AssetsClient';
import { getAssets } from './actions';
import { getBalanceHubData } from '../actions';

export const metadata = {
  title: 'Tài sản | Savora',
  description: 'Quản lý và theo dõi các tài sản bạn đang sở hữu.',
};

export default async function AssetsPage() {
  const user = await getCachedUser();

  const initialAssets = await getAssets();
  const balanceData = await getBalanceHubData();

  return (
    <AssetsClient initialAssets={initialAssets} cashBalance={balanceData.balance} />
  );
}

