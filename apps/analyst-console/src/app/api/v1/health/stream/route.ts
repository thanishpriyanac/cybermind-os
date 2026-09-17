export const runtime = 'edge';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Health SSE stream — returns a single mock snapshot.
 * Hardware metrics are unavailable on Cloudflare Workers edge runtime.
 * Real metrics are served by the backend API.
 */
export async function GET(_req: NextRequest) {
  const snapshot = JSON.stringify({
    timestamp: new Date().toISOString(),
    runtime: 'cloudflare-edge',
    system: {
      cpu: { usagePercent: 0, cores: 1, model: 'Cloudflare Worker (edge)', loadAvg: [0, 0, 0] },
      memory: { totalMB: 128, usedMB: 0, freeMB: 128, usagePercent: 0 },
      disk: { totalGB: 0, usedGB: 0, freeGB: 0, usagePercent: 0 },
      network: { rxMBps: 0, txMBps: 0 },
      temperatures: [],
      fanSpeeds: [],
      voltages: [],
      process: { pid: 0, heapUsedMB: 0, heapTotalMB: 0, rssMB: 0, uptimeSeconds: 0, nodeVersion: 'edge' },
    },
  });

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${snapshot}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
