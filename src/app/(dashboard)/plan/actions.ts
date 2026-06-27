'use server';

import { fetchAPI } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type PlanType = 'travel' | 'dining' | 'purchase' | 'other';
export type PlanStatus = 'active' | 'completed' | 'cancelled';

export interface Plan {
  id: string;
  title: string;
  type: PlanType;
  budget: number;
  current_saved: number;
  deadline: string | null;
  status: PlanStatus;
  asset_id: string | null;
  ai_suggestions: any;
  ai_generated_at: string | null;
  metadata: any;
  notes: string | null;
  created_at: string;
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const res = await fetchAPI('/plans');
    const data = res.data || res;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createPlan(data: Partial<Plan>): Promise<Plan> {
  const res = await fetchAPI('/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  revalidatePath('/plan');
  return res.data || res;
}

export async function updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
  const res = await fetchAPI(`/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  revalidatePath('/plan');
  return res.data || res;
}

export async function deletePlan(id: string): Promise<void> {
  await fetchAPI(`/plans/${id}`, { method: 'DELETE' });
  revalidatePath('/plan');
}

export async function generateAISuggestions(
  planId: string,
  planType: PlanType,
  budget: number,
  metadata: any,
  userBalance: number,
  avgMonthlyExpense: number
): Promise<any> {
  // Get user's gemini api key
  const profileRes = await fetchAPI('/users/me').catch(() => ({}));
  const apiKey = profileRes.gemini_api_key || profileRes.data?.gemini_api_key || '';

  if (!apiKey) {
    return { error: 'no_api_key' };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  let prompt = '';
  if (planType === 'travel') {
    const { days = 3, people = 2, destination = 'địa điểm bí mật' } = metadata;
    prompt = `Bạn là chuyên gia du lịch Việt Nam. Người dùng đang chuẩn bị đi du lịch tại ${destination} trong ${days} ngày, số người: ${people}.
Ngân sách cho chuyến đi: ${(budget / 1_000_000).toFixed(1)} triệu đồng.

Yêu cầu: Hãy gợi ý 3 phương án lịch trình tham quan/ăn uống khác nhau tại khu vực ${destination} sao cho phù hợp với ngân sách. Mỗi lịch trình hãy đề xuất 1 lộ trình đi qua 2-4 điểm (tham quan, quán ăn) hợp lý, nối tiếp nhau.
Ước lượng tổng quãng đường di chuyển (km) và tính tiền xăng (giả định xe máy 500đ/km) cho từng lộ trình.

Trả về JSON thuần (không markdown, không backtick):
{"suggestions":[{"name":"Tên phương án (VD: Lịch trình sống ảo)","emoji":"📸","location":"${destination}","estimated_cost":số_tiền,"cost_breakdown":{"hotel":"Mô tả + giá ước tính","food":"Mô tả + giá","transport":"Mô tả + giá"},"highlights":["điểm 1","điểm 2","điểm 3"],"route":{"waypoints":[{"name":"Tên điểm 1","address":"Địa chỉ chi tiết, ${destination}","lat":15.0,"lng":108.0}],"distance_km":15,"estimated_gas_cost":7500},"best_time":"Thời điểm lý tưởng","vibe":"Cảm giác/không khí","match_score":85}]}`;
  } else if (planType === 'dining') {
    const { people = 2, destination = 'quán quen' } = metadata;
    prompt = `Bạn là chuyên gia ẩm thực Việt Nam. Người dùng đang muốn đi ăn/uống tại khu vực ${destination} với số người: ${people}.
Ngân sách: ${(budget / 1_000).toFixed(0)}k đồng/người.

Yêu cầu: Gợi ý 3 lịch trình (Food tour) thực tế tại ${destination}. Mỗi lịch trình gồm 2-3 quán ăn/uống cụ thể nối tiếp nhau (VD: Ăn chính -> Tráng miệng/Cafe -> Đi dạo).
Ước lượng tổng quãng đường di chuyển (km) và tính tiền xăng (giả định 500đ/km).

Trả về JSON thuần (không markdown, không backtick):
{"suggestions":[{"name":"Tên Food Tour (VD: Combo nhậu sương sương)","emoji":"🍜","type":"Loại hình","price_range":"X-Y nghìn/người","vibe":"Không khí, mô tả","must_try":["Món/đồ uống gợi ý 1","gợi ý 2"],"route":{"waypoints":[{"name":"Tên quán 1","address":"Đường, Phường, ${destination}","lat":10.7,"lng":106.7}],"distance_km":5,"estimated_gas_cost":2500},"tips":"Mẹo đi lại","match_score":90}]}`;
  }

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Attempt to parse JSON
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) {
      return { error: 'invalid_response', message: 'Không thể phân tích phản hồi từ AI' };
    }
    const parsed = JSON.parse(match[0]);
    
    // Save to DB
    await fetchAPI(`/plans/${planId}/ai-suggestions`, {
      method: 'POST',
      body: JSON.stringify({ suggestions: parsed }),
    });

    // Background scrape locations
    try {
      const placesToSave: any[] = [];
      if (parsed?.suggestions && Array.isArray(parsed.suggestions)) {
        parsed.suggestions.forEach((sugg: any) => {
          if (sugg.route?.waypoints && Array.isArray(sugg.route.waypoints)) {
            sugg.route.waypoints.forEach((wp: any) => {
              if (wp.name && wp.address && wp.lat && wp.lng) {
                placesToSave.push({
                  name: wp.name,
                  address: wp.address,
                  lat: wp.lat,
                  lng: wp.lng
                });
              }
            });
          }
        });
      }
      if (placesToSave.length > 0) {
        // Run in background without awaiting
        fetchAPI('/places/bulk', {
          method: 'POST',
          body: JSON.stringify({ places: placesToSave }),
        }).catch(err => console.error('Lỗi khi cào dữ liệu AI:', err));
      }
    } catch (e) {
      console.error('Lỗi khi trích xuất dữ liệu AI:', e);
    }

    revalidatePath('/plan');
    return { success: true, suggestions: parsed };
  } catch (error: any) {
    console.error('Lỗi Gemini:', error);
    return { error: 'gemini_error', message: error.message };
  }
}

// Get user financial context for smart budget recommendation
export async function getUserFinancialContext() {
  try {
    const [profileRes, transRes, assetsRes] = await Promise.all([
      fetchAPI('/users/me').catch(() => ({})),
      fetchAPI('/transactions?limit=100').catch(() => ({ data: [] })),
      fetchAPI('/assets').catch(() => ({ data: [] })),
    ]);

    const balance = Number(profileRes.initial_balance || profileRes.data?.initial_balance || 0);
    const txs = transRes.data || [];

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const monthTxs = txs.filter((t: any) => new Date(t.date).getTime() >= startOfMonth);

    const income = monthTxs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0);
    const expense = monthTxs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);
    const netBalance = balance + income - expense;
    const availableBudget = Math.max(netBalance * 0.3, 0); // Recommend max 30% of net balance for plans

    const allAssets = assetsRes.data || [];
    const liquidAssets = allAssets.filter((a: any) => a.type === 'saving');

    return { netBalance, avgMonthlyExpense: expense, availableBudget, income, assets: liquidAssets };
  } catch {
    return { netBalance: 0, avgMonthlyExpense: 0, availableBudget: 0, income: 0, assets: [] };
  }
}

export type PlanAIChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type PlanAIResponse = {
  text: string;
  suggestedLocations?: {
    name: string;
    address: string;
    cost: number;
    duration: string;
    reason: string;
  }[];
};

export async function chatWithPlanAI(
  planId: string,
  destination: string,
  days: number,
  budget: number,
  chatHistory: PlanAIChatTurn[],
  userInput: string
): Promise<{ success: boolean; response?: PlanAIResponse; error?: string }> {
  try {
    const profileRes = await fetchAPI('/users/me').catch(() => ({}));
    const apiKey = profileRes.gemini_api_key || profileRes.data?.gemini_api_key || '';

    if (!apiKey) {
      return { success: false, error: 'no_api_key' };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const recentHistory = chatHistory.slice(-5).map(t => `[${t.role === 'user' ? 'Khách' : 'Trợ lý AI'}]: ${t.content}`).join('\n');

    const prompt = `Bạn là Trợ lý AI chuyên nghiệp giúp người dùng lên kế hoạch cho chuyến đi.
Thông tin chuyến đi:
- Điểm đến: ${destination}
- Số ngày: ${days} ngày
- Ngân sách: ${budget.toLocaleString('vi-VN')} VNĐ

Lịch sử chat gần đây:
${recentHistory}

Lưu ý:
- Trả lời thân thiện, ngắn gọn, dùng tiếng Việt.
- Nếu người dùng yêu cầu gợi ý địa điểm (nhà hàng, khách sạn, điểm tham quan, v.v.), hãy phân tích và trả về cấu trúc JSON chính xác.

BẠN BẮT BUỘC PHẢI TRẢ VỀ DƯỚI DẠNG JSON THEO ĐÚNG CẤU TRÚC SAU:
{
  "text": "Câu trả lời thân thiện của bạn ở đây...",
  "suggestedLocations": [ // mảng các địa điểm gợi ý (nếu có, không có thì để rỗng [])
    {
      "name": "Tên địa điểm",
      "address": "Địa chỉ hoặc khu vực",
      "cost": 150000, // Chi phí ước tính (bằng số)
      "duration": "09:00 - 11:00", // Khung giờ gợi ý
      "reason": "Lý do gợi ý ngắn gọn"
    }
  ]
}

KHÔNG ĐƯỢC bọc JSON trong \`\`\`json \`\`\`. CHỈ trả về đoạn text JSON hợp lệ.

Câu hỏi/yêu cầu hiện tại của người dùng: "${userInput}"`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Add debug log to investigate
    require('fs').appendFileSync('debug_ai_chat.log', `\n--- DEBUG ---\n${text}\n-----------------\n`);

    // Attempt to parse JSON using regex to extract the JSON block
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return { success: false, error: 'Không thể phân tích phản hồi từ AI' };
    }
    
    const parsed: PlanAIResponse = JSON.parse(match[0]);
    return { success: true, response: parsed };
  } catch (error: any) {
    console.error('Lỗi chatWithPlanAI:', error);
    require('fs').appendFileSync('debug_ai_chat.log', `\n--- ERROR ---\n${error.stack || error.message || error}\n-----------------\n`);
    return { success: false, error: error.message };
  }
}

