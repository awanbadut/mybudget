import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { Toaster } from '@/components/ui/toaster';
import { getSession } from '@/lib/auth';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Budget - Kelola Keuangan Pribadi',
  description: 'Aplikasi budgeting pribadi untuk mengelola keuangan Anda dengan mudah',
  manifest: '/manifest.json',
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

const inter_font = Inter({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await getSession();
  } catch {
    // No session (e.g. on login page)
  }

  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter_font.className} bg-gray-50 min-h-screen`}>
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

        <ServiceWorkerRegistrar />
        <Toaster />
      </body>
    </html>
  );
}
