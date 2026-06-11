import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'whsec_m3k8p2n5q7r9t1v4w6x8y2z5a7b9c1d';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data, tracking_id, referred_by_user_id } = body;

    // Verify webhook secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    switch (event) {
      case 'demo_created':
        // Update contact with MissedCall demo info
        await supabase
          .from('contacts')
          .update({
            missedcall_demo_created: true,
            missedcall_demo_code: data.demo_code,
            missedcall_tracking_id: tracking_id,
          })
          .eq('funnelswift_tracking_id', tracking_id);
        break;

      case 'upgrade':
        // Track upgrade for affiliate commission
        await supabase
          .from('affiliate_commissions')
          .insert({
            affiliate_id: referred_by_user_id,
            contact_id: data.contact_id,
            product: 'missedcall',
            plan: data.plan,
            commission_amount: data.commission_amount,
            status: 'pending',
          });

        // Update contact status
        await supabase
          .from('contacts')
          .update({
            missedcall_upgraded: true,
            missedcall_plan: data.plan,
          })
          .eq('id', data.contact_id);
        break;

      default:
        console.log('Unknown event:', event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
