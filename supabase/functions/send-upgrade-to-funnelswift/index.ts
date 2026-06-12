import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// This function is called BY satellite apps (ADASwift, MissedCall, WorkflowSwift)
// when a user upgrades. It notifies FunnelSwift to credit the affiliate.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      tracking_token,      // The token from when demo was created
      customer_email,      // Customer's email
      transaction_id,      // Payment transaction ID
      amount,              // Transaction amount
      product_name,        // Name of product/plan
      plan_slug,           // Plan identifier
      billing_cycle,       // monthly/yearly/one-time
      software_name,       // 'adaswift', 'missedcall', or 'workflowswift'
    } = await req.json();

    // Validate
    if (!tracking_token || !customer_email || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tracking_token, customer_email, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get FunnelSwift webhook URL from environment
    const funnelswiftWebhookUrl = Deno.env.get('FUNNELSWIFT_WEBHOOK_URL');
    const funnelswiftWebhookSecret = Deno.env.get('FUNNELSWIFT_WEBHOOK_SECRET');

    if (!funnelswiftWebhookUrl) {
      return new Response(
        JSON.stringify({ error: 'FUNNELSWIFT_WEBHOOK_URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send to FunnelSwift
    const response = await fetch(funnelswiftWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': funnelswiftWebhookSecret || '',
      },
      body: JSON.stringify({
        tracking_token,
        software: software_name,
        transaction_id: transaction_id || `txn_${Date.now()}`,
        customer_email,
        amount: parseFloat(amount),
        product_name: product_name || 'Subscription',
        plan_slug: plan_slug || 'default',
        billing_cycle: billing_cycle || 'monthly',
        webhook_data: {
          source: software_name,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FunnelSwift webhook failed: ${errorText}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Upgrade notification sent to FunnelSwift',
        funnelswift_response: result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending to FunnelSwift:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
