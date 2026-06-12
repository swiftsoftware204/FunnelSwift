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
    const { affiliate_id, start_date, end_date } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliate_profiles')
      .select('*')
      .eq('id', affiliate_id)
      .single();

    if (affiliateError || !affiliate) {
      throw new Error('Affiliate not found');
    }

    // Calculate commissions for period
    const { data: commissions, error: commissionError } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_id', affiliate_id)
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    if (commissionError) throw commissionError;

    const summary = {
      total_commissions: commissions?.length || 0,
      total_amount: commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
      pending_amount: commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
      approved_amount: commissions?.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
      paid_amount: commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
    };

    return new Response(
      JSON.stringify({
        success: true,
        affiliate: {
          id: affiliate.id,
          code: affiliate.affiliate_code,
          rate: affiliate.commission_rate,
        },
        period: { start_date, end_date },
        summary,
        commissions: commissions || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in affiliate-calculate-commission:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
