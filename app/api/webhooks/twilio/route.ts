import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { dispatchEvent } from '@/lib/api/webhook';

// Twilio signature validation
function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');

  const expectedSignature = createHmac('sha1', authToken)
    .update(url + sortedParams)
    .digest('base64');

  return expectedSignature === signature;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = Object.fromEntries(new URLSearchParams(body));
    const signature = req.headers.get('X-Twilio-Signature') ?? '';

    // Get Twilio auth token from environment
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWebhookUrl = process.env.TWILIO_WEBHOOK_URL || req.url;

    // Validate signature (skip in development if no token)
    if (twilioAuthToken) {
      const isValid = validateTwilioSignature(
        twilioAuthToken,
        twilioWebhookUrl,
        params,
        signature
      );
      if (!isValid) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    const from = params.From;
    const to = params.To;
    const messageBody = params.Body || '';
    const messageSid = params.MessageSid;

    if (!from) {
      return new Response('Missing From number', { status: 400 });
    }

    const supabase = createServiceClient();

    // Find or create contact by phone
    let { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', from)
      .maybeSingle();

    if (!contact) {
      // Create new contact from SMS
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
          phone: from,
          source: 'sms',
          status: 'new',
          preferred_contact: 'sms',
        })
        .select()
        .single();

      if (error) throw error;
      contact = newContact;

      // Add SMS tag
      const { data: smsTag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', 'SMS Demo')
        .maybeSingle();

      if (smsTag) {
        await supabase.from('contact_tags').insert({
          contact_id: contact.id,
          tag_id: smsTag.id,
        });
      }
    }

    // Fire event
    await dispatchEvent({
      contact_id: contact.id,
      event_type: 'sms_received',
      source_app: 'twilio',
      payload: {
        from,
        to,
        body: messageBody,
        message_sid: messageSid,
      },
    });

    // Return empty TwiML (no auto-reply by default)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new Response(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Twilio webhook error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
