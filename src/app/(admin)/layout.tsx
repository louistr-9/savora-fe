import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  let dbUser: any = null;
  try {
    const { fetchAPI } = await import('@/lib/api');
    dbUser = await fetchAPI('/users/me');
  } catch (e) {
    console.error('Lỗi khi lấy thông tin user trong admin layout:', e);
  }

  if (dbUser?.role !== 'ADMIN' && user?.email !== 'louistran090902@gmail.com') {
    redirect('/');
  }

  const displayName = dbUser?.name ?? user?.user_metadata?.full_name ?? user?.name ?? user?.email?.split('@')[0] ?? 'Admin';
  const avatarUrl = dbUser?.avatar_url ?? user?.user_metadata?.avatar_url ?? user?.image ?? null;
  const email = user?.email ?? '';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-background">
      <AdminSidebar displayName={displayName} avatarUrl={avatarUrl} email={email} role={dbUser?.role} />
      
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
