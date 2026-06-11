import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ADASWIFT_WEBHOOK_URL = process.env.ADASWIFT_WEBHOOK_URL || 'https://your-adaswift.netlify.app/.netlify/functions/funnelswift-webhook';
const ADASWIFT_WEBHOOK_SECRET = process.env.ADASWIFT_WEBHOOK_SECRET || 'whsec_adaswift_secret';

export async function POST(request: NextRequest) {
  try {
    const { contact_id, tag_name } = await request.json();
    
    // Trigger for ANY tag containing "demo" (ada-demo, widget-demo, etc.)
    const isDemoTag = tag_name && tag_name.toLowerCase().includes('demo');
    
    if (!isDemoTag) {
      return NextResponse.json({ skipped: true, reason: 'Not a demo tag' });
    }
    
    const supabase = createClient();
    
    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .single();
    
    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    // Get website URL from custom fields or default
    const websiteUrl = contact.website_url || contact.custom_fields?.website || '';
    
    // Prepare webhook payload
    const payload = {
      event: 'create_client',
      data: {
        contact_id: contact.id,
        email: contact.email,
        first_name: contact.first_name,
        last_name: contact.last_name,
        phone: contact.phone,
        company: contact.company,
        website_url: websiteUrl,
        funnelswift_tracking_id: contact.funnelswift_tracking_id,
        referred_by_user_id: contact.referred_by_user_id,
      },
      tag_name: tag_name, // Pass the tag name so ADASwift knows it's a demo
      tracking_id: contact.funnelswift_tracking_id,
      timestamp: new Date().toISOString(),
    };
    
    // Send webhook to ADASwift
    const response = await fetch(ADASWIFT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADASWIFT_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`ADASwift webhook failed: ${response.statusText}`);
    }
    
    // Log the webhook call
    await supabase.from('integration_events').insert({
      source: 'funnelswift',
      event_type: 'adaswift_client_created',
      contact_id: contact.id,
      tracking_id: contact.funnelswift_tracking_id,
      payload: payload,
      status: 'sent',
    });
    
    return NextResponse.json({ success: true, message: 'ADASwift webhook sent' });
    
  } catch (error) {
    console.error('Error triggering ADASwift webhook:', error);
    return NextResponse.json({ error: 'Failed to trigger webhook' }, { status: 500 });
  }
}
