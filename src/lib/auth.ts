import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import { cache } from 'react';

export const getCachedUser = cache(async () => {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return session.user; // Trả về NextAuth User ({ id, email, name, accessToken })
    }
  } catch (error) {
    console.error("Lỗi lấy Session:", error);
  }
  
  return null; // Guest mode
});

