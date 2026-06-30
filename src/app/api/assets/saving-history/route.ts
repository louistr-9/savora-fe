import { NextResponse } from 'next/server';
import { fetchAPI } from '@/lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });
  }

  try {
    // We cannot use fetchAPI directly in Next.js App Router API route without passing the Authorization header.
    // Actually, fetchAPI in the server side needs cookies. It's better to fetch transactions in the Client Component.
    // Wait, the client component already can call `fetchAPI('/transactions?limit=100')`.
    // Why create an API route? Let's just create an API route to make it simpler, but wait! `fetchAPI` uses `cookies().get('session_token')`. 
    // Yes, `fetchAPI` in `src/lib/api.ts` handles server-side cookies properly.
    
    const res = await fetchAPI('/transactions?limit=100');
    const transactions = res.data || [];

    const relatedTxs = transactions.filter((tx: any) => {
      const desc = (tx.description || '').toLowerCase();
      const matchName = name.toLowerCase();
      // Usually saving recurrings have desc like 'Gửi tự động: Nuôi heo'
      return desc.includes(matchName) && tx.type === 'expense';
    });

    const totalCount = relatedTxs.length;
    const totalAmount = relatedTxs.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

    const history = relatedTxs.slice(0, 5).map((tx: any) => ({
      id: tx.id,
      amount: Number(tx.amount || 0),
      date: tx.date,
      description: tx.description
    }));

    return NextResponse.json({ history, totalCount, totalAmount });
  } catch (error: any) {
    console.error('Error fetching saving history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
