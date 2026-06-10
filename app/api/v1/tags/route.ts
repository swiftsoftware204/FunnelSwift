import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { validateApiKey, ApiError, corsHeaders, handleOptions } from '@/lib/api/auth';

const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  try {
    await validateApiKey(req, 'leads:read');

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ tags: data }, { headers: corsHeaders() });
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

export async function POST(req: NextRequest) {
  try {
    await validateApiKey(req, 'leads:write');

    const body = await req.json();
    const validated = CreateTagSchema.parse(body);

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: validated.name,
        color: validated.color || '#5B4FFF',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Tag already exists' },
          { status: 409, headers: corsHeaders() }
        );
      }
      throw error;
    }

    return NextResponse.json({ tag: data }, { headers: corsHeaders() });
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
