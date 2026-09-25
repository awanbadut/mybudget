import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { Toaster } from '@/components/ui/toaster';
import { getSession } from '@/lib/auth';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { InstallPWA } from '@/components/InstallPWA';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

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
      <body className={`${fontSans.className} bg-[#fcfcfd] min-h-screen text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white`}>
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          {session && (
            <Sidebar userName={session.name} userRole={session.role} />
          )}

          {/* Main Content */}
          <main className={`flex-1 ${session ? 'md:ml-64' : ''} pb-28 md:pb-8`}>
            <div className="max-w-md sm:max-w-2xl md:max-w-screen-xl mx-auto px-3.5 sm:px-6 py-3 md:p-6">
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
