export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSyncStatus, ensureBootstrapped } from '../../../../../lib/cve-store';

export async function GET() {
  await ensureBootstrapped();
  const status = getSyncStatus();
  return NextResponse.json(status);
}
