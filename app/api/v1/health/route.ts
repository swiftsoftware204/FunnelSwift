import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, string> = {};
  let healthy = true;

  // Probe Supabase connectivity
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('api_keys').select('id', { count: 'exact', head: true });
    checks.supabase = error ? `degraded: ${error.message}` : 'ok';
    if (error) healthy = false;
  } catch (e) {
    checks.supabase = 'unreachable';
    healthy = false;
  }

  const elapsed = Date.now() - start;

  return Response.json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    elapsed_ms: elapsed,
    service: 'funnelswift-lead-capture',
    version: '1.0.0',
    checks,
  }, {
    status: healthy ? 200 : 503,
  });
}
