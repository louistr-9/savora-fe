'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from 'next/cache';
import { fetchAPI } from '@/lib/api';

// Removed global genAI, fetching from profile instead

function getVNDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

export interface TransactionItem {
  title: string;
  amount: number;
  category: string;
  transactionType: 'expense' | 'income' | 'saving';
  date: string;
}

export type AIParseResult = 
  | { type: 'transaction', data: TransactionItem, message: string }
  | { type: 'batch_transaction', data: TransactionItem[], message: string }
  | { type: 'debt', data: { title: string; amount: number; debtType: 'lent' | 'borrowed'; contact_name: string; date: string }, message: string }
  | { type: 'chat', message: string }
  | { type: 'unknown', message: string };

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

async function getUserFinancialContext(): Promise<string> {
  try {
    const res = await fetchAPI('/transactions?limit=1000');
    const txs = res.data || [];
    if (!txs || txs.length === 0) return '(Chưa có giao dịch nào)';

    const today = getVNDate();
    const [year, month] = today.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1).getTime();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    const monthTxs = txs.filter((t: any) => {
      const d = new Date(t.date).getTime();
      return d >= startDate && d <= endDate;
    });

    if (monthTxs.length === 0) return '(Chưa có giao dịch nào tháng này)';

    const income = monthTxs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
    const expense = monthTxs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
    const saving = monthTxs.filter((t: any) => t.type === 'saving').reduce((s: number, t: any) => s + t.amount, 0);

    const catMap = new Map<string, number>();
    monthTxs.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount);
    });
    const topCats = [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: ${(amt / 1000).toFixed(0)}k`)
      .join(', ');

    return `Tháng ${month}/${year} — Thu: ${(income / 1_000_000).toFixed(1)}tr | Chi: ${(expense / 1_000_000).toFixed(1)}tr | Tiết kiệm: ${(saving / 1_000_000).toFixed(1)}tr. Top chi tiêu: ${topCats || 'chưa có'}.`;
  } catch(e) {
    return '(Không có dữ liệu tài chính)';
  }
}

export async function parseNaturalLanguage(
  input: string,
  chatHistory: ChatTurn[] = []
): Promise<AIParseResult> {
  const [financialContext, profileRes] = await Promise.all([
    getUserFinancialContext(),
    fetchAPI('/users/me').catch(() => ({ data: {} }))
  ]);

  const apiKey = profileRes.gemini_api_key || profileRes.data?.gemini_api_key || "";
  if (!apiKey) {
    return { type: 'unknown', message: "Vui lòng cấu hình Gemini API Key trong phần Cài đặt trước khi sử dụng tính năng này nhé! 🔑" };
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const recentHistory = chatHistory.slice(-6);
  const historyStr = recentHistory.length > 0
    ? '\n\nLỊCH SỬ HỘI THOẠI GẦN ĐÂY:\n' + recentHistory.map(t => `[${t.role === 'user' ? 'User' : 'Bot'}]: ${t.content}`).join('\n')
    : '';

  const prompt = `Bạn là "Robot Savora" – trợ lý AI thân thiện, vui tính trong ứng dụng quản lý tài chính & kế hoạch Savora.

PHONG CÁCH TRẢ LỜI:
- Nói tiếng Việt tự nhiên, thân thiện, hơi dí dỏm nhưng chuyên nghiệp.
- Dùng emoji phù hợp (1-2 emoji mỗi câu trả lời).
- Câu ngắn gọn, dễ hiểu. Câu chat thì tối đa 3-4 câu.
- Luôn nhớ lịch sử hội thoại để trả lời mạch lạc, không lặp lại thông tin đã nói.

DỮ LIỆU TÀI CHÍNH THỰC CỦA NGƯỜI DÙNG (dùng để tư vấn cá nhân hóa):
${financialContext}


CÁCH PHÂN TÍCH:
Người dùng có thể nhập 3 loại yêu cầu:

1. **Nhiều giao dịch** (VD: "Sáng cà phê 25k, trưa cơm 45k")
2. **Giao dịch đơn lẻ** (VD: "Ăn sáng 30k", "Nhận lương 10 triệu")
3. **Câu hỏi / Trò chuyện / Tư vấn** — Bao gồm:
   - Hỏi về tình hình tài chính ("Tháng này tôi chi nhiều chưa?", "Tôi đang tiết kiệm được nhiều không?")
   - Xin lời khuyên ("Tôi nên cắt giảm chỗ nào?", "Mẹo tiết kiệm")
   - Tâm sự, cãi nhau, stress ("Tôi vừa cãi nhau với bạn gái vì tiền", "Tôi đang stress quá")
   - Câu chào hỏi, nói chuyện bình thường
   → Dùng type "chat", trả lời dựa trên lịch sử hội thoại + dữ liệu tài chính thực nếu liên quan.

QUY TẮC:
- Khi user hỏi về tình hình chi tiêu → dùng dữ liệu tài chính thực ở trên để trả lời cụ thể.
- Nếu user tâm sự/stress về tiền → đồng cảm trước, sau đó có thể gợi ý nhẹ nhàng dựa trên data thực.
- Khi nhập số giao dịch: 25k → 25000, 1.5tr → 1500000.
- Nếu chứa ≥2 giao dịch riêng biệt → "batch_transaction".
- Nếu người dùng KHÔNG NHẮC ĐẾN NGÀY THÁNG CỦA GIAO DỊCH, BẮT BUỘC sử dụng ngày hôm nay là: ${getVNDate().substring(0, 10)}.

DANH MỤC TÀI CHÍNH:
- Chi tiêu (expense): 'Ăn uống', 'Di chuyển', 'Nhà cửa & Hóa đơn', 'Mua sắm', 'Sức khỏe', 'Giải trí & Quan hệ', 'Học tập & Phát triển', 'Chi tiêu khác'
- Thu nhập (income): 'Lương & Thưởng', 'Làm thêm (Freelance)', 'Quà tặng & Thu nhập khác', 'Lãi & Cổ tức'
- Tiết kiệm (saving): 'Quỹ dự phòng', 'Tích lũy dài hạn', 'Đầu tư', 'Bỏ heo/Tiết kiệm tự do'

ĐẶC BIỆT VỚI NỢ/CHO VAY:
Nếu người dùng ghi "cho vay", "cho mượn", "đi vay", "mượn tiền": Trả về JSON loại "debt".
- "debtType": "lent" (nếu là cho vay/cho mượn) hoặc "borrowed" (nếu là đi vay/mượn).
- "contact_name": Tên người vay/mượn (nếu có, không có thì ghi "Người quen").

ĐỊNH DẠNG TRẢ VỀ (CHỈ JSON THUẦN, KHÔNG backticks):

Nếu là NỢ/CHO VAY:
{"type":"debt","message":"...","data":{"title":"...","amount":number,"debtType":"lent"|"borrowed","contact_name":"...","date":"YYYY-MM-DD"}}

Nếu là NHIỀU giao dịch:
{"type":"batch_transaction","message":"...","data":[{"title":"...","amount":number,"category":"...","transactionType":"expense"|"income"|"saving","date":"YYYY-MM-DD"}]}

Nếu là 1 giao dịch:
{"type":"transaction","message":"...","data":{"title":"...","amount":number,"category":"...","transactionType":"expense"|"income"|"saving","date":"YYYY-MM-DD"}}

Nếu là câu hỏi / trò chuyện / tư vấn / tâm sự:
{"type":"chat","message":"Câu trả lời mạch lạc, cá nhân hóa dựa trên dữ liệu thực + lịch sử hội thoại"}

Nếu không hiểu:
{"type":"unknown","message":"Xin lỗi, mình chưa hiểu ý bạn lắm 😅"}

Câu nói hiện tại của người dùng: "${input}"`;

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Không tìm thấy JSON");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("AI Parse Error:", error);
    return { type: 'unknown', message: "Xin lỗi, mình đang gặp trục trặc kỹ thuật. Bạn thử lại sau nhé! 🔧" };
  }
}

export async function executeAIAction(parseResult: AIParseResult) {
  try {
    if (parseResult.type === 'transaction') {
      await fetchAPI('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          title: parseResult.data.title,
          amount: parseResult.data.amount,
          category: parseResult.data.category,
          type: parseResult.data.transactionType.toLowerCase(),
          date: parseResult.data.date ? new Date(parseResult.data.date).toISOString() : new Date().toISOString()
        })
      });
      revalidatePath('/finance');

    } else if (parseResult.type === 'batch_transaction') {
      for (const t of parseResult.data) {
        await fetchAPI('/transactions', {
          method: 'POST',
          body: JSON.stringify({
            title: t.title,
            amount: t.amount,
            category: t.category,
            type: t.transactionType.toLowerCase(),
            date: t.date ? new Date(t.date).toISOString() : new Date().toISOString()
          })
        });
      }
      revalidatePath('/finance');

    } else if (parseResult.type === 'debt') {
      const d = parseResult.data;
      const res = await fetchAPI('/debts', {
        method: 'POST',
        body: JSON.stringify({
          type: d.debtType,
          contactName: d.contact_name || 'Người quen',
          amount: d.amount,
          date: d.date ? new Date(d.date).toISOString() : new Date().toISOString()
        })
      });

      const txType = d.debtType === 'lent' ? 'expense' : 'income';
      const txCategory = d.debtType === 'lent' ? 'Cho vay' : 'Đi vay';
      const txTitle = d.title || `${txCategory} - ${d.contact_name || 'Người quen'}`;

      await fetchAPI('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          title: txTitle,
          amount: d.amount,
          category: txCategory,
          type: txType,
          date: d.date ? new Date(d.date).toISOString() : new Date().toISOString(),
          debtId: res.data.id
        })
      });

      revalidatePath('/finance/debts');
      revalidatePath('/finance');

    }

    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error("AI Execute error:", e);
    throw new Error(e.message || "Lưu dữ liệu thất bại");
  }
}

