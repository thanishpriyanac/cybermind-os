import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ONLY_PATHS = ['/admin', '/admin/models', '/settings', '/users', '/api/v1/ai/models'];
const ANALYST_AND_ADMIN_PATHS = ['/cve/sync', '/api/v1/cve/sync', '/api/v1/firewall/upload'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract user role from header or cookie
  const roleHeader = request.headers.get('x-user-role') || request.cookies.get('user_role')?.value;
  const userRole = (roleHeader || 'ANALYST').toUpperCase();

  // 1. Guard Admin-Only Routes
  if (ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Administrative privileges required for this resource.',
            requiredRole: 'ADMIN',
          },
          { status: 403 }
        );
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized_admin_access');
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Guard Analyst + Admin Write Operations (Block Guest)
  if (ANALYST_AND_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (userRole === 'GUEST' || userRole === 'VIEWER') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Guest role is restricted to read-only views.',
          requiredRole: 'ANALYST',
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/v1/ai/models/:path*', '/api/v1/cve/sync'],
};
