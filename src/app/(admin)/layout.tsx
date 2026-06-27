import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';

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

  if (dbUser?.role !== 'ADMIN') {
    redirect('/');
  }

  const displayName = dbUser?.name ?? user?.user_metadata?.full_name ?? user?.name ?? user?.email?.split('@')[0] ?? 'Admin';
  const avatarUrl = dbUser?.avatar_url ?? user?.user_metadata?.avatar_url ?? user?.image ?? null;
  const email = user?.email ?? '';

  return (
    <>
      <Sidebar displayName={displayName} avatarUrl={avatarUrl} email={email} role={dbUser?.role} />
      <main className="pl-0 lg:pl-64 min-h-screen pb-24 lg:pb-0 bg-background">
        <div className="mx-auto max-w-7xl p-4 sm:p-8">
          {children}
        </div>
      </main>
    </>
  );
}
