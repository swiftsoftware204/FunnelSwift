'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  Layout, 
  Globe, 
  Settings, 
  Shield,
  DollarSign,
  Users,
  Footer,
  Users2
} from 'lucide-react';

const settingsNav = [
  {
    title: 'Legal Pages',
    href: '/admin/settings/legal',
    icon: FileText,
    description: 'Terms, Privacy, Disclaimers'
  },
  {
    title: 'Footer',
    href: '/admin/settings/footer',
    icon: Footer,
    description: 'Footer links & columns'
  },
  {
    title: 'SEO / Meta',
    href: '/admin/settings/seo',
    icon: Globe,
    description: 'Site title, description, keywords'
  },
  {
    title: 'Branding',
    href: '/admin/settings/branding',
    icon: Settings,
    description: 'Logo, colors, favicon'
  },
  {
    title: 'System',
    href: '/admin/settings/system',
    icon: Shield,
    description: 'Domains, API keys, webhooks'
  },
  {
    title: 'Affiliate',
    href: '/admin/settings/affiliate',
    icon: DollarSign,
    description: 'Commissions, tiers, payouts'
  },
  {
    title: 'Plans & Pricing',
    href: '/admin/settings/plans',
    icon: Users,
    description: 'Subscription plans, limits'
  },
  {
    title: 'Team',
    href: '/admin/settings/team',
    icon: Users2,
    description: 'Team members, roles, permissions'
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-[#16181D] border-r border-[#2A2D38] overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-bold text-[#F1F5F9] mb-1">Settings</h2>
          <p className="text-xs text-[#64748B]">Manage your platform</p>
        </div>
        
        <nav className="px-2 pb-4 space-y-1">
          {settingsNav.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${isActive 
                    ? 'bg-[#5B4FFF]/10 text-[#5B4FFF] border border-[#5B4FFF]/20' 
                    : 'text-[#94A3B8] hover:bg-[#2A2D38] hover:text-[#F1F5F9]'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-[#64748B] truncate">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#0E0F12]">
        <div className="p-6 max-w-5xl">
          {children}
        </div>
      </div>
    </div>
  );
}
