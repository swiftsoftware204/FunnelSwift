// SwiftSoftware Event Bus
// Central event system for cross-product communication

import { createClient } from '@/lib/supabase/client';

export interface SwiftEvent {
  id: string;
  timestamp: string;
  source: 'funnelswift' | 'adaswift' | 'missedcall' | 'workflowswift';
  event_type: string;
  payload: {
    contact_id?: string;
    email?: string;
    phone?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  };
  target_products?: string[];
}

export interface WorkflowTrigger {
  id: string;
  name: string;
  source: string;
  event_type: string;
  condition?: (payload: any) => boolean;
  actions: WorkflowAction[];
  is_active: boolean;
}

export interface WorkflowAction {
  type: 'api_call' | 'delay' | 'tag_update' | 'email_send';
  target?: string;
  endpoint?: string;
  payload?: any;
  duration?: string;
}

class EventBus {
  private supabase = createClient();
  private workflows: WorkflowTrigger[] = [];

  // Publish event to bus
  async publish(event: Omit<SwiftEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: SwiftEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Store in database
    await this.supabase.from('integration_events').insert({
      ...fullEvent,
      payload: JSON.stringify(fullEvent.payload),
    });

    // Trigger workflows
    await this.processWorkflows(fullEvent);

    // Send webhooks to target products
    if (fullEvent.target_products) {
      for (const product of fullEvent.target_products) {
        await this.sendWebhook(product, fullEvent);
      }
    }
  }

