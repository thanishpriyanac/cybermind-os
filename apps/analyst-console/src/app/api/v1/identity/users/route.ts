import { NextResponse } from 'next/server';
import { userStore } from '@/lib/user-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = (forwardedFor ? forwardedFor.split(',')[0] : realIp) || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const userEmail = request.headers.get('x-user-email') || 'admin@cybermind.local';

    // Record or update current active session
    userStore.recordSession({
      email: userEmail,
      ipAddress: ip,
      userAgent: userAgent,
    });

    const sessions = userStore.getSessions();
    const activeCount = sessions.filter(s => s.status === 'ACTIVE_NOW').length;

    return NextResponse.json({
      totalUsers: sessions.length,
      activeUsersCount: activeCount,
      activeCount: activeCount,
      sessions,
      users: sessions.map(s => ({
        ...s,
        ip: s.ipAddress,
        deviceOS: s.os,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
