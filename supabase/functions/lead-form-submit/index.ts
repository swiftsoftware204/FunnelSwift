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
    const { tenant_id, form_slug, form_data, referrer } = await req.json();

    // Validate required fields
    if (!tenant_id || !form_slug || !form_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get form configuration
    const { data: form, error: formError } = await supabase
      .from('lead_forms')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('slug', form_slug)
      .eq('is_active', true)
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: 'Form not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create submission
    const { data: submission, error: submitError } = await supabase
      .from('lead_form_submissions')
      .insert({
        form_id: form.id,
        form_data: form_data,
        referrer: referrer || req.headers.get('referer'),
        ip_address: req.headers.get('x-forwarded-for') || req.conn?.remoteAddr,
        user_agent: req.headers.get('user-agent'),
      })
      .select('*, contact:contact_id(*)')
      .single();

    if (submitError) {
      return new Response(
        JSON.stringify({ error: submitError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: form.success_message,
        redirect_url: form.success_redirect_url,
        contact_id: submission.contact_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
