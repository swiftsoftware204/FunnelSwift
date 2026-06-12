'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  Shield,
  DollarSign,
  Tag,
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
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAdmin();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('is_superadmin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          setIsAdmin(false);
          return;
        }
        
        setIsAdmin(profile?.is_superadmin === true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin:', error);
      setIsAdmin(false);
    }
  }

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
              <h1 className="text-lg font-semibold text-[#F1F5F9]">FunnelSwift</h1>
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

            {/* Admin Section - Only for superadmins */}
            {isAdmin && (
              <>
                <div className="pt-4 mt-4 border-t border-[#2A2D38]">
                  <p className="px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                    Super Admin
                  </p>
                  <Link
                    href="/admin"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      pathname === '/admin' || pathname.startsWith('/admin/')
                        ? 'bg-[#5B4FFF]/10 text-[#5B4FFF] border-l-2 border-[#5B4FFF]'
                        : 'text-[#94A3B8] hover:bg-[#2A2D38] hover:text-[#F1F5F9]'
                    )}
                  >
                    <Shield className="h-5 w-5" />
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/admin/tenants"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1',
                      pathname === '/admin/tenants'
                        ? 'bg-[#5B4FFF]/10 text-[#5B4FFF] border-l-2 border-[#5B4FFF]'
                        : 'text-[#94A3B8] hover:bg-[#2A2D38] hover:text-[#F1F5F9]'
                    )}
                  >
                    <Users className="h-5 w-5" />
                    Tenants
                  </Link>
                  <Link
                    href="/admin/affiliates"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1',
                      pathname === '/admin/affiliates'
                        ? 'bg-[#5B4FFF]/10 text-[#5B4FFF] border-l-2 border-[#5B4FFF]'
                        : 'text-[#94A3B8] hover:bg-[#2A2D38] hover:text-[#F1F5F9]'
                    )}
                  >
                    <DollarSign className="h-5 w-5" />
                    Affiliates
                  </Link>
                  <Link
                    href="/admin/tags"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1',
                      pathname === '/admin/tags'
                        ? 'bg-[#5B4FFF]/10 text-[#5B4FFF] border-l-2 border-[#5B4FFF]'
                        : 'text-[#94A3B8] hover:bg-[#2A2D38] hover:text-[#F1F5F9]'
                    )}
                  >
                    <Tag className="h-5 w-5" />
                    System Tags
                  </Link>
                </div>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#2A2D38]">
            <p className="text-xs text-[#64748B] text-center">
              © 2026 FunnelSwift
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
