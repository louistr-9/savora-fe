import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/auth';
import DashboardHeader from './components/DashboardHeader';
import { getPremiumDashboardData } from './data';
import PremiumDashboardClient from './components/premium/PremiumDashboardClient';

export default async function DashboardPage() {
  const user = await getCachedUser();

  let dbUser: any = null;
  if (user) {
    try {
      const { fetchAPI } = await import('@/lib/api');
      dbUser = await fetchAPI('/users/me');
    } catch (e) {
      console.error('Lỗi khi lấy thông tin user trong dashboard:', e);
    }
  }

  const displayName = dbUser?.name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Người dùng';
  const avatarUrl = dbUser?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const email = user?.email ?? '';

  // Fetch the massive premium dashboard data payload
  const dashboardData = await getPremiumDashboardData();

  return (
    <div className="w-full pb-12 space-y-8">
      <DashboardHeader 
        displayName={displayName} 
        avatarUrl={avatarUrl} 
        email={email} 
      />

      <Suspense fallback={
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[100px] bg-slate-100/50 dark:bg-white/5 animate-pulse rounded-[24px] border border-slate-200/50 dark:border-white/5" />
          ))}
        </div>
      }>
        <PremiumDashboardClient data={dashboardData} user={user} />
      </Suspense>
    </div>
  );
}

