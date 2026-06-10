import { createServiceClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10);
}

export async function compareApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

export async function validateApiKey(
  req: Request,
  requiredPermission: string
): Promise<{ id: string; name: string; app_name: string | null; permissions: string[] }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing API key');
  }

  const key = authHeader.slice(7);

  const supabase = createServiceClient();

  // Get all active API keys
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw new ApiError(500, 'Database error');
  }

  // Find matching key by comparing hashes
  let matchedKey = null;
  for (const keyRecord of keys || []) {
    const isValid = await compareApiKey(key, keyRecord.key_hash);
    if (isValid) {
      matchedKey = keyRecord;
      break;
    }
  }

  if (!matchedKey) {
    throw new ApiError(401, 'Invalid API key');
  }

  if (!matchedKey.permissions.includes(requiredPermission)) {
    throw new ApiError(403, 'Insufficient permissions');
  }

  if (matchedKey.expires_at && new Date(matchedKey.expires_at) < new Date()) {
    throw new ApiError(401, 'API key expired');
  }

  // Update last_used
  await supabase
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('id', matchedKey.id);

  return {
    id: matchedKey.id,
    name: matchedKey.name,
    app_name: matchedKey.app_name,
    permissions: matchedKey.permissions,
  };
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS ?? '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleOptions() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
}
