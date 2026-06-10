import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { validateApiKey, ApiError, corsHeaders, handleOptions } from '@/lib/api/auth';
import { dispatchEvent } from '@/lib/api/webhook';
import { calculateLeadScore } from '@/lib/scoring/lead-score';
import { Contact } from '@/types';

const CreateLeadSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  business_name: z.string().max(200).optional(),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  source: z.enum([
    'form',
    'sms',
    'demo_missed_call',
    'demo_ada',
    'demo_ai',
    'qr',
    'cold_email',
    'fb_ad',
    'manual',
    'external_api',
  ]),
  campaign: z.string().max(200).optional(),
  tags: z.array(z.string()).max(20).optional(),
  pipeline: z.string().optional(),
  lead_score: z.number().int().min(0).max(100).optional(),
  payload: z.record(z.unknown()).optional(),
});

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    await validateApiKey(req, 'leads:write');

    const body = await req.json();
    const validated = CreateLeadSchema.parse(body);

    const supabase = createServiceClient();

    // Check for existing contact by email or phone (upsert logic)
    let existingContact: Contact | null = null;
    if (validated.email) {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', validated.email)
        .maybeSingle();
      existingContact = data as Contact | null;
    }
    if (!existingContact && validated.phone) {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('phone', validated.phone)
        .maybeSingle();
      existingContact = data as Contact | null;
    }

    let contact: Contact;
    let status: 'created' | 'updated' = 'created';

    if (existingContact) {
      // Update existing contact
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (validated.first_name) updates.first_name = validated.first_name;
      if (validated.last_name) updates.last_name = validated.last_name;
      if (validated.business_name) updates.business_name = validated.business_name;
      if (validated.website) updates.website = validated.website;
      if (validated.industry) updates.industry = validated.industry;
      if (validated.campaign) updates.campaign = validated.campaign;

      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', existingContact.id)
        .select()
        .single();

      if (error) throw error;
      contact = data as Contact;
      status = 'updated';
    } else {
      // Create new contact
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          first_name: validated.first_name,
          last_name: validated.last_name,
          email: validated.email,
          phone: validated.phone,
          business_name: validated.business_name,
          website: validated.website,
          industry: validated.industry,
          source: validated.source,
          campaign: validated.campaign,
          status: 'new',
        })
        .select()
        .single();

      if (error) throw error;
      contact = data as Contact;
    }

    // Apply tags if provided
    if (validated.tags && validated.tags.length > 0) {
      // Get tag IDs by name
      const { data: tagRecords } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', validated.tags);

      if (tagRecords && tagRecords.length > 0) {
        const contactTags = tagRecords.map(tag => ({
          contact_id: contact.id,
          tag_id: tag.id,
        }));

        // Insert only new tags (ignore duplicates)
        for (const ct of contactTags) {
          await supabase.from('contact_tags').insert(ct).maybeSingle();
        }
      }
    }

    // Add to pipeline if specified
    if (validated.pipeline) {
      const { data: pipeline } = await supabase
        .from('pipelines')
        .select('id, pipeline_stages(id)')
        .eq('name', validated.pipeline)
        .single();

      if (pipeline) {
        const stages = pipeline.pipeline_stages as { id: string }[];
        const firstStage = stages?.[0];
        if (firstStage) {
          await supabase.from('pipeline_contacts').insert({
            contact_id: contact.id,
            pipeline_id: pipeline.id,
            stage_id: firstStage.id,
          });
        }
      }
    }

    // Calculate lead score
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('contact_id', contact.id);
    const score = calculateLeadScore(contact, events || []);
    await supabase
      .from('contacts')
      .update({ lead_score: score })
      .eq('id', contact.id);
    contact.lead_score = score;

    // Fire event
    await dispatchEvent({
      contact_id: contact.id,
      event_type: status === 'created' ? 'lead_created' : 'lead_updated',
      source_app: 'external_api',
      payload: validated.payload || {},
    });

    return NextResponse.json(
      { id: contact.id, status, contact },
      { headers: corsHeaders() }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: corsHeaders() }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400, headers: corsHeaders() }
      );
    }
    console.error('Lead creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await validateApiKey(req, 'leads:read');

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    let query = supabase
      .from('contacts')
      .select('*, contact_tags(tags(id, name, color))')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ contacts: data }, { headers: corsHeaders() });
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
