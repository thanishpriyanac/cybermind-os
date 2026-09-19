import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico', '/api/v1/identity/auth/login', '/health'];
const ADMIN_ONLY_PATHS = ['/admin', '/admin/models', '/settings', '/users', '/api/v1/ai/models'];
const ANALYST_AND_ADMIN_PATHS = ['/cve/sync', '/api/v1/cve/sync', '/api/v1/firewall/upload'];
const SARAVANAN_RESTRICTED_PATHS = ['/qbr', '/firewall', '/toolkit/firewall-rules', '/toolkit/firewall-simulator', '/api/v1/qbr', '/api/v1/firewall'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public static assets, auth API, and health dashboard
  if (
    pathname === '/login' ||
    pathname === '/health' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/v1/identity/auth/login')
  ) {
    return NextResponse.next();
  }

  // Extract authentication token & user info from cookies or headers
  const token = request.cookies.get('token')?.value || request.headers.get('authorization');
  const roleHeader = request.headers.get('x-user-role') || request.cookies.get('user_role')?.value;
  const userEmail = (request.headers.get('x-user-email') || request.cookies.get('user_email')?.value || '').toLowerCase();
  const userRole = (roleHeader || 'ANALYST').toUpperCase();

  // Root path routing
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated users attempting to access protected page routes -> redirect to /login
  if (!token && !pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Guard Restricted User Paths (Saravanan)
  if (userRole === 'RESTRICTED_ANALYST' || userEmail.includes('saravanan')) {
    const isRestrictedPath =
      SARAVANAN_RESTRICTED_PATHS.some((p) => pathname.startsWith(p)) ||
      pathname.startsWith('/view/firewall') ||
      pathname.startsWith('/view/qbr');

    if (isRestrictedPath) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Access to QBR and Firewall modules is restricted for your user account.',
          },
          { status: 403 }
        );
      }
      const moduleName = pathname.includes('qbr') ? 'QBR Executive Reports' : 'Firewall Health Check';
      const accessDeniedUrl = new URL('/access-denied', request.url);
      accessDeniedUrl.searchParams.set('module', moduleName);
      accessDeniedUrl.searchParams.set('user', userEmail || 'saravanan@cybermind.io');
      return NextResponse.redirect(accessDeniedUrl);
    }
  }

  // Guard Admin-Only Routes
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

  // Guard Analyst + Admin Write Operations (Block Guest)
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
  matcher: [
    '/',
    '/dashboard/:path*',
    '/health/:path*',
    '/alerts/:path*',
    '/investigations/:path*',
    '/cve/:path*',
    '/ip/:path*',
    '/vapt/:path*',
    '/firewall/:path*',
    '/playbooks/:path*',
    '/qbr/:path*',
    '/copilot/:path*',
    '/admin/:path*',
    '/toolkit/:path*',
    '/view/:path*',
    '/api/v1/ai/models/:path*',
    '/api/v1/cve/sync',
    '/api/v1/qbr/:path*',
    '/api/v1/firewall/:path*',
  ],
};

