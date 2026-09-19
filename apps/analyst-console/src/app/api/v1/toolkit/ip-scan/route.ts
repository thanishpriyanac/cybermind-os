export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import dns from 'dns/promises';

const COMMON_PORTS = [
  { port: 21, service: 'FTP', risk: 'HIGH' },
  { port: 22, service: 'SSH', risk: 'MEDIUM' },
  { port: 25, service: 'SMTP', risk: 'MEDIUM' },
  { port: 53, service: 'DNS', risk: 'LOW' },
  { port: 80, service: 'HTTP', risk: 'LOW' },
  { port: 443, service: 'HTTPS', risk: 'INFO' },
  { port: 3306, service: 'MySQL', risk: 'HIGH' },
  { port: 3389, service: 'RDP', risk: 'HIGH' },
  { port: 5432, service: 'PostgreSQL', risk: 'HIGH' },
  { port: 8080, service: 'HTTP-Alt', risk: 'MEDIUM' },
  { port: 8443, service: 'HTTPS-Alt', risk: 'LOW' },
];

function checkPort(
  host: string,
  port: number,
  timeoutMs = 1200
): Promise<{ port: number; state: 'OPEN' | 'CLOSED' | 'FILTERED'; latencyMs: number; service: string; risk: string }> {
  const meta = COMMON_PORTS.find((p) => p.port === port) || { service: 'UNKNOWN', risk: 'INFO' };
  return new Promise((resolve) => {
    const t0 = Date.now();
    const socket = new net.Socket();
    let isFinished = false;

    const finish = (state: 'OPEN' | 'CLOSED' | 'FILTERED') => {
      if (isFinished) return;
      isFinished = true;
      socket.destroy();
      resolve({
        port,
        state,
        latencyMs: Date.now() - t0,
        service: meta.service,
        risk: meta.risk,
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish('OPEN'));
    socket.once('timeout', () => finish('FILTERED'));
    socket.once('error', () => finish('CLOSED'));

    try {
      socket.connect(port, host);
    } catch {
      finish('CLOSED');
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target } = body;

    if (!target || typeof target !== 'string' || !target.trim()) {
      return NextResponse.json({ error: 'Target IP/hostname is required' }, { status: 400 });
    }

    const cleanTarget = target.trim().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

    // Resolve target to IP if hostname
    let targetIp = cleanTarget;
    try {
      const lookup = await dns.lookup(cleanTarget);
      targetIp = lookup.address;
    } catch {
      // Keep as provided if lookup fails
    }

    const t0 = Date.now();
    const results = await Promise.all(
      COMMON_PORTS.map((p) => checkPort(targetIp, p.port, 1200))
    );
    const duration = ((Date.now() - t0) / 1000).toFixed(2);

    const openPorts = results.filter((r) => r.state === 'OPEN');

    return NextResponse.json({
      success: true,
      targetIp,
      hostname: cleanTarget,
      scanTime: new Date().toISOString(),
      duration: `${duration}s`,
      portsScanned: COMMON_PORTS.length,
      openCount: openPorts.length,
      ports: results.map((r) => ({
        port: r.port,
        protocol: 'TCP',
        state: r.state,
        service: r.service,
        latencyMs: r.latencyMs,
        risk: r.risk,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Port scan failed' }, { status: 500 });
  }
}
