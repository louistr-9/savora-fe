import { Metadata } from 'next';
import { getCachedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getNetWorthData } from './data';
import NetWorthClient from './components/NetWorthClient';


export const metadata: Metadata = {
  title: 'Net Worth | Savora',
  description: 'Quản lý tài sản ròng và phân bổ tài sản',
};

export default async function NetWorthPage() {
  const user = await getCachedUser();
  const data = await getNetWorthData(user?.id || '');

  return (
    <div className="w-full pb-12 space-y-6">

      <Suspense fallback={
        <div className="w-full h-[500px] bg-slate-100/50 dark:bg-slate-800/50 animate-pulse rounded-[32px]" />
      }>
        <NetWorthClient data={data} user={user} />
      </Suspense>
    </div>
  );
}

