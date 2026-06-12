'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { LiveFeed } from '@/components/layout/LiveFeed';
import { Button } from '@/components/ui/button';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [showLiveFeed, setShowLiveFeed] = useState(true);

  return (
    <div className="h-screen flex bg-[#0E0F12] text-[#F1F5F9] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 relative">
            {children}
          </main>
          
          {/* Collapsible Live Feed */}
          <aside 
            className={`hidden xl:block border-l border-[#2A2D38] bg-[#16181D] transition-all duration-300 ${
              showLiveFeed ? 'w-80' : 'w-0 overflow-hidden'
            }`}
          >
            {showLiveFeed && <LiveFeed />}
          </aside>
          
          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLiveFeed(!showLiveFeed)}
            className="absolute right-4 top-20 z-10 bg-[#16181D] border border-[#2A2D38] hover:bg-[#2A2D38]"
          >
            {showLiveFeed ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