  // Subscribe to events
  subscribe(
    source: string,
    eventType: string,
    callback: (event: SwiftEvent) => void
  ): () => void {
    const subscription = this.supabase
      .channel('integration_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_events',
          filter: `source=eq.${source}`,
        },
        (payload) => {
          if (payload.new.event_type === eventType) {
            callback(payload.new as SwiftEvent);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // Register workflow trigger
  registerWorkflow(workflow: WorkflowTrigger): void {
    this.workflows.push(workflow);
  }

  // Process workflows for an event
  private async processWorkflows(event: SwiftEvent): Promise<void> {
    for (const workflow of this.workflows) {
      if (!workflow.is_active) continue;
      if (workflow.source !== event.source) continue;
      if (workflow.event_type !== event.event_type) continue;
      if (workflow.condition && !workflow.condition(event.payload)) continue;

      // Execute workflow actions
      await this.executeWorkflow(workflow, event);
    }
  }

  // Execute workflow actions
  private async executeWorkflow(
    workflow: WorkflowTrigger,
    event: SwiftEvent
  ): Promise<void> {
    console.log(`Executing workflow: ${workflow.name}`);

    for (const action of workflow.actions) {
      try {
        switch (action.type) {
          case 'api_call':
            await this.executeApiCall(action, event);
            break;
          case 'delay':
            await this.executeDelay(action.duration);
            break;
          case 'tag_update':
            await this.executeTagUpdate(action.payload, event);
            break;
          case 'email_send':
            await this.executeEmailSend(action.payload, event);
            break;
        }
      } catch (error) {
        console.error(`Workflow action failed: ${action.type}`, error);
      }
    }
  }

  private async executeApiCall(
    action: WorkflowAction,
    event: SwiftEvent
  ): Promise<void> {
    if (!action.target || !action.endpoint) return;

    const webhookUrl = this.getWebhookUrl(action.target);
    if (!webhookUrl) return;

    const response = await fetch(`${webhookUrl}${action.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Event-Source': 'funnelswift',
        'X-Event-ID': event.id,
      },
      body: JSON.stringify({
        ...action.payload,
        source_event: event,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
  }

  private async executeDelay(duration?: string): Promise<void> {
    if (!duration) return;
    const ms = this.parseDuration(duration);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeTagUpdate(
    payload: any,
    event: SwiftEvent
  ): Promise<void> {
    if (!event.payload.contact_id) return;

    const { data: contact } = await this.supabase
      .from('contacts')
      .select('tags')
      .eq('id', event.payload.contact_id)
      .single();

    if (!contact) return;

    let newTags = [...(contact.tags || [])];

    if (payload.add_tags) {
      newTags = [...new Set([...newTags, ...payload.add_tags])];
    }

    if (payload.remove_tags) {
      newTags = newTags.filter((t) => !payload.remove_tags.includes(t));
    }

    await this.supabase
      .from('contacts')
      .update({ tags: newTags })
      .eq('id', event.payload.contact_id);
  }

  private async executeEmailSend(
    payload: any,
    event: SwiftEvent
  ): Promise<void> {
    // Integration with email service
    console.log('Sending email:', payload);
  }

  private async sendWebhook(
    product: string,
    event: SwiftEvent
  ): Promise<void> {
    const webhookUrl = this.getWebhookUrl(product);
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Source': 'funnelswift',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error(`Failed to send webhook to ${product}:`, error);
    }
  }

  private getWebhookUrl(product: string): string | null {
    const urls: Record<string, string> = {
      adaswift: process.env.NEXT_PUBLIC_ADASWIFT_WEBHOOK_URL || '',
      missedcall: process.env.NEXT_PUBLIC_MISSEDCALL_WEBHOOK_URL || '',
      workflowswift: process.env.NEXT_PUBLIC_WORKFLOWSWIFT_WEBHOOK_URL || '',
    };
    return urls[product] || null;
  }

  private parseDuration(duration: string): number {
    const units: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = duration.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) return 0;

    const [, amount, unit] = match;
    return parseInt(amount) * (units[unit] || 0);
  }
}

export const eventBus = new EventBus();

// Pre-defined workflows
export function registerDefaultWorkflows(): void {
  // Workflow 1: Deliver ADA Widget on tag
  eventBus.registerWorkflow({
    id: 'ada-lead-magnet-delivery',
    name: 'Deliver ADA Widget to Hot Leads',
    source: 'funnelswift',
    event_type: 'tag.assigned',
    condition: (payload) => payload.tags?.includes('ada-lead-magnet'),
    is_active: true,
    actions: [
      {
        type: 'api_call',
        target: 'adaswift',
        endpoint: '/api/widgets/create',
        payload: {
          plan: 'free_trial',
          source: 'funnelswift_lead_magnet',
        },
      },
      {
        type: 'delay',
        duration: '5m',
      },
      {
        type: 'tag_update',
        payload: {
          add_tags: ['ada-widget-sent'],
        },
      },
    ],
  });

  // Workflow 2: Create Missed Call Demo Account
  eventBus.registerWorkflow({
    id: 'missedcall-demo-creation',
    name: 'Create Missed Call Demo on Request',
    source: 'funnelswift',
    event_type: 'tag.assigned',
    condition: (payload) => payload.tags?.includes('missedcall-demo-request'),
    is_active: true,
    actions: [
      {
        type: 'api_call',
        target: 'missedcall',
        endpoint: '/api/demo/create',
        payload: {
          trial_days: 14,
          source: 'funnelswift',
        },
      },
      {
        type: 'tag_update',
        payload: {
          add_tags: ['missedcall-demo-created'],
        },
      },
    ],
  });

  // Workflow 3: Hot Lead Alert
  eventBus.registerWorkflow({
    id: 'hot-lead-alert',
    name: 'Alert on Hot Lead',
    source: 'funnelswift',
    event_type: 'lead.scored',
    condition: (payload) => payload.lead_score >= 80,
    is_active: true,
    actions: [
      {
        type: 'tag_update',
        payload: {
          add_tags: ['hot-lead', 'priority-follow-up'],
        },
      },
      {
        type: 'api_call',
        target: 'workflowswift',
        endpoint: '/api/alerts/send',
        payload: {
          priority: 'high',
          message: 'Hot lead detected!',
        },
      },
    ],
  });
}
