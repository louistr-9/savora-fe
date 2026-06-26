import { getCachedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsClient } from './SettingsClient';

import { fetchAPI } from '@/lib/api';

export const metadata = {
  title: 'Tài khoản | Savora',
};

export default async function SettingsPage() {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  let dbUser: any = {};
  try {
    dbUser = await fetchAPI('/users/me');
  } catch (e) {
    console.error('Lỗi khi lấy thông tin user:', e);
  }

  const initialData = {
    fullName: dbUser.name || user.name || '',
    avatarUrl: dbUser.avatar_url || (user as any).picture || '',
    email: dbUser.email || user.email || '',
    telegramChatId: dbUser.telegram_chat_id || '',
    discordUserId: dbUser.discord_user_id || '',
    geminiApiKey: dbUser.gemini_api_key ? '***************************************' : '',
    aiPersona: dbUser.ai_persona || 'professional',
    monthlyBudget: dbUser.monthly_budget || 0,
    initialBalance: dbUser.initial_balance || 0,
  };

  return <SettingsClient initialData={initialData} />;
}

