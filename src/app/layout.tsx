import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { DialogProvider } from '@/components/ui/DialogProvider';
import { getCachedUser } from '@/lib/auth';
import { SessionPing } from '@/components/SessionPing';
import InstallPWA from '@/components/InstallPWA';
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"], variable: '--font-sans', display: 'swap', preload: true });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-heading', display: 'swap', preload: true });

export const metadata: Metadata = {
  title: "Savora - Smart Finance & Life Planning",
  description: "Savora giúp bạn quản lý tài chính thông minh và lên kế hoạch cuộc sống phù hợp ngân sách của bạn.",
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-savora.png',
    apple: '/logo-savora.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCachedUser();

  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} antialiased bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try{const s=localStorage.getItem('theme');const t=s?JSON.parse(s):'light';if(t==='dark'||t==='warm')document.documentElement.classList.add(t);}catch(e){}
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
        <DialogProvider>
          {children}
          {user && <SessionPing />}
        </DialogProvider>
        <InstallPWA />
      </body>
    </html>
  );
}
