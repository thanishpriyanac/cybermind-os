import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    latencyMs: 12,
    downloadSpeedMbps: 98.4,
    uploadSpeedMbps: 84.1,
    jitterMs: 1.2,
    timestamp: new Date().toISOString(),
  });
}
