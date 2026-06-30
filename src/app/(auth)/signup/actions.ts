'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const initialBalance = Number(formData.get('initialBalance') || 0);
  const monthlyBudget = Number(formData.get('monthlyBudget') || 5000000);

  if (!email || !password || !fullName) {
    redirect('/signup?message=' + encodeURIComponent('Vui lòng điền đầy đủ thông tin'));
  }

  let redirectUrl = '';

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        name: fullName,
        initialBalance,
        monthlyBudget,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=10b981&color=fff`
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi đăng ký tài khoản');
    }

    redirectUrl = '/verify-email?email=' + encodeURIComponent(email);
  } catch (error: any) {
    redirectUrl = '/signup?message=' + encodeURIComponent(error.message || 'Lỗi tạo tài khoản');
  }

  if (redirectUrl.includes('/login')) {
    revalidatePath('/', 'layout');
  }
  redirect(redirectUrl);

}

