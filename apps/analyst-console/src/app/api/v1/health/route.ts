export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getDynamicHealthData } from './stream/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getDynamicHealthData(), { headers: { 'Cache-Control': 'no-store' } });
}

