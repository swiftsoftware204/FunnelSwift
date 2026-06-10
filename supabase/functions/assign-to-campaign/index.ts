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
    const { leads, campaign_id, integration } = await req.json();

    // Get campaign/integration details
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: campaignData } = await supabase
      .from('tenant_integrations')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (!campaignData) {
      throw new Error('Campaign not found');
    }

    // Send to appropriate integration
    let result;
    switch (integration) {
      case 'sendiio':
        result = await sendToSendiio(leads, campaignData);
        break;
      case 'globalcontrol':
        result = await sendToGlobalControl(leads, campaignData);
        break;
      case 'mailchimp':
        result = await sendToMailchimp(leads, campaignData);
        break;
      case 'activecampaign':
        result = await sendToActiveCampaign(leads, campaignData);
        break;
      default:
        throw new Error('Unknown integration');
    }

    // Log the assignment
    await supabase.from('campaign_assignments').insert(
      leads.map((lead: any) => ({
        lead_id: lead.id,
        campaign_id: campaign_id,
        integration: integration,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }))
    );

    return new Response(
      JSON.stringify({ success: true, message: `${leads.length} leads assigned` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendToSendiio(leads: any[], campaignData: any) {
  // Implementation for Sendiio API
  const credentials = campaignData.credentials;
  
  for (const lead of leads) {
    await fetch('https://sendiio.com/api/v1/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': credentials.api_key,
      },
      body: JSON.stringify({
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        list_id: campaignData.settings?.list_id,
        tags: lead.tags || [],
      }),
    });
  }
  
  return { success: true };
}

async function sendToGlobalControl(leads: any[], campaignData: any) {
  // Implementation for Global Control API
  const credentials = campaignData.credentials;
  
  for (const lead of leads) {
    await fetch(`${credentials.api_url}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.api_key}`,
      },
      body: JSON.stringify({
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone,
        tags: lead.tags || [],
      }),
    });
  }
  
  return { success: true };
}

async function sendToMailchimp(leads: any[], campaignData: any) {
  // Implementation for Mailchimp API
  return { success: true };
}

async function sendToActiveCampaign(leads: any[], campaignData: any) {
  // Implementation for ActiveCampaign API
  return { success: true };
}
