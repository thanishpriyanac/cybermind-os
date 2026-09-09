export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSyncStatus, updateFromNvdData, updateKevData } from '@/lib/cve-store';
import axios from 'axios';

export async function POST() {
  try {
    const status = getSyncStatus();
    if (status.lastNvdSync) {
      const lastSync = new Date(status.lastNvdSync).getTime();
      const now = new Date().getTime();
      // Rate limit: reject if last sync was < 30 minutes ago
      if (now - lastSync < 30 * 60 * 1000) {
        return NextResponse.json({ error: 'Sync already performed recently. Please wait 30 minutes.' }, { status: 429 });
      }
    }

    // Fetch NVD data
    const pubStartDate = '2026-09-01T00:00:00.000';
    const pubEndDate = '2026-09-08T23:59:59.999';
    let nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}`;
    
    const apiKey = process.env.NVD_API_KEY || 'F536F18D-BB15-4F4C-9F5E-3BCEF77FAA64';
    const headers: any = {};
    if (apiKey) {
      headers.apiKey = apiKey;
    }

    const nvdRes = await axios.get(nvdUrl, { headers });
    if (nvdRes.data) {
      updateFromNvdData(nvdRes.data);
    }

    // Fetch CISA KEV
    const kevUrl = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
    const kevRes = await axios.get(kevUrl);
    if (kevRes.data) {
      updateKevData(kevRes.data);
    }

    const newStatus = getSyncStatus();

    return NextResponse.json({
      synced: true,
      total: newStatus.totalCount,
      kevCount: newStatus.kevCount
    });
  } catch (error: any) {
    console.error('Error during CVE sync:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync data' }, { status: 500 });
  }
}
