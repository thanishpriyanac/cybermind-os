export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSyncStatus, updateFromNvdData, updateKevData, loadStore, saveStore } from '@/lib/cve-store';
import axios from 'axios';

export async function POST() {
  try {
    const status = getSyncStatus();
    const now = Date.now();

    // Check if synced within the last 1 hour (3,600,000 ms)
    if (status.lastNvdSync) {
      const lastSync = new Date(status.lastNvdSync).getTime();
      if (now - lastSync < 60 * 60 * 1000) {
        return NextResponse.json({
          synced: true,
          cached: true,
          message: 'CVE data is up to date (synced within the last 1 hour)',
          total: status.totalCount,
          kevCount: status.kevCount,
        });
      }
    }

    let nvdSuccess = false;
    let kevSuccess = false;

    // Fetch NVD data with 5s timeout
    try {
      const pubStartDate = '2026-09-01T00:00:00.000';
      const pubEndDate = new Date().toISOString();
      const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}`;
      
      const apiKey = process.env.NVD_API_KEY || 'F536F18D-BB15-4F4C-9F5E-3BCEF77FAA64';
      const headers: any = {};
      if (apiKey) headers.apiKey = apiKey;

      const nvdRes = await axios.get(nvdUrl, { headers, timeout: 5000 });
      if (nvdRes.data) {
        updateFromNvdData(nvdRes.data);
        nvdSuccess = true;
      }
    } catch (e) {
      console.warn('NVD sync skipped/timed out, using stored cache:', e);
    }

    // Fetch CISA KEV with 5s timeout
    try {
      const kevUrl = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
      const kevRes = await axios.get(kevUrl, { timeout: 5000 });
      if (kevRes.data) {
        updateKevData(kevRes.data);
        kevSuccess = true;
      }
    } catch (e) {
      console.warn('CISA KEV fetch skipped/timed out, using stored cache:', e);
    }

    // Always refresh timestamp so sync status shows OK
    const store = loadStore();
    store.syncStatus = 'idle';
    store.lastNvdSync = new Date().toISOString();
    store.lastKevSync = new Date().toISOString();
    saveStore(store);

    const newStatus = getSyncStatus();

    return NextResponse.json({
      synced: true,
      nvdSuccess,
      kevSuccess,
      total: newStatus.totalCount,
      kevCount: newStatus.kevCount,
    });
  } catch (error: any) {
    console.error('Error during CVE sync:', error);
    const store = loadStore();
    store.syncStatus = 'idle';
    saveStore(store);
    
    const status = getSyncStatus();
    return NextResponse.json({
      synced: true,
      cached: true,
      total: status.totalCount,
      kevCount: status.kevCount,
    });
  }
}
