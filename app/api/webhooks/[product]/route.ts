import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handle incoming webhooks from other SwiftSoftware products
export async function POST(
  request: NextRequest,
  { params }: { params: { product: string } }
) {
  const { product } = params;
  const supabase = createClient();

  try {
    // Verify the product is valid
    const validProducts = ['adaswift', 'missedcall', 'workflowswift'];
    if (!validProducts.includes(product)) {
      return NextResponse.json(
        { error: 'Invalid product' },
        { status: 400 }
      );
    }

    // Get webhook payload
    const payload = await request.json();

    // Log the incoming webhook
    console.log(`Webhook received from ${product}:`, payload);

    // Store the event
    const { data: event, error: insertError } = await supabase
      .from('integration_events')
      .insert({
        source: product,
        event_type: payload.event_type || 'unknown',
        payload: JSON.stringify(payload),
        target_products: ['funnelswift'],
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store webhook event:', insertError);
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 500 }
      );
    }

    // Process the webhook based on product and event type
    await processWebhook(product, payload, supabase);

    return NextResponse.json({
      success: true,
      event_id: event.id,
      message: `Webhook from ${product} processed successfully`,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processWebhook(
  product: string,
  payload: any,
  supabase: any
) {
  switch (product) {
    case 'adaswift':
      await processADASwiftWebhook(payload, supabase);
      break;
    case 'missedcall':
      await processMissedCallWebhook(payload, supabase);
      break;
    case 'workflowswift':
      await processWorkflowSwiftWebhook(payload, supabase);
      break;
  }
}

async function processADASwiftWebhook(payload: any, supabase: any) {
  const { event_type, contact_email, metadata } = payload;

  switch (event_type) {
    case 'widget.installed':
      // Update lead status when widget is installed
      if (contact_email) {
        await supabase
          .from('contacts')
          .update({
            status: 'widget_installed',
            updated_at: new Date().toISOString(),
          })
          .eq('email', contact_email);

        // Add tag
        const { data: contact } = await supabase
          .from('contacts')
          .select('tags')
          .eq('email', contact_email)
          .single();

        if (contact) {
          const newTags = [...new Set([...(contact.tags || []), 'ada-widget-active'])];
          await supabase
            .from('contacts')
            .update({ tags: newTags })
            .eq('email', contact_email);
        }
      }
      break;

    case 'widget.upgraded':
      // Handle upgrade events
      if (contact_email) {
        await supabase
          .from('contacts')
          .update({
            status: 'converted',
            updated_at: new Date().toISOString(),
          })
          .eq('email', contact_email);
      }
      break;
  }
}

async function processMissedCallWebhook(payload: any, supabase: any) {
  const { event_type, contact_email, phone, metadata } = payload;

  switch (event_type) {
    case 'demo.activated':
      // Update lead when demo is activated
      if (contact_email || phone) {
        const query = contact_email
          ? supabase.from('contacts').update({ status: 'demo_active' }).eq('email', contact_email)
          : supabase.from('contacts').update({ status: 'demo_active' }).eq('phone', phone);

        await query;
      }
      break;

    case 'sms.converted':
      // Handle SMS conversion
      if (contact_email) {
        await supabase
          .from('contacts')
          .update({
            status: 'sms_engaged',
            updated_at: new Date().toISOString(),
          })
          .eq('email', contact_email);
      }
      break;
  }
}

async function processWorkflowSwiftWebhook(payload: any, supabase: any) {
  const { event_type, contact_email, workflow_id, metadata } = payload;

  switch (event_type) {
    case 'workflow.completed':
      // Log workflow completion
      console.log(`Workflow ${workflow_id} completed for ${contact_email}`);
      break;

    case 'alert.triggered':
      // Handle alerts from WorkflowSwift
      if (contact_email) {
        await supabase
          .from('contacts')
          .update({
            notes: `Alert: ${metadata?.message || 'Workflow alert triggered'}`,
            updated_at: new Date().toISOString(),
          })
          .eq('email', contact_email);
      }
      break;
  }
}
