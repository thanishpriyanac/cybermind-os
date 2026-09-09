export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCveById } from '@/lib/cve-store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cve = getCveById(id);
  if (!cve) {
    return NextResponse.json({ error: 'CVE not found' }, { status: 404 });
  }
  return NextResponse.json(cve);
}
