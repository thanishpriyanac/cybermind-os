export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSyncStatus } from '../../../../../lib/cve-store';

export async function GET() {
  const status = getSyncStatus();
  return NextResponse.json(status);
}
