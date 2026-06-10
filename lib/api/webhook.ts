import { createServiceClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';

interface EventData {
  contact_id: string | null;
  event_type: string;
  source_app: string;
  payload: Record<string, unknown>;
}

function generateHmac(secret: string | null, data: object): string {
  if (!secret) return '';
  return createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex');
}

export async function dispatchEvent(event: EventData): Promise<{ id: string; dispatched_to: number }> {
  const supabase = createServiceClient();

  // 1. Insert to events table
  const { data: eventRecord, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single();

  if (error || !eventRecord) {
    throw new Error('Failed to create event');
  }

  // 2. Find matching webhook_configs
  const { data: configs } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('is_active', true);

  const matchingConfigs = (configs || []).filter(cfg =>
    cfg.event_types.includes(event.event_type) || cfg.event_types.includes('*')
  );

  // 3. Dispatch in parallel - fire and forget
  if (matchingConfigs.length > 0) {
    Promise.allSettled(
      matchingConfigs.map(cfg =>
        fetch(cfg.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SI-Signature': generateHmac(cfg.secret, eventRecord),
            'X-SI-Event': event.event_type,
            'X-SI-Source': event.source_app,
          },
          body: JSON.stringify({ event: eventRecord, contact_id: event.contact_id }),
        })
      )
    ).catch(() => {
      // Silently fail - webhooks are async
    });
  }

  return {
    id: eventRecord.id,
    dispatched_to: matchingConfigs.length,
  };
}

export async function notifyHotLead(contact: { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; lead_score: number }): Promise<void> {
  // Fire a special hot_lead_alert event
  await dispatchEvent({
    contact_id: contact.id,
    event_type: 'hot_lead_alert',
    source_app: 'lead_capture',
    payload: {
      contact,
      score: contact.lead_score,
    },
  });
}
