import { NextResponse } from 'next/server';
import { loadAlerts, acknowledgeAllAlerts, updateAlertStatus } from '@/lib/alert-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const alerts = loadAlerts();
    return NextResponse.json({
      data: alerts,
      total: alerts.length,
      page: 1,
      pageSize: 20,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: [], total: 0, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, alertId, status } = body;

    if (action === 'acknowledge_all') {
      const updated = acknowledgeAllAlerts();
      return NextResponse.json({ success: true, count: updated.length, data: updated });
    }

    if (action === 'update_status' && alertId && status) {
      const updated = updateAlertStatus(alertId, status);
      if (!updated) {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, alert: updated });
    }

    // Default: acknowledge all
    const updated = acknowledgeAllAlerts();
    return NextResponse.json({ success: true, count: updated.length, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}
