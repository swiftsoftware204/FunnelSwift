import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { validateApiKey, ApiError, corsHeaders, handleOptions } from '@/lib/api/auth';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await validateApiKey(req, 'leads:read');

    const supabase = createServiceClient();
    const { id } = params;

    // Get contact with tags
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*, contact_tags(tags(id, name, color))')
      .eq('id', id)
      .single();

    if (error || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Get pipeline position
    const { data: pipelinePosition } = await supabase
      .from('pipeline_contacts')
      .select('*, pipelines(name), pipeline_stages(name, color)')
      .eq('contact_id', id)
      .maybeSingle();

    // Get recent events
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Flatten the tags
    const tags = contact.contact_tags?.map((ct: { tags: { id: string; name: string; color: string } }) => ct.tags) || [];

    const result = {
      ...contact,
      tags,
      pipeline_position: pipelinePosition
        ? {
            pipeline_id: pipelinePosition.pipeline_id,
            pipeline_name: (pipelinePosition.pipelines as { name: string })?.name,
            stage_id: pipelinePosition.stage_id,
            stage_name: (pipelinePosition.pipeline_stages as { name: string })?.name,
            stage_color: (pipelinePosition.pipeline_stages as { color: string })?.color,
            deal_value: pipelinePosition.deal_value,
          }
        : null,
      recent_events: events || [],
    };

    return NextResponse.json({ contact: result }, { headers: corsHeaders() });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
