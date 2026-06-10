import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { dispatchEvent } from '@/lib/api/webhook';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-telnyx-signature') || '';
    const timestamp = req.headers.get('x-telnyx-timestamp') || '';
    
    // Verify webhook signature
    const secret = process.env.TELNYX_WEBHOOK_SECRET;
    if (!secret) {
      console.error('TELNYX_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }
    
    const signedPayload = timestamp + '|' + body;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('base64');
    
    if (signature !== expectedSignature) {
      console.error('Invalid Telnyx signature');
      return new Response('Invalid signature', { status: 403 });
    }
    
    const data = JSON.parse(body);
    const message = data.data?.payload;
    
    if (!message || message.direction !== 'inbound') {
      return NextResponse.json({ status: 'ignored' });
    }
    
    const supabase = createServiceClient();
    const phone = message.from?.phone_number;
    const text = message.text;
    
    if (!phone) {
      return new Response('Missing phone number', { status: 400 });
    }
    
    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : '+' + phone;
    
    // Find or create contact
    const { data: existing } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle();
    
    let contactId: string;
    
    if (existing) {
      contactId = existing.id;
    } else {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
          phone: normalizedPhone,
          source: 'sms',
          status: 'new',
        })
        .select()
        .single();
      if (error) {
        console.error('Error creating contact:', error);
        throw error;
      }
      contactId = newContact.id;
    }
    
    // Apply SMS tag
    const { data: smsTag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', 'SMS_Inbound')
      .maybeSingle();
    
    if (smsTag) {
      await supabase.from('contact_tags').upsert({
        contact_id: contactId,
        tag_id: smsTag.id,
      }, { onConflict: 'contact_id,tag_id' });
    }
    
    // Fire event
    await dispatchEvent({
      contact_id: contactId,
      event_type: 'sms_received',
      source_app: 'sms_platform',
      payload: { message: text, telnyx_message_id: message.id },
    });
    
    return NextResponse.json({ status: 'ok', contact_id: contactId });
  } catch (error) {
    console.error('Telnyx webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
}
