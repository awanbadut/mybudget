import type { Metadata, Viewport } from 'next';
import { Spline_Sans_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { Toaster } from '@/components/ui/toaster';
import { getSession } from '@/lib/auth';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { InstallPWA } from '@/components/InstallPWA';

const fontMono = Spline_Sans_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'My Budget - Kelola Keuangan Pribadi',
  description: 'Aplikasi pencatatan keuangan pribadi yang simpel, elegan, dan terstruktur',
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
  themeColor: '#FAFAF9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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
    <html lang="id" className="w-full max-w-full overflow-x-hidden">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans bg-[#FAFAF9] text-zinc-900 min-h-screen antialiased selection:bg-zinc-900 selection:text-white w-full max-w-full overflow-x-hidden`}>
        <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
          {/* Desktop Sidebar */}
          {session && (
            <Sidebar userName={session.name} userRole={session.role} />
          )}

          {/* Main Content */}
          <main className={`flex-1 ${session ? 'md:ml-64' : ''} pb-24 md:pb-10 min-w-0 w-full max-w-full overflow-x-hidden`}>
            <div className="w-full max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto px-3.5 sm:px-6 py-3.5 md:py-8 min-w-0">
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
