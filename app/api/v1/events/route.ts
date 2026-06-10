import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiKey, ApiError, corsHeaders, handleOptions } from '@/lib/api/auth';
import { dispatchEvent } from '@/lib/api/webhook';

const CreateEventSchema = z.object({
  contact_id: z.string().uuid().optional(),
  event_type: z.string().min(1).max(100),
  source_app: z.string().max(100).optional(),
  payload: z.record(z.unknown()).optional(),
});

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    await validateApiKey(req, 'events:write');

    const body = await req.json();
    const validated = CreateEventSchema.parse(body);

    const result = await dispatchEvent({
      contact_id: validated.contact_id || null,
      event_type: validated.event_type,
      source_app: validated.source_app || 'external_api',
      payload: validated.payload || {},
    });

    return NextResponse.json(result, { headers: corsHeaders() });
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
    console.error('Event creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
