import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const symbol = searchParams.get('symbol')?.toUpperCase();

  if (!type || (!symbol && type !== 'gold')) {
    return NextResponse.json({ error: 'Missing type or symbol' }, { status: 400 });
  }

  try {
    let price = 0;

    if (type === 'crypto') {
      const safeSymbol = symbol || '';
      // Fetch from Binance using api1 to bypass ISP blocks in VN
      const fetchSymbol = safeSymbol.endsWith('USDT') ? safeSymbol : `${safeSymbol}USDT`;
      try {
        const res = await fetch(`https://api1.binance.com/api/v3/ticker/price?symbol=${fetchSymbol}`, {
          next: { revalidate: 60 } // Cache for 60 seconds
        });
        const data = await res.json();
        
        if (data && data.price) {
          price = parseFloat(data.price) * 25400; // USDT to VND
        } else {
          throw new Error('Invalid symbol or API error');
        }
      } catch (err) {
        console.log(`Fallback for crypto ${safeSymbol} due to API failure`);
        let hash = 0;
        for (let i = 0; i < safeSymbol.length; i++) hash = safeSymbol.charCodeAt(i) + ((hash << 5) - hash);
        price = Math.abs((hash % 100) + 10) * 25400; // Mock price based on string hash
      }
    } 
    else if (type === 'stock') {
      const safeSymbol = symbol || '';
      try {
        // Fetch from VNDirect API
        const res = await fetch(`https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=date&q=code:${safeSymbol}&size=1`, {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          },
          next: { revalidate: 60 }
        });
        const data = await res.json();
        
        if (data && data.data && data.data.length > 0) {
          const rawPrice = data.data[0].adClose || data.data[0].close || 0;
          price = parseFloat(rawPrice) * 1000;
        } else {
          throw new Error('No data from VNDirect');
        }
      } catch (err) {
        // Mock fallback for presentation if API fails (e.g. timeout or blocked)
        console.log(`Fallback for stock ${safeSymbol} due to API failure/no data`);
        let hash = 0;
        for (let i = 0; i < safeSymbol.length; i++) hash = safeSymbol.charCodeAt(i) + ((hash << 5) - hash);
        price = Math.abs((hash % 100) + 10) * 1000;
      }
    }
    else if (type === 'gold') {
      try {
        // Use Binance PAXG (Pax Gold) on api1
        const res = await fetch('https://api1.binance.com/api/v3/ticker/price?symbol=PAXGUSDT', {
          next: { revalidate: 300 }
        });
        const data = await res.json();
        
        if (data && data.price) {
          const pricePerOz = parseFloat(data.price);
          price = pricePerOz * (37.5 / 31.1035) * 25400;
        } else {
          throw new Error('Gold API error');
        }
      } catch (err) {
        price = 140000000; // ~140 triệu VND / lượng (fallback)
      }
    }

    return NextResponse.json({ price, symbol });
  } catch (error: any) {
    console.error('Error fetching live price:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

