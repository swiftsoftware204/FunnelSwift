import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SwiftImpact Lead Capture',
  description: 'Mobile-first Lead Capture BOS for SwiftImpact Solutions',
  openGraph: {
    title: 'SwiftImpact Lead Capture',
    description: 'Mobile-first Lead Capture BOS for SwiftImpact Solutions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwiftImpact Lead Capture',
    description: 'Mobile-first Lead Capture BOS for SwiftImpact Solutions',
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
