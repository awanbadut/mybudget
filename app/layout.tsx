import type { Metadata, Viewport } from 'next';
import { Spline_Sans_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { Toaster } from '@/components/ui/toaster';
import { getSession } from '@/lib/auth';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { InstallPWA } from '@/components/InstallPWA';
import { MobileTopHeader } from '@/components/MobileTopHeader';

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
  title: 'My Budget — Kelola Keuangan Pribadi',
  description: 'Aplikasi pencatatan keuangan pribadi yang simpel, elegan, dan terstruktur',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
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
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F8F8' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0F0F' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await getSession();
  } catch {
    // No session
  }

  return (
    <html lang="id" className="w-full max-w-full overflow-x-hidden" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                const p = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (t === 'dark' || (!t && p)) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`
          ${fontSans.variable} ${fontMono.variable} font-sans
          bg-[#F8F8F8] dark:bg-[#0F0F0F]
          text-zinc-900 dark:text-zinc-50
          min-h-[100dvh] antialiased
          selection:bg-zinc-900 selection:text-white
          dark:selection:bg-zinc-100 dark:selection:text-zinc-900
          w-full max-w-full overflow-x-hidden
          transition-colors duration-200
        `}
      >
        <div className="flex min-h-[100dvh] w-full max-w-full overflow-x-hidden">
          {/* Desktop Sidebar */}
          {session && (
            <Sidebar userName={session.name} userRole={session.role} />
          )}

          {/* Main Content */}
          <main
            className={`
              flex-1 min-w-0 w-full max-w-full overflow-x-hidden
              ${session ? 'md:ml-64' : ''}
              pb-28 md:pb-12
            `}
          >
            {session && <MobileTopHeader />}
            <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 py-4 md:py-10 min-w-0">
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
