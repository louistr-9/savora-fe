'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI } from '@/lib/api';

export type DebtType = 'lent' | 'borrowed';
export type DebtStatus = 'active' | 'completed';

export interface DebtTypeInterface {
  id: string;
  user_id: string;
  type: DebtType;
  contact_name: string;
  amount: number;
  paid_amount: number;
  date: string;
  due_date: string | null;
  notes: string | null;
  group_name: string | null;
  status: DebtStatus;
  created_at: string;
}

export async function getDebts() {
  try {
    const res = await fetchAPI('/debts');
    const debts = res.data || [];
    return debts.map((d: any) => ({
      ...d,
      id: d.id,
      user_id: d.userId,
      contact_name: d.contactName,
      paid_amount: Number(d.paidAmount) || 0,
      amount: Number(d.amount) || 0,
      due_date: d.dueDate,
      group_name: d.groupName,
      created_at: d.createdAt
    })) as unknown as DebtTypeInterface[];
  } catch (error) {
    console.error('Error fetching debts:', error);
    return [];
  }
}

export async function addDebt(data: {
  type: DebtType;
  contact_name: string;
  amount: number;
  date: string;
  due_date?: string | null;
  notes?: string | null;
  group_name?: string | null;
}) {
  try {
    const res = await fetchAPI('/debts', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Tạo giao dịch tương ứng như logic cũ
    const txType = data.type === 'lent' ? 'expense' : 'income';
    const txCategory = data.type === 'lent' ? 'Cho vay' : 'Đi vay';
    const txTitle = `${txCategory} - ${data.contact_name}`;

    await fetchAPI('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: txTitle,
        amount: data.amount,
        category: txCategory,
        type: txType,
        date: new Date(data.date).toISOString(),
        debtId: res.data.id
      })
    });

    revalidatePath('/finance/debts');
    revalidatePath('/finance');
    revalidatePath('/dashboard');
    
    const mappedDebt = {
      ...res.data,
      id: res.data.id,
      user_id: res.data.userId || res.data.user?.id,
      contact_name: res.data.contactName,
      paid_amount: Number(res.data.paidAmount) || 0,
      due_date: res.data.dueDate,
      group_name: res.data.groupName,
      created_at: res.data.createdAt,
      amount: Number(res.data.amount) || 0
    };

    return { success: true, debt: mappedDebt };
  } catch (error: any) {
    console.error('Error adding debt:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDebt(id: string, data: {
  type: DebtType;
  contact_name: string;
  amount: number;
  date: string;
  due_date?: string | null;
  notes?: string | null;
  group_name?: string | null;
}) {
  try {
    await fetchAPI(`/debts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    revalidatePath('/finance/debts');
    revalidatePath('/finance');
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating debt:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDebtPayment(id: string, paymentAmount: number, paymentDate: string) {
  try {
    await fetchAPI(`/debts/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify({ amount: paymentAmount, date: paymentDate }),
    });

    revalidatePath('/finance/debts');
    revalidatePath('/finance');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error('Error updating debt payment:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDebt(id: string) {
  try {
    await fetchAPI(`/debts/${id}`, { method: 'DELETE' });

    revalidatePath('/finance/debts');
    revalidatePath('/finance');
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting debt:', error);
    return { success: false, error: error.message };
  }
}

