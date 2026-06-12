import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { referral_code, order_id, order_value, product_id, product_name } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find the referral
    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .select('*, affiliate:affiliate_id(*)')
      .eq('referral_code', referral_code)
      .eq('status', 'pending')
      .single();

    if (referralError || !referral) {
      throw new Error('Referral not found or already converted');
    }

    // Update referral status
    const { error: updateError } = await supabase
      .from('affiliate_referrals')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        conversion_value: order_value,
      })
      .eq('id', referral.id);

    if (updateError) throw updateError;

    // Calculate commission
    const commissionRate = referral.affiliate.commission_rate || 30;
    const commissionAmount = (order_value * commissionRate) / 100;

    // Create commission record
    const { error: commissionError } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: referral.affiliate_id,
        referral_id: referral.id,
        amount: commissionAmount,
        status: 'pending',
        product_id,
        product_name,
        order_id,
      });

    if (commissionError) throw commissionError;

    // Update affiliate stats
    const { error: statsError } = await supabase
      .from('affiliate_profiles')
      .update({
        total_conversions: supabase.rpc('increment', { row_id: referral.affiliate_id }),
        total_earnings: supabase.rpc('add', { amount: commissionAmount }),
        pending_earnings: supabase.rpc('add', { amount: commissionAmount }),
      })
      .eq('id', referral.affiliate_id);

    if (statsError) throw statsError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conversion tracked successfully',
        commission: commissionAmount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in affiliate-track-conversion:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
