'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI } from '@/lib/api';
import { getCachedUser } from '@/lib/auth';
import { GoogleGenerativeAI } from "@google/generative-ai";

function getVNTime(date: Date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}

// ==========================================
// QUẢN LÝ GIAO DỊCH (THÔNG QUA BACKEND API)
// ==========================================

export async function getMonthlyTransactions(year: number, month: number) {
  try {
    // Để đơn giản, ta fetch 1000 giao dịch mới nhất (nếu app to hơn thì truyền param startDate, endDate cho API)
    const res = await fetchAPI('/transactions?limit=1000');
    const transactions = res.data || [];

    // Lọc thủ công ở frontend cho nhanh trong phạm vi tháng
    return transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    }).map((t: any) => ({
      id: t.id,
      title: t.description || t.title,
      amount: t.amount,
      category: t.category,
      type: t.type,
      date: getVNTime(new Date(t.date)),
      asset_id: t.assetId || null,
      created_at: t.created_at,
      entered_by: t.entered_by
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function addTransaction(formData: FormData) {
  const titleInput = formData.get('title') as string;
  const amountStr = formData.get('amount') as string;
  const amount = Number(amountStr.replace(/\D/g, ''));
  const categoryInput = formData.get('category') as string;
  const type = formData.get('type') as 'income' | 'expense' | 'saving';
  const dateStr = formData.get('date') as string;
  const date = new Date(dateStr);

  let category = categoryInput;
  let title = titleInput?.trim();
  const assetId = formData.get('asset_id') as string | null;

  if (!title) {
    if (type === 'income') category = 'Quà tặng & Thu nhập khác';
    else if (type === 'saving') category = 'Gửi vào mục tiêu';
    else category = 'Chi tiêu khác';
    title = category;
  }

  const user = await getCachedUser();
  if (!user) {
    return { error: 'Bạn cần đăng nhập để thực hiện giao dịch' };
  }

  if (!amount || !category || !type || !date) {
    return { error: 'Thiếu thông tin giao dịch quan trọng (Số tiền/Danh mục)' };
  }

  if (type === 'saving' && !assetId) {
    return { error: 'Vui lòng chọn mục tiêu tiết kiệm (Heo đất / Sổ tiết kiệm).' };
  }

  try {
    await fetchAPI('/transactions', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, description: title, amount, category, type, date: date.toISOString() }),
    });

    revalidatePath('/finance');
    if (type === 'saving') {
      revalidatePath('/finance/assets');
    }
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Lỗi hệ thống' };
  }
}

export async function addTransactionsBatch(transactions: Array<{ title: string, amount: number, category: string, type: 'income' | 'expense' | 'saving', date: string }>) {
  const user = await getCachedUser();
  if (!user) return { error: 'Bạn cần đăng nhập để thực hiện giao dịch' };

  // Thay vì Batch API phức tạp, gọi loop POST (vì dữ liệu ít)
  for (const t of transactions) {
    let category = t.category;
    let title = t.title?.trim();

    if (!title) {
      if (t.type === 'income') category = 'Quà tặng & Thu nhập khác';
      else if (t.type === 'saving') category = 'Bỏ heo/Tiết kiệm tự do';
      else category = 'Chi tiêu khác';
      title = category;
    }

    try {
      await fetchAPI('/transactions', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id, description: title, amount: t.amount, category, type: t.type, date: new Date(t.date).toISOString() }),
      });
    } catch (e) { }
  }
  revalidatePath('/finance');
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const user = await getCachedUser();
  if (!user) return { error: 'Bạn cần đăng nhập để thực hiện giao dịch' };

  await fetchAPI(`/transactions/${id}`, { method: 'DELETE' });
  revalidatePath('/finance');
  return { success: true };
}

export async function deleteAllTransactions() {
  const user = await getCachedUser();
  if (!user) return { error: 'Bạn cần đăng nhập' };

  await fetchAPI('/transactions/all', { method: 'DELETE' });
  revalidatePath('/finance');
  return { success: true };
}

