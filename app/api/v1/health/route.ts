import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'swiftimpact-lead-capture',
    version: '1.0.0',
  });
}
