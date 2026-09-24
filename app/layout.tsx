import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Budget - Kelola Keuangan Pribadi',
  description: 'Aplikasi budgeting pribadi untuk mengelola keuangan Anda',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <main className="flex-1 md:ml-64 pb-20 md:pb-0">
            <div className="max-w-screen-xl mx-auto p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileNav />
        
        <Toaster />
      </body>
    </html>
  );
}
