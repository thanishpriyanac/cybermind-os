export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCves } from '../../../../lib/cve-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || undefined;
  const severity = searchParams.get('severity') || undefined;
  const kevParam = searchParams.get('kev');
  const kev = kevParam === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const results = getCves({ search, severity, kev, page, limit });
  return NextResponse.json(results);
}
