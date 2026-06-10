'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import {
  LayoutDashboard,
  Users,
  Kanban,
  PlusCircle,
  MessageSquare,
  Zap,
  Key,
  Webhook,
  Settings,
  Menu,
  X,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban },
  { name: 'Capture', href: '/capture', icon: PlusCircle },
  { name: 'SMS Log', href: '/capture/sms', icon: MessageSquare },
  { name: 'Demo Triggers', href: '/demos', icon: Zap },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-[#16181D] border-r border-[#2A2D38] transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-[#2A2D38]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B4FFF] to-[#8B5CF6] flex items-center justify-center">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#F1F5F9]">SwiftImpact</h1>
              <p className="text-xs text-[#64748B]">Lead Capture</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-[#5B4FFF]/10 text-[#5B4FFF] border-l-2 border-[#5B4FFF]'
                      : 'text-[#94A3B8] hover:bg-[#2A2D38] hover:text-[#F1F5F9]'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-[#2A2D38]">
            <div className="px-3 py-2 rounded-lg bg-[#0E0F12]">
              <p className="text-xs text-[#64748B]">API Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-[#22C55E]">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
