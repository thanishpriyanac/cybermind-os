export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

function createEdgeJwt(payload: Record<string, any>, secretStr: string): string {
  try {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodeBase64Url = (obj: any) => {
      const json = JSON.stringify(obj);
      return btoa(json).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    };
    const h = encodeBase64Url(header);
    const p = encodeBase64Url(payload);
    const s = btoa(`${h}.${p}.${secretStr}`).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${h}.${p}.${s}`;
  } catch {
    return `token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// Known seeded accounts from services/identity/prisma/seed.js
const SEEDED_CREDENTIALS: Record<string, string> = {
  'admin@cybermind.local': 'admin123',
  'admin@cybermind.io': 'admin123',
  'thanishpriyan@gmail.com': 'thanish123',
  'houshic19@gmail.com': 'houshic123',
  'guest@cybermind.local': 'dust123',
  'guest@cybermind.io': 'dust123',
  'saravanan@cybermind.io': 'saran@123',
  'saravanan@cybermind.local': 'saran@123',
  'saravanan@gmail.com': 'saran@123',
  'saravanan': 'saran@123',
};

const RESTRICTED_USERS: Record<string, { role: string; restrictedPaths: string[] }> = {
  'saravanan@cybermind.io': { role: 'RESTRICTED_ANALYST', restrictedPaths: ['/qbr', '/firewall', '/toolkit/firewall-rules', '/toolkit/firewall-simulator'] },
  'saravanan@cybermind.local': { role: 'RESTRICTED_ANALYST', restrictedPaths: ['/qbr', '/firewall', '/toolkit/firewall-rules', '/toolkit/firewall-simulator'] },
  'saravanan@gmail.com': { role: 'RESTRICTED_ANALYST', restrictedPaths: ['/qbr', '/firewall', '/toolkit/firewall-rules', '/toolkit/firewall-simulator'] },
  'saravanan': { role: 'RESTRICTED_ANALYST', restrictedPaths: ['/qbr', '/firewall', '/toolkit/firewall-rules', '/toolkit/firewall-simulator'] },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantSlug, email, password } = body;

    const cleanEmail = email?.toLowerCase()?.trim();
    const cleanPassword = password?.trim();
    const cleanTenant = tenantSlug?.trim() || 'cybermind-master-tenant';

    // 1. Try to forward to the backend service if running locally in dev mode
    if (process.env.NODE_ENV === 'development') {
      const backendEndpoints = [
        'http://127.0.0.1:3000/api/v1/identity/auth/login',
        'http://127.0.0.1:3001/api/auth/login',
        'http://127.0.0.1:3010/api/v1/identity/auth/login',
      ];

      for (const endpoint of backendEndpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 500);
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
        } catch {
          // Backend not reachable, fallback to seeded platform credentials
        }
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

      const userRestriction = RESTRICTED_USERS[cleanEmail] || { role: 'SUPER_ADMIN', restrictedPaths: [] };

      try {
        const { userStore } = await import('@/lib/user-store');
        userStore.recordSession({
          email: cleanEmail,
          tenantId: cleanTenant,
          role: userRestriction.role,
          ipAddress: ip,
          userAgent,
        });
      } catch {
        // Edge runtime fallback
      }

      const secret = process.env.JWT_SECRET || 'cybermind-secret-jwt-key-2026';
      const token = createEdgeJwt(
        {
          sub: 'seeded-user-id',
          email: cleanEmail,
          tid: cleanTenant,
          role: userRestriction.role,
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        },
        secret
      );

      return NextResponse.json({
        accessToken: token,
        token: token,
        access_token: token,
        refreshToken: 'seeded-refresh-token',
        user: {
          email: cleanEmail,
          tenantId: cleanTenant,
          role: userRestriction.role,
          restrictedPaths: userRestriction.restrictedPaths,
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
