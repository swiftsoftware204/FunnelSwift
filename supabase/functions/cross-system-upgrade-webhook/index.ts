import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('CROSS_SYSTEM_WEBHOOK_SECRET');
    
    if (webhookSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();
    
    const {
      tracking_token,
      software,
      transaction_id,
      customer_email,
      amount,
      product_name,
      plan_slug,
      billing_cycle,
      webhook_data,
    } = payload;

    // Validate required fields
    if (!tracking_token || !software || !transaction_id || !customer_email || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Record the upgrade and create commission
    const { data: commissionId, error } = await supabase.rpc(
      'record_cross_system_upgrade',
      {
        p_token: tracking_token,
        p_software: software,
        p_transaction_id: transaction_id,
        p_customer_email: customer_email,
        p_amount: amount,
        p_product_name: product_name || 'Unknown Product',
        p_plan_slug: plan_slug || 'unknown',
        p_billing_cycle: billing_cycle || 'monthly',
        p_webhook_data: webhook_data || {},
      }
    );

    if (error) {
      console.error('Error recording upgrade:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        commission_id: commissionId,
        message: `Commission recorded for ${software} upgrade`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
