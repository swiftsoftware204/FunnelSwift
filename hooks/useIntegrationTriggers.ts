'use client';

import { useEffect } from 'react';
import { eventBus, registerDefaultWorkflows } from '@/lib/integrations/event-bus';
import { createClient } from '@/lib/supabase/client';

// Initialize integration system
export function useIntegrationTriggers() {
  const supabase = createClient();

  useEffect(() => {
    // Register default workflows on mount
    registerDefaultWorkflows();

    // Subscribe to contact changes for tag-based triggers
    const subscription = supabase
      .channel('contacts_tags')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contacts',
        },
        async (payload) => {
          const oldTags = payload.old.tags || [];
          const newTags = payload.new.tags || [];

          // Find newly added tags
          const addedTags = newTags.filter((tag: string) => !oldTags.includes(tag));

          if (addedTags.length > 0) {
            // Publish tag assigned event
            await eventBus.publish({
              source: 'funnelswift',
              event_type: 'tag.assigned',
              payload: {
                contact_id: payload.new.id,
                email: payload.new.email,
                phone: payload.new.phone,
                tags: addedTags,
                all_tags: newTags,
              },
              target_products: ['adaswift', 'missedcall', 'workflowswift'],
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to manually trigger an event
  const triggerEvent = async (
    eventType: string,
    payload: any,
    targetProducts?: string[]
  ) => {
    await eventBus.publish({
      source: 'funnelswift',
      event_type: eventType,
      payload,
      target_products: targetProducts || ['adaswift', 'missedcall', 'workflowswift'],
    });
  };

  // Function to assign tag and trigger workflow
  const assignTagAndTrigger = async (contactId: string, tag: string) => {
    // Get current contact
    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', contactId)
      .single();

    if (!contact) return;

    // Add new tag
    const newTags = [...new Set([...(contact.tags || []), tag])];

    // Update contact
    const { error } = await supabase
      .from('contacts')
      .update({ tags: newTags })
      .eq('id', contactId);

    if (error) {
      console.error('Failed to assign tag:', error);
      return;
    }

    // Event will be triggered automatically by the subscription
    console.log(`Tag "${tag}" assigned to contact ${contactId}`);
  };

  return {
    triggerEvent,
    assignTagAndTrigger,
  };
}

// Hook to listen for integration events
export function useIntegrationListener(
  source: string,
  eventType: string,
  callback: (event: any) => void
) {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(source, eventType, callback);
    return unsubscribe;
  }, [source, eventType, callback]);
}
