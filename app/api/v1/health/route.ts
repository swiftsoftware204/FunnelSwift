export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'funnelswift-lead-capture',
    version: '1.0.0',
  });
}
