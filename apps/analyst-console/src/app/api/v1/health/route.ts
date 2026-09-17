export const runtime = 'edge';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Health endpoint — returns mock system metrics.
 * Hardware metrics (CPU, disk, memory) are unavailable on Cloudflare Workers edge runtime.
 * Real metrics come from the backend NestJS server via api-cybermind.vellprint.in/health
 */
export async function GET() {
  const now = new Date().toISOString();
  return NextResponse.json({
    status: 'healthy',
    timestamp: now,
    runtime: 'cloudflare-edge',
    note: 'Hardware metrics are served by the backend API at api-cybermind.vellprint.in/health',
    system: {
      cpu: {
        model: 'Cloudflare Worker (edge)',
        cores: 1,
        usagePercent: 0,
        loadAvg: [0, 0, 0],
      },
      memory: {
        totalMB: 128,
        usedMB: 0,
        freeMB: 128,
        usagePercent: 0,
      },
      disk: {
        totalGB: 0,
        usedGB: 0,
        freeGB: 0,
        usagePercent: 0,
      },
      network: {
        rxMBps: 0,
        txMBps: 0,
      },
      process: {
        pid: 0,
        heapUsedMB: 0,
        heapTotalMB: 0,
        rssMB: 0,
        uptimeSeconds: 0,
        nodeVersion: 'edge',
      },
    },
    services: {
      database: { status: 'unknown', note: 'Check backend API' },
      ai: { status: 'unknown', note: 'Check backend API' },
    },
    stores: {},
  }, { headers: { 'Cache-Control': 'no-store' } });
}
