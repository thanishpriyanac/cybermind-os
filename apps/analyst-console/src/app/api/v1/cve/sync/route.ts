export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSyncStatus, updateFromNvdData, updateKevData, loadStore, saveStore } from '@/lib/cve-store';
import { enforceApiPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit-logger';
import axios from 'axios';

export async function POST(req: NextRequest) {
  // 1. RBAC Guard: Admin-Only feature
  const rbacError = enforceApiPermission(req, 'cve_sync', 'write');
  if (rbacError) return rbacError;

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    const status = getSyncStatus();
    const now = Date.now();

    // Check if synced within the last 30 minutes unless force=true
    if (!force && status.lastNvdSync) {
      const lastSync = new Date(status.lastNvdSync).getTime();
      if (now - lastSync < 30 * 60 * 1000) {
        return NextResponse.json({
          synced: true,
          cached: true,
          message: 'CVE database was synchronized recently (within 30 minutes)',
          lastUpdated: status.lastNvdSync,
          total: status.totalCount,
          kevCount: status.kevCount,
        });
      }
    }

    let nvdSuccess = false;
    let kevSuccess = false;

    // 2. Fetch NVD API v2 Data with 5s timeout
    try {
      const nvdUrl = 'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=50';
      const apiKey = process.env.NVD_API_KEY || 'F536F18D-BB15-4F4C-9F5E-3BCEF77FAA64';
      const headers: Record<string, string> = {
        'User-Agent': 'CyberMind-OS-CVE-Sync/1.0',
      };
      if (apiKey) headers.apiKey = apiKey;

      const nvdRes = await axios.get(nvdUrl, { headers, timeout: 5000 });
      if (nvdRes.data && nvdRes.data.vulnerabilities) {
        updateFromNvdData(nvdRes.data);
        nvdSuccess = true;
      }
    } catch (e: any) {
      console.warn('NVD API v2 sync skipped or timed out, using local threat cache:', e?.message || e);
    }

    // 3. Fetch CISA KEV Feed with 5s timeout
    try {
      const kevUrl = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
      const kevRes = await axios.get(kevUrl, { timeout: 5000 });
      if (kevRes.data) {
        updateKevData(kevRes.data);
        kevSuccess = true;
      }
    } catch (e: any) {
      console.warn('CISA KEV fetch skipped or timed out:', e?.message || e);
    }

    // 4. Update sync timestamps & status
    const store = loadStore();
    store.syncStatus = 'idle';
    store.lastNvdSync = new Date().toISOString();
    store.lastKevSync = new Date().toISOString();
    saveStore(store);

    const newStatus = getSyncStatus();

    // 5. Log Security Audit Event
    logAuditEvent({
      action: 'CVE_DATABASE_SYNC',
      module: 'CVE_INTELLIGENCE',
      resource: 'cve_store.json',
      result: 'SUCCESS',
      details: {
        nvdSuccess,
        kevSuccess,
        totalRecords: newStatus.totalCount,
        kevCount: newStatus.kevCount,
      },
    });

    return NextResponse.json({
      synced: true,
      nvdSuccess,
      kevSuccess,
      lastUpdated: store.lastNvdSync,
      total: newStatus.totalCount,
      kevCount: newStatus.kevCount,
      severityCounts: newStatus.severityCounts,
    });
  } catch (error: any) {
    console.error('Error during CVE sync:', error);
    const store = loadStore();
    store.syncStatus = 'idle';
    saveStore(store);
    
    const status = getSyncStatus();
    return NextResponse.json(
      {
        synced: false,
        error: 'Failed to complete CVE database synchronization',
        total: status.totalCount,
        kevCount: status.kevCount,
      },
      { status: 500 }
    );
  }
}
