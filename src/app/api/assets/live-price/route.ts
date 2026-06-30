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
    let change24h = 0;
    let sparkline7d: number[] = [];

    if (type === 'crypto') {
      const safeSymbol = symbol || '';
      try {
        // First get the CoinGecko ID from symbol
        const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${safeSymbol}`, {
          next: { revalidate: 3600 } // Cache search results
        });
        const searchData = await searchRes.json();
        
        let coinId = '';
        if (searchData && searchData.coins && searchData.coins.length > 0) {
          const exactMatch = searchData.coins.find((c: any) => c.symbol.toLowerCase() === safeSymbol.toLowerCase());
          coinId = exactMatch ? exactMatch.id : searchData.coins[0].id;
        } else {
          throw new Error('Coin not found on CoinGecko');
        }

        // Fetch market data including sparkline
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=vnd&ids=${coinId}&sparkline=true`, {
          next: { revalidate: 60 } // Cache for 60 seconds
        });
        const data = await res.json();
        
        if (data && data.length > 0) {
          price = parseFloat(data[0].current_price);
          change24h = parseFloat(data[0].price_change_percentage_24h || 0);
          sparkline7d = data[0].sparkline_in_7d?.price || [];
        } else {
          throw new Error('Invalid symbol or API error');
        }
      } catch (err) {
        console.log(`Fallback for crypto ${safeSymbol} due to API failure`);
        let hash = 0;
        for (let i = 0; i < safeSymbol.length; i++) hash = safeSymbol.charCodeAt(i) + ((hash << 5) - hash);
        price = Math.abs((hash % 100) + 10) * 25400;
        // Mock sparkline
        sparkline7d = Array.from({length: 10}, (_, i) => price * (1 + (Math.sin(i) * 0.05)));
        change24h = 0;
      }
    } 
    else if (type === 'stock') {
      const safeSymbol = symbol || '';
      try {
        // Fetch from DNSE API (Entrade)
        const to = Math.floor(Date.now() / 1000);
        const from = to - (86400 * 14); // 14 days ago to ensure enough data points
        const res = await fetch(`https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?resolution=1D&symbol=${safeSymbol}&from=${from}&to=${to}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          },
          next: { revalidate: 60 }
        });
        const data = await res.json();
        
        if (data && data.c && data.c.length > 0) {
          const c = data.c;
          const latestClose = c[c.length - 1];
          price = parseFloat(latestClose) * 1000;
          sparkline7d = c.map((p: string | number) => parseFloat(p as string) * 1000);
          
          if (c.length > 1) {
            const yesterdayClose = parseFloat(c[c.length - 2]);
            change24h = ((parseFloat(latestClose) - yesterdayClose) / yesterdayClose) * 100;
          }
        } else {
          throw new Error('No data from DNSE');
        }
      } catch (err) {
        console.log(`Fallback for stock ${safeSymbol} due to API failure/no data`);
        let hash = 0;
        for (let i = 0; i < safeSymbol.length; i++) hash = safeSymbol.charCodeAt(i) + ((hash << 5) - hash);
        price = Math.abs((hash % 100) + 10) * 1000;
        sparkline7d = Array.from({length: 10}, (_, i) => price * (1 + (Math.sin(i) * 0.05)));
        change24h = 0;
      }
    }
    else if (type === 'gold') {
      try {
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
        price = 140000000;
      }
    }

    return NextResponse.json({ price, symbol, change24h, sparkline7d });
  } catch (error: any) {
    console.error('Error fetching live price:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

