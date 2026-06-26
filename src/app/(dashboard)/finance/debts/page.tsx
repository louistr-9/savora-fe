import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/auth';
import DebtsClient from './DebtsClient';
import { getDebts } from './actions';

export const metadata = {
  title: 'Nợ & Cho vay | Savora',
  description: 'Quản lý các khoản nợ phải trả và khoản tiền bạn đã cho người khác vay.',
};

export default async function DebtsPage() {
  const user = await getCachedUser();

  const initialDebts = await getDebts();

  return (
    <DebtsClient initialDebts={initialDebts} />
  );
}

