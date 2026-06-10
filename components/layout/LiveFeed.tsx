'use client';

import { useLeadsStore } from '@/stores/leads.store';
import { useRealtime } from '@/hooks/useRealtime';
import { formatRelativeTime, getSourceLabel } from '@/lib/utils';
import { getLeadTier, getTierColor } from '@/lib/scoring/lead-score';
import { cn } from '@/lib/utils';
import { Zap, User, MessageSquare, Eye } from 'lucide-react';

interface LiveFeedProps {
  compact?: boolean;
}

export function LiveFeed({ compact = false }: LiveFeedProps) {
  useRealtime();
  const { recentEvents } = useLeadsStore();

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'lead_created':
        return <User className="h-4 w-4 text-[#22C55E]" />;
      case 'sms_received':
        return <MessageSquare className="h-4 w-4 text-[#F59E0B]" />;
      case 'demo_viewed':
        return <Eye className="h-4 w-4 text-[#5B4FFF]" />;
      default:
        return <Zap className="h-4 w-4 text-[#94A3B8]" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2D38]">
        <h2 className="text-sm font-semibold text-[#F1F5F9]">Live Feed</h2>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-xs text-[#64748B]">Real-time</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {recentEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#2A2D38] flex items-center justify-center mb-3">
              <Zap className="h-6 w-6 text-[#64748B]" />
            </div>
            <p className="text-[#64748B] text-sm">Waiting for events...</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {recentEvents.slice(0, compact ? 10 : 50).map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg bg-[#16181D] border border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-colors animate-in slide-in-from-right"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2A2D38] flex items-center justify-center shrink-0">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F1F5F9] capitalize">
                      {event.event_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-[#64748B] truncate">
                      {event.source_app || 'System'}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">
                      {formatRelativeTime(event.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
