'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI } from '@/lib/api';

export interface AssetType {
  id: string;
  user_id: string;
  name: string;
  type: 'real_estate' | 'cash' | 'gold' | 'stock' | 'crypto' | 'saving' | 'other';
  symbol: string | null;
  value: number;
  purchase_price: number;
  quantity: number | null;
  target_amount: number | null;
  target_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAssets(): Promise<AssetType[]> {
  try {
    const res = await fetchAPI('/assets');
    const assets = res.data || [];
    return assets.map((a: any) => ({
      ...a,
      id: a.id,
      user_id: a.userId,
      purchase_price: a.purchasePrice,
      target_amount: a.targetAmount,
      target_date: a.targetDate,
      created_at: a.createdAt,
      updated_at: a.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

export async function addAsset(data: {
  name: string;
  type: AssetType['type'];
  symbol?: string;
  value: number;
  purchase_price: number;
  quantity?: number;
  target_amount?: number;
  target_date?: string;
  description?: string;
}) {
  try {
    const res = await fetchAPI('/assets', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        purchasePrice: data.purchase_price,
        targetAmount: data.target_amount,
        targetDate: data.target_date
      }),
    });

    revalidatePath('/finance');
    revalidatePath('/finance/assets');
    revalidatePath('/finance/net-worth');
    
    return { success: true, asset: res.data };
  } catch (error: any) {
    console.error('Error adding asset:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAsset(id: string) {
  try {
    await fetchAPI(`/assets/${id}`, {
      method: 'DELETE',
    });
    
    revalidatePath('/finance/assets');
    revalidatePath('/finance/net-worth');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    return { success: false, error: error.message };
  }
}

