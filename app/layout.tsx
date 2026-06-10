import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FunnelSwift - Lead Management System',
  description: 'Capture, manage, and convert leads with FunnelSwift - the complete lead management platform for businesses',
  openGraph: {
    title: 'FunnelSwift - Lead Management System',
    description: 'Capture, manage, and convert leads with FunnelSwift - the complete lead management platform for businesses',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FunnelSwift - Lead Management System',
    description: 'Capture, manage, and convert leads with FunnelSwift - the complete lead management platform for businesses',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className + ' bg-[#0E0F12] text-[#F1F5F9]'}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
