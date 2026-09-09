import { NextRequest } from 'next/server';
import { qbrStore } from '@/lib/qbr-store';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const report = qbrStore.getReport(params.id);
  if (!report) {
    return Response.json({ success: false, error: 'Report not found' }, { status: 404 });
  }
  return Response.json({ success: true, data: report });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = qbrStore.updateReport(params.id, body);
    if (!updated) {
      return Response.json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to update QBR report' }, { status: 500 });
  }
}
