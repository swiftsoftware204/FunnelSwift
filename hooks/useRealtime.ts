'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLeadsStore } from '@/stores/leads.store';
import { Event } from '@/types';

export function useRealtime() {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { addLead, addEvent, updateLead } = useLeadsStore();

  useEffect(() => {
    const channel = supabase
      .channel('lead-capture-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts',
        },
        (payload) => {
          addLead(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contacts',
        },
        (payload) => {
          updateLead(payload.new.id, payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          addEvent(payload.new as Event);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, addLead, addEvent, updateLead]);
}
