import { NextRequest } from 'next/server';
import { qbrStore } from '@/lib/qbr-store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = qbrStore.getReport(id);
  if (!report) {
    return Response.json({ success: false, error: 'Report not found' }, { status: 404 });
  }
  return Response.json({ success: true, data: report });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = qbrStore.updateReport(id, body);
    if (!updated) {
      return Response.json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to update QBR report' }, { status: 500 });
  }
}
