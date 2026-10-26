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
import { BalanceVisibilityProvider } from '@/context/BalanceVisibilityContext';
import { NavigationProgress } from '@/components/NavigationProgress';
import { AdminImpersonationBanner } from '@/components/AdminImpersonationBanner';
import { BroadcastBanner } from '@/components/BroadcastBanner';
import { getActiveBroadcasts, getMaintenanceStatus } from '@/actions/admin';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';
import { MaintenanceBanner } from '@/components/MaintenanceBanner';
import { SidebarProvider } from '@/components/SidebarProvider';
import { AppMainContent } from '@/components/AppMainContent';
import { Suspense } from 'react';

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
  let broadcastMessages: string[] = [];
  let maintenance = {
    isActive: false,
    title: 'Sistem Sedang Dalam Pemeliharaan',
    message: 'Kami sedang melakukan peningkatan performa dan pembaruan sistem. Mohon tunggu beberapa saat.',
    estimatedEndTime: '',
  };

  try {
    const [s, b, m] = await Promise.all([
      getSession(),
      getActiveBroadcasts(),
      getMaintenanceStatus(),
    ]);
    session = s;
    broadcastMessages = b;
    maintenance = m;
  } catch {
    // Fallback
  }

  const isAdmin = session?.role === 'admin' || Boolean(session?.impersonatorAdminId);

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
        {maintenance.isActive && !isAdmin ? (
          <MaintenanceScreen
            title={maintenance.title}
            message={maintenance.message}
            estimatedEndTime={maintenance.estimatedEndTime}
          />
        ) : (
          <BalanceVisibilityProvider>
            <SidebarProvider>
              {maintenance.isActive && isAdmin && (
                <MaintenanceBanner
                  title={maintenance.title}
                  estimatedEndTime={maintenance.estimatedEndTime}
                />
              )}
              {session?.impersonatorAdminId && (
                <AdminImpersonationBanner
                  userName={session.name}
                  userUsername={session.username}
                  adminName={session.impersonatorAdminName}
                />
              )}
              {broadcastMessages.length > 0 && (
                <BroadcastBanner messages={broadcastMessages} />
              )}
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              <div className="flex min-h-[100dvh] w-full max-w-full overflow-x-hidden">
                {/* Desktop Sidebar */}
                {session && (
                  <Sidebar
                    userName={session.name}
                    userRole={session.role}
                    isImpersonating={Boolean(session.impersonatorAdminId)}
                  />
                )}

                {/* Main Content */}
                <AppMainContent hasSession={Boolean(session)}>
                  {session && <MobileTopHeader />}
                  <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 py-4 md:py-10 min-w-0">
                    {children}
                  </div>
                </AppMainContent>
              </div>

              {/* Mobile Bottom Navigation */}
              {session && (
                <MobileNav
                  userRole={session.role}
                  isImpersonating={Boolean(session.impersonatorAdminId)}
                />
              )}

              {/* PWA Components */}
              <InstallPWA />
              <ServiceWorkerRegistrar />
              <Toaster />
            </SidebarProvider>
          </BalanceVisibilityProvider>
        )}
      </body>
    </html>
  );
}
