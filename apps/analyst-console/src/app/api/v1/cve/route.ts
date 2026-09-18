export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCves, updateFromNvdData } from '../../../../lib/cve-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || undefined;
  const severity = searchParams.get('severity') || undefined;
  const kevParam = searchParams.get('kev');
  const kev = kevParam === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let results = getCves({ search, severity, kev, page, limit });

  // If search performed and fewer than 2 results found, fetch live from NVD API
  if (search && results.data.length < 2) {
    try {
      const isCveId = search.toUpperCase().startsWith('CVE-');
      const paramName = isCveId ? 'cveId' : 'keywordSearch';
      const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?${paramName}=${encodeURIComponent(search.trim())}&resultsPerPage=20`;
      
      const res = await fetch(nvdUrl, {
        headers: { 'User-Agent': 'CyberMind-OS/2.0' },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const nvdData = await res.json();
        if (nvdData?.vulnerabilities?.length > 0) {
          updateFromNvdData(nvdData);
          results = getCves({ search, severity, kev, page, limit });
        }
      }
    } catch (err) {
      console.warn('Live NVD search query failed:', err);
    }
  }

  return NextResponse.json(results);
}

