export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { escalateVaptToInvestigation } from '@/lib/vapt-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = req.headers.get('x-tenant-id') || 'cybermind-master-tenant';

    const result = escalateVaptToInvestigation(id, tenantId);

    return NextResponse.json({
      status: 'success',
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to escalate VAPT findings' }, { status: 400 });
  }
}
