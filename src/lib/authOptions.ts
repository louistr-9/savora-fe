import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập email và mật khẩu');
        }

        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.message || "Đăng nhập thất bại");
          }

          const { token, user } = data.data;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            accessToken: token, 
          };
        } catch (error: any) {
          throw new Error(error.message || 'Lỗi kết nối đến máy chủ');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatarUrl: user.image || ""
            })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            (account as any).backendUserId = data.data.user.id;
            (account as any).backendToken = data.data.token;
            return true;
          }
          console.error("Backend Google Login Failed:", data);
          return '/login?message=' + encodeURIComponent('Lỗi từ máy chủ Backend (Cấu hình sai NEXT_PUBLIC_API_URL)');
        } catch(e) {
          console.error("Google login API error:", e);
          return '/login?message=' + encodeURIComponent('Không thể kết nối đến Backend. Kiểm tra NEXT_PUBLIC_API_URL');
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        if (account.provider === 'google') {
          // Lấy token đã lưu từ signIn callback
          token.id = (account as any).backendUserId;
          token.accessToken = (account as any).backendToken;
        } else if (account.provider === 'credentials') {
          token.id = user.id;
          token.accessToken = (user as any).accessToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

