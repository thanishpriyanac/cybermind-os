export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentById, loadVaptStore, saveVaptStore } from '@/lib/vapt-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = req.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const assessment = getAssessmentById(id, tenantId);

    if (!assessment) {
      return NextResponse.json({ error: `VAPT Assessment '${id}' not found or access denied` }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      data: assessment,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch assessment' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = req.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const store = loadVaptStore();

    const index = store.assessments.findIndex((a) => a.id === id && a.tenantId === tenantId);
    if (index === -1) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    store.assessments.splice(index, 1);
    saveVaptStore(store);

    return NextResponse.json({ status: 'success', message: 'VAPT Assessment deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete assessment' }, { status: 500 });
  }
}
