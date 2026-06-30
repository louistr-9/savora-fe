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
      user_id: a.userId || a.user_id,
      purchase_price: a.purchasePrice ?? a.purchase_price ?? 0,
      target_amount: a.targetAmount ?? a.target_amount ?? null,
      target_date: a.targetDate ?? a.target_date ?? null,
      created_at: a.createdAt || a.created_at || null,
      updated_at: a.updatedAt || a.updated_at || null
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
    
    const a = res.data;
    const mappedAsset = {
      ...a,
      id: a.id,
      user_id: a.userId,
      purchase_price: a.purchasePrice,
      target_amount: a.targetAmount,
      target_date: a.targetDate,
      created_at: a.createdAt,
      updated_at: a.updatedAt
    };
    
    return { success: true, asset: mappedAsset as AssetType };
  } catch (error: any) {
    console.error('Error adding asset:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAsset(id: string, data: Partial<{
  name: string;
  type: AssetType['type'];
  symbol: string;
  value: number;
  purchase_price: number;
  quantity: number;
}>) {
  try {
    const res = await fetchAPI(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        ...(data.purchase_price !== undefined && { purchasePrice: data.purchase_price })
      }),
    });

    revalidatePath('/finance');
    revalidatePath('/finance/assets');
    revalidatePath('/finance/net-worth');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating asset:', error);
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

