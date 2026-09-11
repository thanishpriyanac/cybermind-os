import { NextResponse } from 'next/server';
// @ts-ignore
import jwt from 'jsonwebtoken';

// Known seeded accounts from services/identity/prisma/seed.js
const SEEDED_CREDENTIALS: Record<string, string> = {
  'admin@cybermind.local': 'admin123',
  'admin@cybermind.io': 'admin123',
  'thanishpriyan@gmail.com': 'thanish123',
  'houshic19@gmail.com': 'houshic123',
  'guest@cybermind.local': 'dust123',
  'guest@cybermind.io': 'dust123',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantSlug, email, password } = body;

    const cleanEmail = email?.toLowerCase()?.trim();
    const cleanPassword = password?.trim();
    const cleanTenant = tenantSlug?.trim() || 'cybermind-master-tenant';

    // 1. Try to forward to the backend service if running locally
    const backendEndpoints = [
      'http://127.0.0.1:3000/api/v1/identity/auth/login',
      'http://127.0.0.1:3001/api/auth/login',
      'http://127.0.0.1:3010/api/v1/identity/auth/login',
    ];

    for (const endpoint of backendEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const backendRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        // Backend not listening on this port, continue
      }
    }

    // 2. Validate against seeded platform credentials
    const expectedPassword = SEEDED_CREDENTIALS[cleanEmail] || process.env.ADMIN_PASSWORD;
    const isValid = expectedPassword && (expectedPassword === cleanPassword || expectedPassword === password);

    if (isValid) {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const ip = (forwardedFor ? forwardedFor.split(',')[0] : realIp) || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || '';

      const { userStore } = await import('@/lib/user-store');
      userStore.recordSession({
        email: cleanEmail,
        tenantId: cleanTenant,
        role: 'SUPER_ADMIN',
        ipAddress: ip,
        userAgent,
      });

      const secret = process.env.JWT_SECRET || 'cybermind-secret-jwt-key-2026';
      const token = jwt.sign(
        {
          sub: 'seeded-user-id',
          email: cleanEmail,
          tid: cleanTenant,
          role: 'Platform Administrator',
        },
        secret,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        accessToken: token,
        token: token,
        access_token: token,
        refreshToken: 'seeded-refresh-token',
        user: {
          email: cleanEmail,
          tenantId: cleanTenant,
          role: 'Platform Administrator',
        },
      });
    }

    return NextResponse.json(
      { message: 'Invalid credentials. Please verify your email and password.' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: 'Login service encountered an error' },
      { status: 500 }
    );
  }
}
