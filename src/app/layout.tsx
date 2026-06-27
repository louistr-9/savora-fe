import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { DialogProvider } from '@/components/ui/DialogProvider';

const inter = Inter({ subsets: ["latin"], variable: '--font-sans', display: 'swap', preload: true });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-heading', display: 'swap', preload: true });

export const metadata: Metadata = {
  title: "Savora — Smart Finance & Life Planning",
  description: "Savora giúp bạn quản lý tài chính thông minh và lên kế hoạch cuộc sống phù hợp ngân sách của bạn.",
  icons: {
    icon: '/logo-savora.png',
    apple: '/logo-savora.png',
  }
};

import { getCachedUser } from '@/lib/auth';
import { SessionPing } from '@/components/SessionPing';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCachedUser();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          id="theme-script"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{const s=localStorage.getItem('theme');const t=s?JSON.parse(s):'light';if(t==='dark'||t==='warm')document.documentElement.classList.add(t);}catch(e){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} antialiased bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}>
        <DialogProvider>
          {children}
          {user && <SessionPing />}
        </DialogProvider>
      </body>
    </html>
  );
}

