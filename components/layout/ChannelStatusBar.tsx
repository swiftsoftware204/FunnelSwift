'use client';

import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import { FormInput, MessageSquare, Eye, Bot, Phone, QrCode } from 'lucide-react';

const channels = [
  { id: 'form' as const, name: 'Web Forms', icon: FormInput },
  { id: 'sms' as const, name: 'SMS', icon: MessageSquare },
  { id: 'demo_ada' as const, name: 'ADA Demo', icon: Eye },
  { id: 'demo_ai' as const, name: 'AI Agent', icon: Bot },
  { id: 'demo_missed_call' as const, name: 'Missed Call', icon: Phone },
  { id: 'qr' as const, name: 'QR Codes', icon: QrCode },
];

export function ChannelStatusBar() {
  const { channelStatus } = useUIStore();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E0F12] border border-[#2A2D38]">
      {channels.map((channel) => {
        const isActive = channelStatus[channel.id];
        return (
          <div
            key={channel.id}
            className="relative group flex items-center"
          >
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                isActive
                  ? 'text-[#F1F5F9]'
                  : 'text-[#64748B]'
              )}
            >
              <channel.icon className="h-3.5 w-3.5" />
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  isActive ? 'bg-[#22C55E]' : 'bg-[#64748B]'
                )}
              />
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
              <div className="px-2 py-1 rounded bg-[#2A2D38] text-xs text-[#F1F5F9] whitespace-nowrap">
                {channel.name}: {isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
