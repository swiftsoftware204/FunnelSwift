import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { dispatchEvent } from '@/lib/api/webhook';
import crypto from 'crypto';

// Telnyx webhook verification using public key
async function verifyTelnyxSignature(
  payload: string,
  signature: string,
  timestamp: string,
  publicKey: string
): Promise<boolean> {
  try {
    const signedPayload = timestamp + '|' + payload;
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    return crypto.verify(
      'sha256',
      Buffer.from(signedPayload),
      publicKey,
      signatureBuffer
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-telnyx-signature') || '';
    const timestamp = req.headers.get('x-telnyx-timestamp') || '';
    
    // Verify webhook signature using public key
    const publicKey = process.env.TELNYX_PUBLIC_KEY;
    if (!publicKey) {
      console.error('TELNYX_PUBLIC_KEY not configured');
      return new Response('Webhook public key not configured', { status: 500 });
    }
    
    const isValid = await verifyTelnyxSignature(body, signature, timestamp, publicKey);
    
    if (!isValid) {
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
