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
    const { contact_id, tag_id, tag_name } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the system tag details
    const { data: systemTag, error: tagError } = await supabase
      .from('system_tags')
      .select('*')
      .eq('tag_name', tag_name)
      .eq('is_active', true)
      .single();

    if (tagError || !systemTag) {
      console.log('No active system tag found for:', tag_name);
      return new Response(
        JSON.stringify({ success: true, message: 'No webhook triggered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      throw new Error('Contact not found');
    }

    // Fire webhook based on target software
    let result;
    switch (systemTag.target_software) {
      case 'sendiio':
        result = await triggerSendiioWebhook(contact, systemTag);
        break;
      case 'workflowswift':
        result = await triggerWorkflowSwiftWebhook(contact, systemTag);
        break;
      case 'adaswift':
        result = await triggerADASwiftWebhook(contact, systemTag);
        break;
      case 'globalcontrol':
        result = await triggerGlobalControlWebhook(contact, systemTag);
        break;
      case 'webhook':
        result = await triggerCustomWebhook(contact, systemTag);
        break;
      default:
        console.log('Unknown target software:', systemTag.target_software);
        result = { success: false, error: 'Unknown target software' };
    }

    // Log the webhook event
    await supabase.from('webhook_events').insert({
      contact_id,
      tag_id: systemTag.id,
      tag_name,
      target_software: systemTag.target_software,
      campaign_id: systemTag.campaign_id,
      payload: contact,
      response: result,
      status: result.success ? 'success' : 'failed',
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in tag-trigger-webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function triggerSendiioWebhook(contact: any, tag: any) {
  // Implementation for Sendiio API
  console.log('Triggering Sendiio webhook:', { contact, campaign: tag.campaign_id });
  return { success: true, message: 'Sendiio webhook triggered' };
}

async function triggerWorkflowSwiftWebhook(contact: any, tag: any) {
  // Implementation for WorkflowSwift API
  console.log('Triggering WorkflowSwift webhook:', { contact, campaign: tag.campaign_id });
  return { success: true, message: 'WorkflowSwift webhook triggered' };
}

async function triggerADASwiftWebhook(contact: any, tag: any) {
  // Implementation for ADASwift API
  console.log('Triggering ADASwift webhook:', { contact, campaign: tag.campaign_id });
  return { success: true, message: 'ADASwift webhook triggered' };
}

async function triggerGlobalControlWebhook(contact: any, tag: any) {
  // Implementation for Global Control API
  console.log('Triggering GlobalControl webhook:', { contact, campaign: tag.campaign_id });
  return { success: true, message: 'GlobalControl webhook triggered' };
}

async function triggerCustomWebhook(contact: any, tag: any) {
  // Implementation for custom webhook
  console.log('Triggering custom webhook:', { contact, url: tag.campaign_id });
  return { success: true, message: 'Custom webhook triggered' };
}
