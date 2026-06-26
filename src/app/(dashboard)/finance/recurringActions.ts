'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI } from '@/lib/api';

function getVNTime(date: Date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}

export interface RecurringTransactionType {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense' | 'saving';
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_month: number | null;
  day_of_week: number | null;
  last_applied_date: string | null;
  is_active: boolean;
  created_at: string;
  asset_id: string | null;
}

export async function getRecurringTransactions(): Promise<RecurringTransactionType[]> {
  try {
    const res = await fetchAPI('/recurrings');
    const rules = res.data || [];

    return rules.map((r: any) => ({
      ...r,
      id: r.id,
      user_id: r.user_id || r.userId,
      day_of_month: r.day_of_month || r.dayOfMonth,
      day_of_week: r.day_of_week || r.dayOfWeek,
      is_active: r.is_active !== undefined ? r.is_active : r.isActive,
      last_applied_date: r.last_processed || r.lastAppliedDate,
      asset_id: r.asset_id || r.assetId || null,
      created_at: r.created_at || r.createdAt
    })) as unknown as RecurringTransactionType[];
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    return [];
  }
}

export async function createRecurringTransaction(payload: {
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense' | 'saving';
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_month?: number;
  day_of_week?: number;
  asset_id?: string | null;
}) {
  try {
    await fetchAPI('/recurrings', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        day_of_month: payload.day_of_month,
        day_of_week: payload.day_of_week,
        asset_id: payload.asset_id
      })
    });
    revalidatePath('/finance');
  } catch (error: any) {
    throw new Error('Không thể tạo khoản định kỳ: ' + error.message);
  }
}

export async function toggleRecurringTransaction(id: string, is_active: boolean) {
  try {
    await fetchAPI(`/recurrings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active })
    });
    revalidatePath('/finance');
  } catch (error: any) {
    throw new Error('Không thể cập nhật: ' + error.message);
  }
}

export async function deleteRecurringTransaction(id: string) {
  try {
    await fetchAPI(`/recurrings/${id}`, { method: 'DELETE' });
    revalidatePath('/finance');
  } catch (error: any) {
    throw new Error('Không thể xóa khoản định kỳ: ' + error.message);
  }
}

export async function applyDueRecurringTransactions(): Promise<number> {
  try {
    await fetchAPI('/recurrings/trigger', { method: 'POST' });
    return 1;
  } catch (e) {
    console.error('Trigger fail', e);
    return 0;
  }
}

