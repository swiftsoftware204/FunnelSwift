'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { LiveFeed } from '@/components/layout/LiveFeed';
import { useUIStore } from '@/stores/ui.store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex bg-[#0E0F12] text-[#F1F5F9] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
          <aside className="hidden xl:block w-80 border-l border-[#2A2D38] bg-[#16181D]">
            <LiveFeed />
          </aside>
        </div>
      </div>
    </div>
  );
}
