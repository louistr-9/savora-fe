'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI } from '@/lib/api';

export async function updateProfile(formData: FormData) {
  
  const payload: any = {};
  
  const fullName = formData.get('fullName') as string;
  const avatarUrl = formData.get('avatarUrl') as string;
  const telegramChatId = formData.get('telegramChatId') as string;
  const discordUserId = formData.get('discordUserId') as string;
  const geminiApiKey = formData.get('geminiApiKey') as string;

  if (fullName !== null) payload.name = fullName.trim();
  if (avatarUrl !== null) payload.avatarUrl = avatarUrl.trim() || null;
  if (telegramChatId !== null) payload.telegramChatId = telegramChatId.trim() || null;
  if (discordUserId !== null) payload.discordUserId = discordUserId.trim() || null;
  
  const aiPersona = formData.get('aiPersona') as string;
  if (aiPersona) payload.aiPersona = aiPersona;
  
  if (geminiApiKey !== null && geminiApiKey !== '***************************************') {
    payload.geminiApiKey = geminiApiKey.trim() || null;
  }

  const monthlyBudget = formData.get('monthlyBudget');
  if (monthlyBudget !== null) {
    payload.monthlyBudget = Number(monthlyBudget);
  }

  const initialBalance = formData.get('initialBalance');
  if (initialBalance !== null) {
    payload.initialBalance = Number(initialBalance);
  }

  try {
    await fetchAPI('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật profile qua API:', error.message);
    throw new Error('Không thể cập nhật hồ sơ: ' + error.message);
  }

  // Revalidate routes to reflect new data
  revalidatePath('/settings', 'page');
  revalidatePath('/', 'page');
  revalidatePath('/dashboard', 'page');
  revalidatePath('/finance', 'page');
  revalidatePath('/', 'layout');
}

