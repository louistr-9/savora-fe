import { getCachedUser } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  console.log(`[MOCK API] Bypassing ${options.method || 'GET'} ${endpoint}`);







  // Các endpoint đã được làm thật ở Backend
  if (
    endpoint.includes("/transactions") || 
    endpoint.includes("/assets") || 
    endpoint.includes("/debts") ||
    endpoint.includes("/recurrings") ||
    endpoint.includes("/users") ||
    endpoint.includes("/auth") ||
    endpoint.includes("/reports") ||
    endpoint.includes("/plans")
  ) {
    console.log(`[REAL API] Calling ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
    
    // Gắn Token vào Request
    const user = await getCachedUser();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    
    if (user && (user as any).accessToken) {
      headers["Authorization"] = `Bearer ${(user as any).accessToken}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store'
    });
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        if (!options.method || options.method === 'GET') {
          return { data: [], success: false, message: "Unauthorized" };
        } else {
          throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');
        }
      }
      const err = await res.text();
      throw new Error(err);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  // Mặc định trả về success cho các hàm POST/PUT/DELETE bị mock
  return { success: true, message: "Mocked action successful" };
}

export async function searchPlaces(query: string) {
  try {
    return await fetchAPI(`/places/search?q=${encodeURIComponent(query)}`);
  } catch (error) {
    console.error("Failed to search places:", error);
    return [];
  }
}

