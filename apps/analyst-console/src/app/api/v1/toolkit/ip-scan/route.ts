export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, scanType = 'standard', protocol = 'TCP' } = body;

    if (!target) {
      return NextResponse.json({ error: 'Target IP/hostname is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      targetIp: target.includes('.') ? target : '192.168.1.105',
      hostname: target.includes('.') ? `srv-${target.replace(/\./g, '-')}.internal.local` : target,
      scanTime: new Date().toISOString(),
      duration: '1.42s',
      ports: [
        { port: 22, protocol: 'TCP', state: 'OPEN', service: 'SSH', version: 'OpenSSH 8.2p1 Ubuntu', risk: 'MEDIUM' },
        { port: 80, protocol: 'TCP', state: 'OPEN', service: 'HTTP', version: 'nginx 1.18.0', risk: 'LOW' },
        { port: 443, protocol: 'TCP', state: 'OPEN', service: 'HTTPS', version: 'nginx 1.18.0 (TLS v1.3)', risk: 'INFO' },
        { port: 3389, protocol: 'TCP', state: 'OPEN', service: 'RDP', version: 'Microsoft Remote Desktop Services', risk: 'HIGH' },
        { port: 8080, protocol: 'TCP', state: 'OPEN', service: 'HTTP-ALT', version: 'Apache Tomcat 9.0.31', risk: 'CRITICAL' },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Port scan failed' }, { status: 500 });
  }
}
