import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';

import { AIChatbot } from '@/components/AIChatbot';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCachedUser();

  // Bỏ chặn redirect để hỗ trợ Guest Mode
  // if (!user) {
  //   redirect('/login');
  // }

  let dbUser: any = null;
  if (user) {
    try {
      const { fetchAPI } = await import('@/lib/api');
      dbUser = await fetchAPI('/users/me');
    } catch (e) {
      console.error('Lỗi khi lấy thông tin user trong layout:', e);
    }
  }

  const displayName = dbUser?.name ?? user?.user_metadata?.full_name ?? user?.name ?? user?.email?.split('@')[0] ?? 'Khách';
  const avatarUrl = dbUser?.avatar_url ?? user?.user_metadata?.avatar_url ?? user?.image ?? null;
  const email = user?.email ?? '';
  const role = dbUser?.role ?? 'USER';

  return (
    <>
      <Sidebar displayName={displayName} avatarUrl={avatarUrl} email={email} role={role} />
      <main className="pl-0 lg:pl-64 min-h-screen pb-24 lg:pb-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
      <AIChatbot />
    </>
  );
}

