import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { Toaster } from '@/components/ui/toaster';
import { getSession } from '@/lib/auth';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { InstallPWA } from '@/components/InstallPWA';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Budget - Kelola Keuangan Pribadi',
  description: 'Aplikasi budgeting pribadi untuk mengelola keuangan Anda dengan mudah',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'My Budget',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await getSession();
  } catch {
    // No session
  }

  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen text-gray-900 antialiased`}>
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          {session && (
            <Sidebar userName={session.name} userRole={session.role} />
          )}

          {/* Main Content */}
          <main className={`flex-1 ${session ? 'md:ml-64' : ''} pb-20 md:pb-0`}>
            <div className="max-w-screen-xl mx-auto p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        {session && <MobileNav />}

        {/* PWA Components */}
        <InstallPWA />
        <ServiceWorkerRegistrar />
        <Toaster />
      </body>
    </html>
  );
}
