export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { runAssessmentExecution } from '@/lib/vapt-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = req.headers.get('x-tenant-id') || 'cybermind-master-tenant';

    const execution = runAssessmentExecution(id, tenantId);

    return NextResponse.json({
      status: 'success',
      message: 'VAPT Security Assessment execution launched',
      data: execution,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to run VAPT execution' }, { status: 400 });
  }
}