export async function updateTransaction(id: string, formData: FormData) {
  const user = await getCachedUser();
  if (!user) return { error: 'Bạn cần đăng nhập để thực hiện giao dịch' };

  const titleInput = formData.get('title') as string;
  const amountStr = formData.get('amount') as string;
  const amount = Number(amountStr.replace(/\D/g, ''));
  const categoryInput = formData.get('category') as string;
  const type = formData.get('type') as 'income' | 'expense' | 'saving';
  const date = new Date(formData.get('date') as string);

  let category = categoryInput;
  let title = titleInput?.trim();

  if (!title) {
    if (type === 'income') category = 'Quà tặng & Thu nhập khác';
    else if (type === 'saving') category = 'Bỏ heo/Tiết kiệm tự do';
    else category = 'Chi tiêu khác';
    title = category;
  }

  await fetchAPI(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, amount, category, type, date: date.toISOString() }),
  });

  revalidatePath('/finance');
  return { success: true };
}

export async function getBalanceHubData() {
  try {
    const res = await fetchAPI('/transactions?limit=10000');
    const transactions = res.data || [];

    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;
    let monthlyIncome = 0;
    let monthlySpent = 0;
    let thisMonthSaving = 0;
    let lastMonthSaving = 0;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    transactions.forEach((t: any) => {
      const d = new Date(t.date);
      const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const isLastMonth = d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;

      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpense += t.amount;
      if (t.type === 'saving') totalSavings += t.amount;

      if (isThisMonth) {
        if (t.type === 'income') monthlyIncome += t.amount;
        if (t.type === 'expense') monthlySpent += t.amount;
        if (t.type === 'saving') thisMonthSaving += t.amount;
      }

      if (isLastMonth && t.type === 'saving') {
        lastMonthSaving += t.amount;
      }
    });

    const userRes = await fetchAPI('/users/me');
    const user = userRes || {};
    const initialBalance = Number(user.initial_balance) || 0;
    const monthlyBudget = Number(user.monthly_budget) || 5000000;

    const balance = initialBalance + totalIncome - totalExpense - totalSavings;

    return {
      balance,
      monthlyIncome,
      monthlySpent,
      totalSavings,
      thisMonthSaving,
      lastMonthSaving,
      initialBalance,
      monthlyBudget
    };
  } catch (e) {
    return { balance: 0, monthlyIncome: 0, monthlySpent: 0, totalSavings: 0, initialBalance: 0, monthlyBudget: 0, thisMonthSaving: 0, lastMonthSaving: 0 };
  }
}

export async function getDashboardRecentTransactions(limit = 5) {
  try {
    const res = await fetchAPI(`/transactions?limit=${limit}`);
    return (res.data || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      amount: t.amount,
      category: t.category,
      type: t.type,
      date: getVNTime(new Date(t.date)),
      entered_by: t.entered_by
    }));
  } catch (e) { return []; }
}

export async function getDashboardCategorySplit() {
  try {
    const res = await fetchAPI('/transactions?limit=1000');
    const transactions = res.data || [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const categoryMap: Record<string, number> = {};

    transactions.forEach((t: any) => {
      const d = new Date(t.date);
      if (t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      }
    });

    return Object.keys(categoryMap).map(k => ({
      category: k,
      amount: categoryMap[k]
    })).sort((a, b) => b.amount - a.amount);
  } catch (e) { return []; }
}

export async function getWeeklyOverview() {
  try {
    const res = await fetchAPI('/transactions?limit=1000');
    const transactions = res.data || [];

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const txMap = new Map<string, { spend: number, income: number, saving: number }>();

    transactions.forEach((t: any) => {
      const d = new Date(t.date);
      if (d >= sevenDaysAgo && d <= today) {
        const dStr = getVNTime(d).substring(0, 10);
        const stats = txMap.get(dStr) || { spend: 0, income: 0, saving: 0 };
        if (t.type === 'income') stats.income += t.amount;
        if (t.type === 'expense') stats.spend += t.amount;
        if (t.type === 'saving') stats.saving += t.amount;
        txMap.set(dStr, stats);
      }
    });

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const chartData = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dStr = getVNTime(d).substring(0, 10);
      const dayName = dayNames[d.getDay()];
      const stats = txMap.get(dStr) || { spend: 0, income: 0, saving: 0 };
      chartData.push({
        name: dayName,
        fullDate: dStr,
        spend: stats.spend,
        income: stats.income,
        saving: stats.saving
      });
    }

    return chartData;
  } catch (e) { return []; }
}

export async function aiCategorize(title: string) {
  return { title, amount: 0, type: 'expense', category: 'Chi tiêu khác' };
}

